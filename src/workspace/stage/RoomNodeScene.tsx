import { At, DropShadow, Halo, IsoBox, StageCanvas } from "./IsoShape";

export function RoomNodeScene({
  label,
  temperature,
  humidity,
  relayOn,
}: {
  label: string;
  temperature: number;
  humidity: number;
  relayOn: boolean;
}) {
  return (
    <StageCanvas label={label} scene="room-node">
      <DropShadow x={-70} y={-6} w={148} d={70} />
      <IsoBox x={-78} y={-10} w={156} d={74} h={4} fill="#6d5a48" />
      <IsoBox x={-62} y={-28} z={4} w={104} d={8} h={40} fill="#c5d0de" />
      <At x={-8} y={-24} z={28}>
        <rect x={-16} y={-12} width={32} height={18} rx={3} fill="#16324a" stroke="#e8eef6" />
        <rect x={-13} y={-9} width={26} height={12} rx={2} fill="#9ad7f5" />
        <rect x={-13} y={-9} width={26} height={4} fill="#e0f7ff" opacity={0.7} />
      </At>
      <IsoBox x={-48} y={4} z={4} w={108} d={48} h={8} fill="#c4925a" />
      <IsoBox x={-34} y={12} z={12} w={44} d={24} h={4} fill="#3d465c" />
      <At x={-12} y={18} z={17}>
        <rect x={-8} y={-5} width={16} height={10} rx={1} fill="#111827" stroke="#d6b25e" />
      </At>
      <IsoBox x={14} y={10} z={12} w={14} d={10} h={3} fill="#14b8a6" />
      <IsoBox x={34} y={20} z={12} w={12} d={12} h={3} fill="#d6dee8" />
      <At x={40} y={26} z={16}>
        <rect x={-1.6} y={-18} width={3.2} height={18} rx={1} fill="#94a3b8" />
        <path d="M-12 -18 L12 -18 L8 -26 L-8 -26 Z" fill="#fff7e6" stroke="#f8fafc" />
      </At>
      <Halo x={40} y={26} z={22} r={7} color="#fbbf24" active={relayOn} />
      <At x={-12} y={2} z={30}>
        <rect x={-28} y={-16} width={56} height={32} rx={5} fill="#0b1220" stroke="#64748b" />
        <text
          x={0}
          y={-1}
          textAnchor="middle"
          fill="#5eead4"
          fontSize={16}
          fontFamily="ui-monospace, monospace"
        >
          {temperature.toFixed(1)}°
        </text>
        <text
          x={0}
          y={14}
          textAnchor="middle"
          fill="#bfdbfe"
          fontSize={13}
          fontFamily="ui-monospace, monospace"
        >
          {Math.round(humidity)}%
        </text>
      </At>
    </StageCanvas>
  );
}
