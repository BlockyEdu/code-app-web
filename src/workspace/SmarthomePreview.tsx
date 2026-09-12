import { App as AntdApp } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { errorCodeOf } from "../lib/http";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import {
  applyServerWorldToHome,
  lightDeviceId,
  nonLightDeviceId,
  type SmarthomeServerWorld,
} from "../lib/smarthome-world-map";
import type { WorldState } from "../lib/targets";
import { useWorkspaceStore } from "../stores/workspace";
import styles from "./PreviewPanel.module.scss";

const SCENES = ["home", "away", "sleep", "movie"] as const;
const SENSOR_KINDS = ["temperature", "humidity"] as const;
const DEVICE_KINDS = ["curtain", "socket", "fan", "alarm", "light", "ac"] as const;

function roomLabel(room: string): string {
  const key = `room.${room}`;
  const label = t(key);
  return label === key ? room : label;
}

function sceneLabel(scene: string): string {
  const key = `scene.${scene}`;
  const label = t(key);
  return label === key ? scene : label;
}

function deviceLabel(key: string): string {
  const kind = DEVICE_KINDS.find((item) => key === item || key.startsWith(`${item}-`));
  if (!kind) return key;
  return t(`device.${kind}`);
}

function asServerWorld(world: unknown): SmarthomeServerWorld | null {
  if (!world || typeof world !== "object") return null;
  return world as SmarthomeServerWorld;
}

export function SmarthomePreview({ world }: { world: WorldState | null }) {
  useLocaleStore((s) => s.locale);
  const { message } = AntdApp.useApp();
  const setSmarthomeSessionId = useWorkspaceStore((s) => s.setSmarthomeSessionId);
  const setPreviewWorld = useWorkspaceStore((s) => s.setPreviewWorld);
  const smarthomeSessionId = useWorkspaceStore((s) => s.smarthomeSessionId);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const lastWorldRef = useRef<SmarthomeServerWorld | null>(null);
  const ensureRef = useRef<Promise<string | null> | null>(null);
  const [sensorKind, setSensorKind] = useState<(typeof SENSOR_KINDS)[number]>("temperature");
  const [sensorValue, setSensorValue] = useState("24");

  const home = world?.home;
  const rooms = Object.keys(home?.lights ?? { living: 1, bedroom: 1, kitchen: 1 });
  const knownScene = home?.scene && SCENES.includes(home.scene as (typeof SCENES)[number]);
  const timeline = home?.timeline?.length
    ? home.timeline.slice(-8)
    : [t("preview.homeIdle1"), t("preview.homeIdle2")];

  const mergeWorld = useCallback(
    (raw: unknown) => {
      const serverWorld = asServerWorld(raw);
      if (!serverWorld) return;
      lastWorldRef.current = serverWorld;
      const current = useWorkspaceStore.getState().previewWorld;
      if (!current) return;
      setPreviewWorld({
        ...current,
        home: applyServerWorldToHome(current.home, serverWorld),
      });
    },
    [setPreviewWorld],
  );

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (ensureRef.current) return ensureRef.current;
    const run = (async () => {
      const { smarthomeSessionId, artifactId } = useWorkspaceStore.getState();
      if (smarthomeSessionId) {
        if (!lastWorldRef.current) {
          try {
            const sim = await api.getSmarthomeSession(smarthomeSessionId);
            mergeWorld(sim.world);
          } catch (err) {
            if (errorCodeOf(err) !== "SMARTHOME-ERR-EXPIRED") throw err;
            setSmarthomeSessionId(null);
          }
        }
        if (lastWorldRef.current) {
          return useWorkspaceStore.getState().smarthomeSessionId ?? smarthomeSessionId;
        }
      }
      if (!artifactId) {
        message.warning(t("preview.injectNeedRun"));
        return null;
      }
      const sim = await api.createSmarthomeSession({ artifactId });
      setSmarthomeSessionId(sim.id);
      mergeWorld(sim.world);
      return sim.id;
    })();
    ensureRef.current = run;
    try {
      return await run;
    } finally {
      if (ensureRef.current === run) ensureRef.current = null;
    }
  }, [mergeWorld, message, setSmarthomeSessionId]);

  useEffect(() => {
    if (!smarthomeSessionId) return;
    void ensureSession().catch(() => {
      /* hydrate is best-effort; inject toasts errors */
    });
  }, [ensureSession, smarthomeSessionId]);

  const inject = useCallback(
    async (body: {
      type: "sensor" | "device_toggle" | "scene";
      sensor?: string;
      value?: number;
      room?: string;
      clientKey?: string;
      scene?: string;
    }) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const sessionId = await ensureSession();
        if (!sessionId) return;
        const payload =
          body.type === "device_toggle"
            ? {
                type: "device_toggle" as const,
                deviceId: body.room
                  ? lightDeviceId(lastWorldRef.current, body.room)
                  : nonLightDeviceId(lastWorldRef.current, body.clientKey ?? ""),
              }
            : body;
        const session = await api.injectSmarthomeEvent(sessionId, payload);
        mergeWorld(session.world);
      } catch (err) {
        if (errorCodeOf(err) === "SMARTHOME-ERR-EXPIRED") {
          lastWorldRef.current = null;
          setSmarthomeSessionId(null);
          message.error(t("preview.injectExpired"));
        } else {
          message.error(t("preview.injectFailed"));
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [ensureSession, mergeWorld, message, setSmarthomeSessionId],
  );

  const injectSensor = () => {
    const value = Number(sensorValue);
    if (!Number.isFinite(value)) {
      message.error(t("preview.injectFailed"));
      return;
    }
    void inject({ type: "sensor", sensor: sensorKind, value });
  };

  return (
    <div className={styles.homePreview}>
      <div className={styles.homeNotice}>
        {t("preview.homeVirtual")}
        {" · "}
        {knownScene
          ? t("preview.homeScene", { scene: sceneLabel(home?.scene ?? "") })
          : t("preview.homeNotLive")}
        {home ? ` · ${t("preview.homeAc", { temp: home.temperature })}` : ""}
      </div>
      <div className={styles.injectBar}>
        <div className={styles.injectGroup}>
          <span className={styles.injectLabel}>{t("preview.injectScene")}</span>
          <div className={styles.sceneRow}>
            {SCENES.map((scene) => (
              <button
                key={scene}
                type="button"
                className={styles.sceneBtn}
                disabled={busy}
                onClick={() => void inject({ type: "scene", scene })}
              >
                {t(`scene.${scene}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.injectGroup}>
          <span className={styles.injectLabel}>{t("preview.injectSensor")}</span>
          <div className={styles.injectSensorRow}>
            <select
              className={styles.injectSelect}
              value={sensorKind}
              disabled={busy}
              onChange={(ev) => setSensorKind(ev.target.value as (typeof SENSOR_KINDS)[number])}
            >
              {SENSOR_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`sensor.${kind}`)}
                </option>
              ))}
            </select>
            <input
              className={styles.injectInput}
              type="number"
              value={sensorValue}
              disabled={busy}
              onChange={(ev) => setSensorValue(ev.target.value)}
            />
            <button
              type="button"
              className={styles.injectBtn}
              disabled={busy}
              onClick={injectSensor}
            >
              {t("preview.injectSensor")}
            </button>
          </div>
        </div>
      </div>
      <div className={styles.deviceGrid}>
        {rooms.map((room) => {
          const light = home?.lights[room];
          return (
            <button
              key={room}
              type="button"
              className={`${styles.deviceCard} ${styles.injectDeviceBtn} ${light?.on ? styles.deviceCardOn : ""}`}
              disabled={busy}
              onClick={() => void inject({ type: "device_toggle", room })}
            >
              <span className={styles.deviceName}>
                {t("preview.lightName", { room: roomLabel(room) })}
              </span>
              <span className={styles.deviceMeta}>{t("preview.lightMeta")}</span>
              <span className={styles.deviceStatus}>
                {light?.on ? "ON" : "OFF"} · {light?.brightness ?? 0}%
              </span>
            </button>
          );
        })}
        {Object.entries(home?.devices ?? {}).map(([key, on]) => (
          <button
            key={key}
            type="button"
            className={`${styles.deviceCard} ${styles.injectDeviceBtn} ${on ? styles.deviceCardOn : ""}`}
            disabled={busy}
            onClick={() => void inject({ type: "device_toggle", clientKey: key })}
          >
            <span className={styles.deviceName}>{deviceLabel(key)}</span>
            <span className={styles.deviceMeta}>{t("preview.deviceMeta")}</span>
            <span className={styles.deviceStatus}>{on ? "ON" : "OFF"}</span>
          </button>
        ))}
      </div>
      <div className={styles.homeLog}>
        {timeline.map((line) => (
          <div key={line} className={styles.homeLogLine}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
