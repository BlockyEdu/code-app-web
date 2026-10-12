import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  CaretRightOutlined,
  CheckOutlined,
  LockOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, Segmented } from "antd";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { t } from "../../lib/i18n";
import { createIotWorld, evaluateIotScene, type IotWorldState } from "../../lib/targets/iot-lab";
import { clamp, isRaining } from "../../workspace/stage/map-scene";
import { SmartWindowScene } from "../../workspace/stage/SmartWindowScene";
import { useSiteActions } from "../SiteShell";
import styles from "./ChainDemo.module.scss";
import { CodeLines, RAIN_CLOSE_LINES } from "./CodeLines";
import { SectionHead } from "./SectionHead";

const PACK = "smart-window" as const;
const START = { position: 80, limit_open: 1, limit_close: 0 };
/** ms after Run when each step starts. Step 5 is the last one. */
const STEP_DELAYS = [500, 1500, 2500, 3500, 4700];
const STEP_KEYS = ["rain", "telemetry", "command", "window", "phone"] as const;
const TOPIC_TELEMETRY = "v1/devices/me/telemetry";
const TOPIC_RPC = "v1/devices/me/rpc/request/1";

type Pane = "logic" | "device" | "mqtt" | "phone";
const ACTIVE_PANE: ReadonlyArray<Pane | null> = [
  null,
  "device",
  "mqtt",
  "logic",
  "device",
  "phone",
];
/** Connector between pane N and N+1 lights up on these steps. */
const ACTIVE_CONNECTOR: ReadonlyArray<number | null> = [null, null, 1, 0, null, 2];

type Msg = { id: string; kind: "PUB" | "RPC"; topic: string; payload: string };

function buildChain() {
  const idle = createIotWorld(PACK, START);
  const rainy = createIotWorld(PACK, { ...START, rain: 1 });
  const closed = createIotWorld(PACK, { ...START, rain: 1 });
  evaluateIotScene(closed, "win-rain-close");
  return { idle, rainy, closed };
}

function telemetryPayload(world: IotWorldState, overrides?: { rain?: number; position?: number }) {
  return JSON.stringify({
    rain: overrides?.rain ?? world.channels.rain,
    position: overrides?.position ?? world.channels.position,
  });
}

function usePrefersReducedMotion(): boolean {
  const [reduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  return reduced;
}

export default function ChainDemo() {
  const { openSample } = useSiteActions();
  const reduced = usePrefersReducedMotion();
  const chain = useMemo(buildChain, []);
  const [view, setView] = useState<"blocks" | "code">("blocks");
  const [step, setStep] = useState(() => (reduced ? 5 : 0));
  const [manualPosition, setManualPosition] = useState<number | null>(null);
  const [manualMessages, setManualMessages] = useState<Msg[]>([]);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: clearTimers only touches a ref
  useEffect(() => clearTimers, []);

  const play = () => {
    clearTimers();
    setManualPosition(null);
    setManualMessages([]);
    if (reduced) {
      setStep(5);
      return;
    }
    setStep(0);
    STEP_DELAYS.forEach((delay, index) => {
      timers.current.push(window.setTimeout(() => setStep(index + 1), delay));
    });
  };

  const running = step > 0 && step < 5;
  const idleWorld = chain.idle;
  const deviceWorld = step >= 4 ? chain.closed : step >= 1 ? chain.rainy : idleWorld;
  const manual = step === 0 && manualPosition !== null;
  const devicePosition = manual ? manualPosition : clamp(deviceWorld.channels.position, 0, 100);
  const deviceRaining = isRaining(deviceWorld.channels.rain);

  const phoneWorld = step >= 5 ? chain.closed : idleWorld;
  const phonePosition = manual ? manualPosition : clamp(phoneWorld.channels.position, 0, 100);
  const phoneRaining = isRaining(phoneWorld.channels.rain);
  const phoneOpen = phonePosition > 5;
  const phoneLocked = phoneRaining && !phoneOpen;

  const runMessages: Msg[] = [];
  if (step >= 2) {
    runMessages.push({
      id: "t1",
      kind: "PUB",
      topic: TOPIC_TELEMETRY,
      payload: telemetryPayload(chain.rainy),
    });
  }
  if (step >= 3) {
    runMessages.push({
      id: "rpc",
      kind: "RPC",
      topic: TOPIC_RPC,
      payload: JSON.stringify({ method: "close", params: {} }),
    });
  }
  if (step >= 4) {
    runMessages.push({
      id: "t2",
      kind: "PUB",
      topic: TOPIC_TELEMETRY,
      payload: telemetryPayload(chain.closed),
    });
  }
  const messages = (step > 0 ? runMessages : manualMessages).slice(-3);

  const onPhoneButton = () => {
    if (step !== 0) return;
    const method = phoneOpen ? "close" : "open";
    const position = phoneOpen ? chain.closed.channels.position : START.position;
    const id = manualMessages.length;
    setManualPosition(position);
    setManualMessages((prev) => [
      ...prev,
      {
        id: `m${id}-rpc`,
        kind: "RPC",
        topic: TOPIC_RPC,
        payload: JSON.stringify({ method, params: {} }),
      },
      {
        id: `m${id}-pub`,
        kind: "PUB",
        topic: TOPIC_TELEMETRY,
        payload: telemetryPayload(idleWorld, { position }),
      },
    ]);
  };

  const activePane = ACTIVE_PANE[step];
  const activeConnector = ACTIVE_CONNECTOR[step];

  return (
    <section className={styles.section} aria-labelledby="home-chain-title">
      <SectionHead
        id="home-chain-title"
        title={t("home.chain.title")}
        lead={t("home.chain.lead")}
        actions={
          <>
            <Button
              type="primary"
              size="large"
              icon={step === 5 ? <ReloadOutlined /> : <CaretRightOutlined />}
              disabled={running}
              onClick={play}
            >
              {step === 5 ? t("home.chain.replay") : t("home.chain.run")}
            </Button>
            <Button
              size="large"
              icon={<ArrowRightOutlined />}
              iconPlacement="end"
              onClick={() => openSample("smart-window")}
            >
              {t("home.chain.open")}
            </Button>
          </>
        }
      />
      <div className={styles.card}>
        <div className={styles.flow}>
          <ChainPane
            index={1}
            title={t("home.chain.paneLogic")}
            caption={t("home.chain.capLogic")}
            active={activePane === "logic"}
            action={
              <Segmented
                size="small"
                value={view}
                onChange={(value) => setView(value as "blocks" | "code")}
                options={[
                  { label: t("home.chain.blocks"), value: "blocks" },
                  { label: t("home.chain.code"), value: "code" },
                ]}
              />
            }
          >
            <div className={`${styles.dark} ${styles.logicBody}`}>
              {view === "blocks" ? (
                <LogicBlocks lit={step === 3} />
              ) : (
                <CodeLines lines={RAIN_CLOSE_LINES} activeLines={step === 3 ? [1, 2, 3] : []} />
              )}
            </div>
          </ChainPane>
          <Connector active={activeConnector === 0} />
          <ChainPane
            index={2}
            title={t("home.chain.paneDevice")}
            caption={t("home.chain.capDevice")}
            active={activePane === "device"}
          >
            <div className={`${styles.dark} ${styles.deviceBody}`}>
              <SmartWindowScene
                label={t("stage.sceneTitle.window")}
                openPct={devicePosition}
                raining={deviceRaining}
              />
              <div className={styles.readouts}>
                <span className={styles.readout}>
                  position <b>{Math.round(devicePosition)}</b>
                </span>
                <span className={styles.readout}>
                  rain <b>{deviceRaining ? 1 : 0}</b>
                </span>
              </div>
            </div>
          </ChainPane>
          <Connector active={activeConnector === 1} />
          <ChainPane
            index={3}
            title={t("home.chain.paneMqtt")}
            caption={t("home.chain.capMqtt")}
            active={activePane === "mqtt"}
          >
            <div className={`${styles.dark} ${styles.mqttBody}`}>
              {messages.length === 0 ? (
                <div className={styles.empty}>
                  <p>{t("home.chain.tickerEmpty")}</p>
                  <span className={styles.topic}>{TOPIC_TELEMETRY}</span>
                  <span className={styles.topic}>{TOPIC_RPC}</span>
                </div>
              ) : (
                <ul className={styles.ticker}>
                  {messages.map((msg) => (
                    <li key={msg.id} className={styles.msg}>
                      <span
                        className={`${styles.msgTag} ${msg.kind === "RPC" ? styles.msgRpc : ""}`}
                      >
                        {msg.kind === "RPC" ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                        {msg.kind}
                      </span>
                      <span className={styles.msgTopic}>{msg.topic}</span>
                      <span className={styles.msgPayload}>{msg.payload}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ChainPane>
          <Connector active={activeConnector === 2} />
          <ChainPane
            index={4}
            title={t("home.chain.panePhone")}
            caption={t("home.chain.capPhone")}
            active={activePane === "phone"}
          >
            <div className={styles.phoneBody}>
              <div className={styles.phone}>
                <div className={styles.phoneBar}>
                  <span className={styles.phoneTitle}>{t("stage.sceneTitle.window")}</span>
                  <span className={styles.capsule} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
                <div className={styles.phoneCard}>
                  <WindowGlyph open={phoneOpen} />
                  <div className={styles.phoneState}>
                    <span className={styles.phoneLabel}>{t("home.chain.phoneState")}</span>
                    <strong
                      className={`${styles.phoneValue} ${phoneOpen ? styles.isOpen : styles.isClosed}`}
                    >
                      {phoneOpen ? t("home.chain.phoneOpen") : t("home.chain.phoneClosed")}
                    </strong>
                  </div>
                </div>
                <div className={styles.phoneStats}>
                  <span className={styles.phoneStat}>
                    <span className={styles.phoneLabel}>{t("iotCh.rain")}</span>
                    <strong className={phoneRaining ? styles.isRain : undefined}>
                      {phoneRaining ? t("home.chain.phoneRaining") : t("home.chain.phoneDry")}
                    </strong>
                  </span>
                  <span className={styles.phoneStat}>
                    <span className={styles.phoneLabel}>{t("iotCh.temperature")}</span>
                    <strong>
                      {phoneWorld.channels.temperature}
                      {t("stage.unit.c")}
                    </strong>
                  </span>
                </div>
                <Button
                  type="primary"
                  size="small"
                  block
                  disabled={running || phoneLocked}
                  onClick={onPhoneButton}
                >
                  {phoneOpen ? t("iotCmd.close") : t("iotCmd.open")}
                </Button>
                <p className={`${styles.locked} ${phoneLocked ? styles.lockedOn : ""}`}>
                  <LockOutlined /> {t("home.chain.phoneLocked")}
                </p>
              </div>
            </div>
          </ChainPane>
        </div>
        <ol className={styles.steps} aria-label={t("home.chain.stepsLabel")}>
          {STEP_KEYS.map((key, index) => {
            const number = index + 1;
            const done = step > number || (step === 5 && number === 5);
            const current = step === number && !done;
            return (
              <li
                key={key}
                className={`${styles.stepItem} ${done ? styles.stepDone : ""} ${current ? styles.stepActive : ""}`}
                aria-current={current ? "step" : undefined}
              >
                <span className={styles.stepDot}>{done ? <CheckOutlined /> : number}</span>
                {t(`home.chain.steps.${key}`)}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function ChainPane({
  index,
  title,
  caption,
  active,
  action,
  children,
}: {
  index: number;
  title: string;
  caption: string;
  active: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.pane} ${active ? styles.paneActive : ""}`}>
      <header className={styles.paneHead}>
        <span className={styles.paneNum}>{index}</span>
        <h3 className={styles.paneTitle}>{title}</h3>
        {action ? <span className={styles.paneAction}>{action}</span> : null}
      </header>
      {children}
      <p className={styles.caption}>{caption}</p>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div className={`${styles.connector} ${active ? styles.connectorOn : ""}`} aria-hidden="true">
      <svg viewBox="0 0 40 16" width="40" height="16">
        <title>→</title>
        <line x1="3" y1="8" x2="30" y2="8" className={styles.connectorLine} />
        <path d="M28 3 L36 8 L28 13" className={styles.connectorHead} />
      </svg>
    </div>
  );
}

function LogicBlocks({ lit }: { lit: boolean }) {
  return (
    <div className={styles.blocks}>
      <div className={`${styles.block} ${styles.blockEvent}`}>{t("home.chain.blkEvent")}</div>
      <div className={`${styles.block} ${styles.blockSensor}`}>{t("home.chain.blkIf")}</div>
      <div className={styles.nest}>
        <div className={`${styles.block} ${styles.blockDevice} ${lit ? styles.blockLit : ""}`}>
          {t("home.chain.blkClose")}
        </div>
      </div>
    </div>
  );
}

function WindowGlyph({ open }: { open: boolean }) {
  return (
    <svg className={styles.glyph} viewBox="0 0 44 40" aria-hidden="true">
      <title>{t("stage.sceneTitle.window")}</title>
      <rect x="3" y="3" width="38" height="34" rx="4" className={styles.glyphFrame} />
      <rect x="8" y="8" width="28" height="24" rx="2" className={styles.glyphGlass} />
      <rect
        x="8"
        y="8"
        width="28"
        height="24"
        rx="2"
        className={styles.glyphSash}
        style={{ transform: `scaleY(${open ? 0.34 : 1})` }}
      />
    </svg>
  );
}
