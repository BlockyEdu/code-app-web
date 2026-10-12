import { At, DropShadow, IsoBox, StageCanvas } from "./IsoShape";
import styles from "./stage.module.scss";

export function SmartWindowScene({
  label,
  openPct,
  raining,
}: {
  label: string;
  openPct: number;
  raining: boolean;
}) {
  const lift = (openPct / 100) * 28;
  return (
    <StageCanvas label={label} scene="smart-window">
      <DropShadow x={-72} y={-16} w={144} d={70} />
      <IsoBox x={-78} y={-20} w={156} d={76} h={6} fill="#8ea0b8" />
      <IsoBox x={-46} y={-8} z={6} w={84} d={10} h={64} fill="#d5deea" />
      <At x={-4} y={2} z={42}>
        <rect
          x={-30}
          y={-36}
          width={60}
          height={54}
          rx={4}
          fill="#16324a"
          stroke="#f8fafc"
          strokeWidth={2}
        />
        <rect x={-24} y={-30} width={48} height={42} fill="#9ad7f5" />
        <rect x={-24} y={-30} width={48} height={12} fill="#e0f7ff" opacity={0.55} />
        <g className={styles.sash} style={{ transform: `translateY(${-lift}px)` }}>
          <rect x={-24} y={-4} width={48} height={20} rx={2} fill="#f8fafc" stroke="#94a3b8" />
          <line x1={0} y1={-4} x2={0} y2={16} stroke="#94a3b8" />
        </g>
      </At>
      {raining
        ? [0, 1, 2, 3, 4].map((index) => (
            <At key={`rain-${index}`} x={-28 + index * 14} y={-24} z={78}>
              <line
                x1={0}
                y1={0}
                x2={3}
                y2={12}
                stroke="#7dd3fc"
                strokeWidth={2.4}
                strokeLinecap="round"
                className={styles.rainDrop}
                style={{ animationDelay: `${index * 0.15}s` }}
              />
            </At>
          ))
        : null}
    </StageCanvas>
  );
}
