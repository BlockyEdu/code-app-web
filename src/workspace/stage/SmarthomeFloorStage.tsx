import { useMemo } from "react";
import { t } from "../../lib/i18n";
import { useLocaleStore } from "../../lib/locale-store";
import {
  DEFAULT_FLOOR_SCENE,
  type FloorDevice,
  type FloorLayout,
  readFloorLayoutFromFiles,
} from "../../lib/smarthome-floor-layout";
import { useWorkspaceStore } from "../../stores/workspace";
import type { StageModel } from "./map-scene";
import styles from "./stage.module.scss";

type Light = { on: boolean; brightness: number };

const SCENE_MOODS = ["home", "away", "sleep", "movie"] as const;

function sceneMood(scene: string): (typeof SCENE_MOODS)[number] | "idle" {
  return (SCENE_MOODS as readonly string[]).includes(scene)
    ? (scene as (typeof SCENE_MOODS)[number])
    : "idle";
}

function deviceActive(
  device: FloorDevice,
  lights: Record<string, Light | undefined>,
  devices: Record<string, boolean>,
  sensors: Record<string, number>,
  temperature: number,
): { active: boolean; detail: string } {
  switch (device.kind) {
    case "light": {
      const light = lights[device.bind];
      const on = Boolean(light?.on);
      return {
        active: on,
        detail: on ? `${light?.brightness ?? 0}%` : t("stage.off"),
      };
    }
    case "sensor": {
      const value = sensors[device.bind] ?? 0;
      return { active: value > 0, detail: String(value) };
    }
    case "ac": {
      const on = Boolean(devices.ac) || temperature !== 26;
      return { active: on, detail: `${temperature}°C` };
    }
    default: {
      const on = Boolean(devices[device.bind]);
      return { active: on, detail: on ? t("stage.on") : t("stage.off") };
    }
  }
}

/** MF-PlaneGraph–style glyph inside the circular marker. */
function MarkerGlyph({ kind, active }: { kind: FloorDevice["kind"]; active: boolean }) {
  const stroke = active ? "#0f172a" : "#475569";
  const fill = active ? "#0f172a" : "#64748b";
  const spin = kind === "fan" && active ? ` ${styles.spin}` : "";
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={`${styles.planeGlyph}${spin}`}
    >
      {kind === "light" ? (
        <>
          <path
            d="M9 18h6M10 21h4M12 3a5 5 0 0 0-3 9c.6.5 1 1.2 1 2h4c0-.8.4-1.5 1-2a5 5 0 0 0-3-9Z"
            fill="none"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {active ? <circle cx="12" cy="10" r="2.2" fill="#fbbf24" /> : null}
        </>
      ) : null}
      {kind === "curtain" ? (
        <path
          d="M4 4h16M6 4v16M18 4v16M10 4v16M14 4v16"
          fill="none"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : null}
      {kind === "fan" ? (
        <>
          <circle cx="12" cy="12" r="2" fill={fill} />
          <path
            d="M12 4c2.5 2 3.5 4.2 2.2 6.2M20 12c-2 2.5-4.2 3.5-6.2 2.2M12 20c-2.5-2-3.5-4.2-2.2-6.2M4 12c2-2.5 4.2-3.5 6.2-2.2"
            fill="none"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {kind === "ac" ? (
        <>
          <rect
            x="3"
            y="7"
            width="18"
            height="10"
            rx="2"
            fill="none"
            stroke={stroke}
            strokeWidth="1.8"
          />
          <path
            d="M6 17c1.5 2 3.5 3 6 3s4.5-1 6-3"
            fill="none"
            stroke={active ? "#38bdf8" : stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {kind === "socket" ? (
        <>
          <rect
            x="5"
            y="5"
            width="14"
            height="14"
            rx="3"
            fill="none"
            stroke={stroke}
            strokeWidth="1.8"
          />
          <circle cx="9.5" cy="12" r="1.4" fill={fill} />
          <circle cx="14.5" cy="12" r="1.4" fill={fill} />
        </>
      ) : null}
      {kind === "alarm" ? (
        <>
          <path
            d="M12 4 4 19h16L12 4Z"
            fill="none"
            stroke={active ? "#dc2626" : stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 10v4"
            stroke={active ? "#dc2626" : stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16.5" r="1.1" fill={active ? "#dc2626" : fill} />
        </>
      ) : null}
      {kind === "sensor" ? (
        <>
          <circle cx="12" cy="12" r="3" fill={active ? "#0ea5e9" : fill} />
          <path
            d="M6.5 6.5a8 8 0 0 1 11 0M4 4a11 11 0 0 1 16 0"
            fill="none"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
}

export function SmarthomeFloorStage({
  label,
  home,
  layout: layoutProp,
  zoom = 1,
}: {
  label: string;
  home: StageModel["home"];
  layout?: FloorLayout | null;
  zoom?: number;
}) {
  useLocaleStore((s) => s.locale);
  const files = useWorkspaceStore((s) => s.artifactFiles);
  const layout = useMemo(() => layoutProp ?? readFloorLayoutFromFiles(files), [layoutProp, files]);
  const sceneSrc = layout.sceneImage || DEFAULT_FLOOR_SCENE;

  const lights = home.lights;
  const devices = home.devices;
  const sensors = home.sensors;
  const temperature = home.temperature;
  const title = t(layout.labelKey) === layout.labelKey ? label : t(layout.labelKey);
  const mood = sceneMood(home.scene);
  const curtainShut = mood === "movie" || mood === "away" || mood === "sleep";

  return (
    <div className={styles.planeGraph} data-scene="smarthome-floor">
      <div className={styles.planeHeader}>
        <strong>{title}</strong>
        <span>{t("stage.floor.hint")}</span>
      </div>
      <div className={styles.planeCanvas}>
        <div
          className={styles.planeStage}
          data-mood={mood}
          style={{ ["--zoom" as string]: String(zoom) }}
        >
          <img className={styles.planeScene} src={sceneSrc} alt="" draggable={false} />
          {layout.devices.map((device) => {
            const { active } = deviceActive(device, lights, devices, sensors, temperature);
            const light = device.kind === "light" ? lights[device.bind] : undefined;
            const brightness = light?.on ? (light.brightness ?? 60) / 100 : 0;
            const curtainClosed = device.kind === "curtain" && curtainShut && !active;
            return (
              <div key={`${device.id}-fx`}>
                {device.kind === "light" && active ? (
                  <div
                    className={styles.planeLightPool}
                    style={{
                      left: `${device.x * 100}%`,
                      top: `${device.y * 100}%`,
                      width: `${16 + brightness * 26}%`,
                      opacity: 0.45 + brightness * 0.55,
                    }}
                  />
                ) : null}
                {device.kind === "alarm" && active ? (
                  <div
                    className={styles.planeAlarmPool}
                    style={{ left: `${device.x * 100}%`, top: `${device.y * 100}%` }}
                  />
                ) : null}
                {curtainClosed ? (
                  <div
                    className={styles.planeCurtainShade}
                    style={{ left: `${device.x * 100}%`, top: `${device.y * 100}%` }}
                  />
                ) : null}
              </div>
            );
          })}
          {layout.devices.map((device) => {
            const { active, detail } = deviceActive(device, lights, devices, sensors, temperature);
            const light = device.kind === "light" ? lights[device.bind] : undefined;
            const brightness = light?.on ? (light.brightness ?? 60) / 100 : 0;
            return (
              <div
                key={device.id}
                className={styles.planeMarker}
                data-active={active ? "1" : "0"}
                data-kind={device.kind}
                style={{
                  left: `${device.x * 100}%`,
                  top: `${device.y * 100}%`,
                  ["--glow" as string]: String(0.25 + brightness * 0.55),
                }}
                title={`${t(`device.${device.kind}`)} · ${detail}`}
              >
                <div className={styles.planeMarkerBubble}>
                  <MarkerGlyph kind={device.kind} active={active} />
                </div>
                <div className={styles.planeMarkerDot} />
                <span className={styles.planeMarkerLabel}>
                  {t(`device.${device.kind}`)}
                  <em>{detail}</em>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
