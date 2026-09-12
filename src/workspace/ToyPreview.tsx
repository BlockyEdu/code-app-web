import { App as AntdApp } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { errorCodeOf } from "../lib/http";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import type { WorldState } from "../lib/targets";
import { applyServerStateToToy, asToyServerState } from "../lib/toy-world-map";
import { useWorkspaceStore } from "../stores/workspace";
import styles from "./PreviewPanel.module.scss";

const LED_COLORS: Record<string, string> = {
  red: "#ef4444",
  green: "#22c55e",
  blue: "#2563eb",
  yellow: "#f59e0b",
  off: "#334155",
};

export function ToyPreview({ world }: { world: WorldState | null }) {
  useLocaleStore((s) => s.locale);
  const { message } = AntdApp.useApp();
  const setToySessionId = useWorkspaceStore((s) => s.setToySessionId);
  const setPreviewWorld = useWorkspaceStore((s) => s.setPreviewWorld);
  const toySessionId = useWorkspaceStore((s) => s.toySessionId);
  const [busy, setBusy] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState<string>("");
  const busyRef = useRef(false);
  const ensureRef = useRef<Promise<string | null> | null>(null);

  const toy = world?.toy;
  const led = toy?.led || "off";
  const ledColor = LED_COLORS[led] || LED_COLORS.off;
  const log = toy?.timeline?.length ? toy.timeline.slice(-6) : [t("preview.toyIdle")];

  const mergeState = useCallback(
    (raw: unknown, meta?: { tick?: number; status?: string }) => {
      const serverState = asToyServerState(raw);
      if (!serverState) return;
      if (typeof meta?.tick === "number") setTick(meta.tick);
      if (meta?.status) setStatus(meta.status);
      const current = useWorkspaceStore.getState().previewWorld;
      const nextWorld = current ?? {
        kind: "toy" as const,
        web: { title: "", primary: "", background: "", elements: [], notices: [] },
        miniapp: { pages: [], activePage: "", data: {}, toasts: [] },
        home: {
          lights: {},
          devices: {},
          temperature: 24,
          sensors: {},
          scene: "",
          timeline: [],
        },
        toy: applyServerStateToToy(undefined, serverState),
        iot: null,
      };
      setPreviewWorld({
        ...nextWorld,
        toy: applyServerStateToToy(nextWorld.toy, serverState),
      });
    },
    [setPreviewWorld],
  );

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (ensureRef.current) return ensureRef.current;
    const run = (async () => {
      const { toySessionId: existingId, artifactId, previewWorld } = useWorkspaceStore.getState();
      const hasLocalTwin = Boolean(previewWorld?.toy?.timeline?.length);

      const adoptMeta = (sim: { tick?: number; status?: string; state?: unknown }) => {
        if (typeof sim.tick === "number") setTick(sim.tick);
        if (sim.status) setStatus(sim.status);
        if (!hasLocalTwin) mergeState(sim.state, { tick: sim.tick, status: sim.status });
      };

      if (existingId) {
        try {
          const sim = await api.getToySimulation(existingId);
          adoptMeta(sim);
          setApiOnline(true);
          return useWorkspaceStore.getState().toySessionId ?? existingId;
        } catch (err) {
          const code = errorCodeOf(err);
          if (code === "TOY-SIM-ERR-EXPIRED" || code === "TOY-SIM-ERR-NOT-FOUND") {
            setToySessionId(null);
          } else {
            setApiOnline(false);
            return null;
          }
        }
      }
      if (!artifactId) {
        message.warning(t("preview.injectNeedRun"));
        return null;
      }
      try {
        const sim = await api.createToySimulation({ artifactId });
        setToySessionId(sim.id);
        adoptMeta(sim);
        setApiOnline(true);
        return sim.id;
      } catch {
        setApiOnline(false);
        return null;
      }
    })();
    ensureRef.current = run;
    try {
      return await run;
    } finally {
      if (ensureRef.current === run) ensureRef.current = null;
    }
  }, [mergeState, message, setToySessionId]);

  useEffect(() => {
    if (!toySessionId) return;
    void ensureSession().catch(() => {
      /* hydrate is best-effort */
    });
  }, [ensureSession, toySessionId]);

  const withSession = useCallback(
    async (action: (sessionId: string) => Promise<void>) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const sessionId = await ensureSession();
        if (!sessionId) {
          if (useWorkspaceStore.getState().artifactId) {
            message.warning(t("preview.toyApiOffline"));
          }
          return;
        }
        await action(sessionId);
      } catch (err) {
        const code = errorCodeOf(err);
        if (code === "TOY-SIM-ERR-EXPIRED" || code === "TOY-SIM-ERR-NOT-FOUND") {
          setToySessionId(null);
          message.error(t("preview.injectExpired"));
        } else {
          setApiOnline(false);
          message.error(t("preview.injectFailed"));
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [ensureSession, message, setToySessionId],
  );

  const runStep = () => {
    void withSession(async (sessionId) => {
      const sim = await api.runToySimulation(sessionId, { mode: "step" });
      mergeState(sim.state, { tick: sim.tick, status: sim.status });
      setApiOnline(true);
    });
  };

  const inject = (body: {
    type: "sensor" | "input" | "reset" | "custom";
    name?: string;
    payload?: Record<string, unknown>;
  }) => {
    void withSession(async (sessionId) => {
      const result = await api.injectToySimulationEvent(sessionId, body);
      mergeState(result.state, { tick: result.appliedTick, status: result.status });
      setApiOnline(true);
    });
  };

  return (
    <div className={styles.toyPreview}>
      <div className={styles.homeNotice}>
        {t("preview.toyVirtual")}
        {status ? ` · ${t("preview.toyStatus", { status })}` : ""}
        {tick > 0 ? ` · ${t("preview.toyTick", { tick })}` : ""}
        {!apiOnline ? ` · ${t("preview.toyApiOffline")}` : ""}
      </div>
      <div className={styles.injectBar}>
        <div className={styles.injectGroup}>
          <span className={styles.injectLabel}>{t("preview.toyControls")}</span>
          <div className={styles.sceneRow}>
            <button type="button" className={styles.sceneBtn} disabled={busy} onClick={runStep}>
              {t("preview.toyStep")}
            </button>
            <button
              type="button"
              className={styles.sceneBtn}
              disabled={busy}
              onClick={() => inject({ type: "input", name: "button.a" })}
            >
              {t("preview.toyLed")}
            </button>
            <button
              type="button"
              className={styles.sceneBtn}
              disabled={busy}
              onClick={() => inject({ type: "input", name: "imu.shake" })}
            >
              {t("preview.toyShake")}
            </button>
            <button
              type="button"
              className={styles.sceneBtn}
              disabled={busy}
              onClick={() => inject({ type: "reset" })}
            >
              {t("preview.toyReset")}
            </button>
          </div>
        </div>
      </div>
      <div className={styles.toyDevice}>
        <div className={styles.toyBoard}>
          <div className={styles.toyChip}>CPU</div>
          <div
            className={styles.toyLed}
            style={{ background: ledColor, boxShadow: `0 0 12px ${ledColor}` }}
          />
          <div className={styles.toyMotorLabel}>
            {toy ? `${toy.moving} @${toy.speed}` : "MOTOR"}
          </div>
        </div>
        {toy?.speech && <div className={styles.webHeroSub}>「{toy.speech}」</div>}
        <div className={styles.toyControls}>
          <span className={styles.toyBtn}>
            {t("preview.toyPose", {
              x: Math.round(toy?.x ?? 50),
              y: Math.round(toy?.y ?? 70),
              heading: toy?.heading ?? 0,
            })}
          </span>
          {toy?.sound && (
            <span className={`${styles.toyBtn} ${styles.toyBtnActive}`}>♪ {toy.sound}</span>
          )}
        </div>
      </div>
      <div className={styles.toyLog}>
        {log.map((line) => (
          <div key={line} className={styles.toyLogLine}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
