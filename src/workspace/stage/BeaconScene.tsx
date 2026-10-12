import { At, DropShadow, Halo, IsoBox, StageCanvas } from "./IsoShape";

export function BeaconScene({
  label,
  temperature,
  humidity,
  live,
}: {
  label: string;
  temperature: number;
  humidity: number;
  live: boolean;
}) {
  const ink = live ? "#5eead4" : "#99f6e4";
  return (
    <StageCanvas label={label} scene="air-beacon">
      <DropShadow x={-78} y={-28} w={156} d={72} />
      <IsoBox x={-84} y={-32} w={168} d={78} h={6} fill="#c4925a" />
      <DropShadow x={-40} y={-16} w={80} d={42} />
      <IsoBox x={-40} y={-16} z={6} w={80} d={42} h={6} fill="#3d465c" />
      <IsoBox x={-8} y={-4} z={12} w={22} d={14} h={2} fill="#111827" />
      <At x={-22} y={8} z={12}>
        <rect x={-9} y={-3} width={18} height={6} rx={2} fill="#e8eef6" />
      </At>
      <At x={18} y={-8} z={14}>
        <path d="M0 0 q 6 -8 12 0 t 10 0" fill="none" stroke="#e8c872" strokeWidth={1.6} />
      </At>
      <IsoBox x={48} y={-22} z={6} w={28} d={18} h={5} fill="#14b8a6" />
      <At x={54} y={-16} z={12}>
        <circle r={3} fill="#ccfbf1" />
      </At>
      <path
        d="M 36 -8 C 24 -28 8 -24 -6 -6"
        fill="none"
        stroke="#5eead4"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <circle cx={36} cy={-8} r={2.2} fill="#5eead4" />
      <circle cx={-6} cy={-6} r={2.2} fill="#5eead4" />
      <Halo x={-16} y={-2} z={16} r={4} color="#4ade80" active={live} />
      <At x={4} y={-36} z={28}>
        <rect x={-46} y={-28} width={92} height={52} rx={8} fill="#0b1220" stroke="#64748b" />
        <text
          x={0}
          y={-2}
          textAnchor="middle"
          fill={ink}
          fontSize={22}
          fontFamily="ui-monospace, monospace"
        >
          {temperature.toFixed(1)}°
        </text>
        <text
          x={0}
          y={18}
          textAnchor="middle"
          fill="#bfdbfe"
          fontSize={15}
          fontFamily="ui-monospace, monospace"
        >
          {Math.round(humidity)}%
        </text>
      </At>
    </StageCanvas>
  );
}
