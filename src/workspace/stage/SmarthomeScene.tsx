import { t } from "../../lib/i18n";
import { useLocaleStore } from "../../lib/locale-store";
import { At, DropShadow, Halo, IsoBox, type SceneLabel, StageCanvas } from "./IsoShape";
import { floorFrontLeft } from "./iso";
import styles from "./stage.module.scss";

type Light = { on: boolean; brightness: number };

const ROOMS = [
  { key: "room.living", x: -108, y: -8, d: 68, ox: 0, oy: 0 },
  { key: "room.bedroom", x: -16, y: -58, d: 52, ox: 46, oy: -74 },
  { key: "room.kitchen", x: 16, y: 10, d: 56, ox: 0, oy: 0 },
] as const;

export function SmarthomeScene({
  label,
  lights,
  fan,
  curtain,
  ac,
}: {
  label: string;
  lights: Record<string, Light | undefined>;
  fan: boolean;
  curtain: boolean;
  ac: boolean;
}) {
  useLocaleStore((s) => s.locale);
  const living = lights.living;
  const bedroom = lights.bedroom;
  const kitchen = lights.kitchen;
  const gap = curtain ? 12 : 1;
  const labels: SceneLabel[] = ROOMS.map((room) => {
    const point = floorFrontLeft(room.x, room.y, room.d, 6);
    return {
      x: point.x + room.ox,
      y: point.y + room.oy,
      text: t(room.key),
      place: "fore" as const,
    };
  });
  return (
    <StageCanvas label={label} scene="smarthome" labels={labels} gutter={0.32}>
      <DropShadow x={-108} y={-8} w={92} d={68} />
      <IsoBox x={-108} y={-8} w={92} d={68} h={6} fill="#8eabcf" />
      <IsoBox x={-100} y={-16} z={6} w={76} d={6} h={14} fill="#d5deea" />
      <IsoBox x={-78} y={8} z={6} w={36} d={16} h={8} fill="#e7eef8" />
      <IsoBox x={-70} y={12} z={14} w={18} d={10} h={6} fill="#f8fafc" />
      <Halo x={-62} y={22} z={28} r={8} color="#fde68a" active={Boolean(living?.on)} />
      <At x={-88} y={4} z={16}>
        <g className={fan ? styles.spin : undefined}>
          <circle r={3} fill="#f8fafc" />
          <rect x={-1.6} y={-13} width={3.2} height={11} rx={1} fill="#e2e8f0" />
          <rect x={-1.6} y={2} width={3.2} height={11} rx={1} fill="#e2e8f0" />
          <rect x={-13} y={-1.6} width={11} height={3.2} rx={1} fill="#e2e8f0" />
          <rect x={2} y={-1.6} width={11} height={3.2} rx={1} fill="#e2e8f0" />
        </g>
      </At>

      <DropShadow x={-16} y={-58} w={74} d={52} />
      <IsoBox x={-16} y={-58} w={74} d={52} h={6} fill="#b7a4d6" />
      <IsoBox x={-8} y={-64} z={6} w={58} d={6} h={14} fill="#efe8f8" />
      <IsoBox x={-2} y={-46} z={6} w={40} d={18} h={7} fill="#f4eefb" />
      <Halo x={20} y={-36} z={26} r={7} color="#fde68a" active={Boolean(bedroom?.on)} />
      <At x={8} y={-52} z={18}>
        <rect x={-18} y={-11} width={36} height={20} rx={2} fill="#1e293b" />
        <rect x={-16} y={-9} width={32} height={16} fill="#7dd3fc" opacity={0.55} />
        <rect
          className={styles.sash}
          x={-15}
          y={-8}
          width={14}
          height={14}
          fill="#f8fafc"
          style={{ transform: `translateX(${-gap}px)` }}
        />
        <rect
          className={styles.sash}
          x={1}
          y={-8}
          width={14}
          height={14}
          fill="#e2e8f0"
          style={{ transform: `translateX(${gap}px)` }}
        />
      </At>

      <DropShadow x={16} y={10} w={82} d={56} />
      <IsoBox x={16} y={10} w={82} d={56} h={6} fill="#8fbfa4" />
      <IsoBox x={24} y={4} z={6} w={64} d={6} h={12} fill="#e7f6ec" />
      <IsoBox x={28} y={16} z={6} w={46} d={12} h={8} fill="#e7d3b0" />
      <Halo x={58} y={36} z={26} r={7} color="#fde68a" active={Boolean(kitchen?.on)} />
      <IsoBox x={72} y={22} z={6} w={16} d={12} h={14} fill={ac ? "#7dd3fc" : "#b6c3d4"} />
      {ac ? (
        <At x={80} y={28} z={24}>
          <g className={styles.glow}>
            <path d="M-8 0 H8" stroke="#e0f2fe" strokeWidth={1.6} strokeLinecap="round" />
            <path d="M-6 4 H10" stroke="#bae6fd" strokeWidth={1.4} strokeLinecap="round" />
            <path d="M-4 8 H8" stroke="#7dd3fc" strokeWidth={1.2} strokeLinecap="round" />
          </g>
        </At>
      ) : null}
    </StageCanvas>
  );
}
