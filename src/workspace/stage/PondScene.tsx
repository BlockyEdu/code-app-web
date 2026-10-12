import { At, DropShadow, IsoBox, StageCanvas } from "./IsoShape";
import styles from "./stage.module.scss";

export function PondScene({
  label,
  levelPct,
  aeratorOn,
  sprayOn,
}: {
  label: string;
  levelPct: number;
  aeratorOn: boolean;
  sprayOn: boolean;
}) {
  const waterH = 12 + (levelPct / 100) * 26;
  return (
    <StageCanvas label={label} scene="agri-pond">
      <DropShadow x={-72} y={-30} w={148} d={84} />
      <IsoBox x={-74} y={-32} w={152} d={88} h={8} fill="#6d7c72" />
      <IsoBox x={-66} y={-24} z={8} w={136} d={72} h={waterH} fill="#3b82f6" />
      <IsoBox x={-66} y={-24} z={8 + waterH} w={136} d={72} h={3} fill="#7dd3fc" />
      <IsoBox x={-14} y={-6} z={10 + waterH} w={26} d={16} h={7} fill="#e2e8f0" />
      {aeratorOn ? (
        [0, 1, 2, 3].map((index) => (
          <At
            key={`bubble-${index}`}
            x={-6 + (index % 2) * 10}
            y={2 + Math.floor(index / 2) * 8}
            z={20 + waterH}
          >
            <circle
              r={3.2}
              fill="#f0f9ff"
              className={styles.bubble}
              style={{ animationDelay: `${index * 0.25}s` }}
            />
          </At>
        ))
      ) : (
        <At x={-2} y={4} z={16 + waterH}>
          <circle r={3} fill="#e0f2fe" opacity={0.45} />
        </At>
      )}
      <IsoBox x={58} y={-16} z={8} w={10} d={10} h={30} fill="#94a3b8" />
      {sprayOn ? (
        <At x={63} y={-11} z={42}>
          <g className={styles.glow}>
            <path
              d="M0 0 Q -14 -16 -6 -30"
              fill="none"
              stroke="#e0f2fe"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <path
              d="M0 0 Q 4 -18 16 -28"
              fill="none"
              stroke="#7dd3fc"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        </At>
      ) : null}
    </StageCanvas>
  );
}
