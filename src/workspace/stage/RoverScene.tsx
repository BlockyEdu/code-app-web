import { At, DropShadow, Halo, IsoBox, StageCanvas } from "./IsoShape";
import styles from "./stage.module.scss";

export function RoverScene({
  label,
  speed,
  ledOn,
}: {
  label: string;
  speed: number;
  ledOn: boolean;
}) {
  const moving = speed > 0;
  return (
    <StageCanvas label={label} scene="desk-rover">
      <DropShadow x={-78} y={-28} w={156} d={70} />
      <IsoBox x={-84} y={-32} w={168} d={76} h={5} fill="#c4925a" />
      <DropShadow x={-46} y={-14} w={92} d={40} />
      <IsoBox x={-46} y={-14} z={5} w={92} d={40} h={14} fill="#e7eef6" />
      <IsoBox x={-14} y={-4} z={19} w={26} d={16} h={6} fill="#22c55e" />
      <At x={-2} y={2} z={26}>
        <text textAnchor="middle" fill="#ecfdf5" fontSize={7} fontFamily="Inter, sans-serif">
          F4
        </text>
      </At>
      {[-30, 28].map((offset) => (
        <At key={offset} x={offset} y={18} z={12}>
          <g className={moving ? styles.spin : undefined}>
            <circle r={15} fill="#1f2937" stroke="#e2e8f0" strokeWidth={3} />
            <circle r={4} fill="#f8fafc" />
          </g>
        </At>
      ))}
      <Halo x={22} y={-2} z={28} r={5} color="#4ade80" active={ledOn} />
    </StageCanvas>
  );
}
