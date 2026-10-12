import { At, DropShadow, Halo, IsoBox, StageCanvas } from "./IsoShape";
import styles from "./stage.module.scss";

export function IrrigationScene({
  label,
  soil,
  pumpOn,
  flowing,
  raining,
}: {
  label: string;
  soil: string;
  pumpOn: boolean;
  flowing: boolean;
  raining: boolean;
}) {
  return (
    <StageCanvas label={label} scene="agri-irrigation">
      <DropShadow x={-88} y={-8} w={140} d={70} />
      <IsoBox x={-90} y={-10} w={142} d={72} h={12} fill={soil} />
      <IsoBox x={-96} y={-40} z={0} w={26} d={26} h={20} fill="#94a3b8" />
      <At x={-83} y={-27} z={22}>
        <g className={pumpOn ? styles.spin : undefined}>
          <circle r={11} fill={pumpOn ? "#14b8a6" : "#64748b"} stroke="#f8fafc" strokeWidth={1.5} />
          <rect x={-2} y={-9} width={4} height={18} rx={1} fill="#f8fafc" />
          <rect x={-9} y={-2} width={18} height={4} rx={1} fill="#f8fafc" />
        </g>
      </At>
      <Halo x={-83} y={-27} z={24} r={4} color="#2dd4bf" active={pumpOn} />
      <IsoBox x={-70} y={-34} z={14} w={112} d={8} h={6} fill="#cbd5e1" />
      <IsoBox x={34} y={-30} z={8} w={8} d={8} h={14} fill="#cbd5e1" />
      {flowing
        ? [0, 1, 2, 3].map((index) => (
            <At key={`drop-${index}`} x={-62 + index * 24} y={-28} z={22}>
              <circle
                r={3.4}
                fill="#38bdf8"
                className={styles.flowDrop}
                style={{ animationDelay: `${index * 0.2}s` }}
              />
            </At>
          ))
        : null}
      {raining
        ? [0, 1, 2, 3].map((index) => (
            <At key={`rain-${index}`} x={-30 + index * 18} y={-4} z={48}>
              <line
                x1={0}
                y1={0}
                x2={3}
                y2={11}
                stroke="#7dd3fc"
                strokeWidth={2}
                strokeLinecap="round"
                className={styles.rainDrop}
                style={{ animationDelay: `${index * 0.18}s` }}
              />
            </At>
          ))
        : null}
    </StageCanvas>
  );
}
