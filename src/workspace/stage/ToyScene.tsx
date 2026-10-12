import { At, DropShadow, IsoBox, type SceneLabel, StageCanvas } from "./IsoShape";
import { projectIso } from "./iso";
import type { ToyExpression } from "./map-scene";
import styles from "./stage.module.scss";

const LED: Record<string, string> = {
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
  yellow: "#f59e0b",
  off: "#86efac",
};

function Face({ expression }: { expression: ToyExpression }) {
  const wide = expression === "alert";
  return (
    <g>
      <circle cx={-8} cy={-2} r={wide ? 4.4 : 3} fill="#0f172a" />
      <circle cx={8} cy={-2} r={wide ? 4.4 : 3} fill="#0f172a" />
      <circle cx={-7} cy={-3} r={1} fill="#fff" />
      <circle cx={9} cy={-3} r={1} fill="#fff" />
      {expression === "talk" ? (
        <ellipse cx={0} cy={10} rx={5} ry={3.5} fill="#0f172a" />
      ) : expression === "alert" ? (
        <circle cx={0} cy={10} r={2.6} fill="none" stroke="#0f172a" strokeWidth={1.6} />
      ) : expression === "move" ? (
        <path d="M-6 10 H6" stroke="#0f172a" strokeWidth={1.8} strokeLinecap="round" />
      ) : (
        <path
          d="M-7 8 Q0 15 7 8"
          fill="none"
          stroke="#0f172a"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

export function ToyScene({
  label,
  expression,
  led,
  speech,
  speed,
  nudgeX,
}: {
  label: string;
  expression: ToyExpression;
  led: string;
  speech: string;
  speed: number;
  nudgeX: number;
}) {
  const moving = speed > 0;
  const ledColor = LED[led] ?? LED.off;
  const line = speech.trim().slice(0, 22);
  const tip = projectIso(0, -6, 92);
  const labels: SceneLabel[] = line
    ? [{ x: tip.x + nudgeX, y: tip.y, text: line, place: "above" }]
    : [];
  return (
    <StageCanvas label={label} scene="toy" labels={labels}>
      <g transform={`translate(${nudgeX.toFixed(1)} 0)`}>
        <DropShadow x={-28} y={-16} w={56} d={40} />
        <IsoBox x={-16} y={8} w={14} d={12} h={16} fill="#94a3b8" />
        <IsoBox x={4} y={8} w={14} d={12} h={16} fill="#94a3b8" />
        <IsoBox x={-22} y={-10} z={16} w={44} d={28} h={32} fill="#60a5fa" />
        <IsoBox x={-26} y={-4} z={22} w={10} d={10} h={22} fill="#1d4ed8" />
        <IsoBox x={16} y={-4} z={22} w={10} d={10} h={22} fill="#1d4ed8" />
        <g className={moving ? styles.swing : undefined}>
          <IsoBox x={-34} y={-2} z={28} w={10} d={8} h={18} fill="#60a5fa" />
        </g>
        <IsoBox x={-16} y={-8} z={48} w={32} d={24} h={26} fill="#dbeafe" />
        <At x={0} y={4} z={66}>
          <Face expression={expression} />
        </At>
        <At x={0} y={2} z={36}>
          <circle
            r={led === "off" ? 8 : 12}
            fill={ledColor}
            opacity={led === "off" ? 0.28 : 0.4}
            className={led !== "off" ? styles.glow : undefined}
          />
          <circle r={5} fill={ledColor} opacity={led === "off" ? 0.55 : 1} />
        </At>
        <At x={0} y={-6} z={78}>
          <rect x={-1.5} y={-12} width={3} height={12} fill="#94a3b8" />
          <circle cy={-14} r={3.5} fill={led !== "off" ? ledColor : "#94a3b8"} />
        </At>
      </g>
    </StageCanvas>
  );
}
