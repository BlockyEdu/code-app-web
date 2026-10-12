import { useState } from "react";
import {
  boardFamily,
  modulesForSkus,
  type StaticModule,
  staticModule,
} from "../../lib/hardware-catalog-static";
import { t } from "../../lib/i18n";
import { useLocaleStore } from "../../lib/locale-store";
import { At, DropShadow, IsoBox, type SceneLabel, StageCanvas } from "./IsoShape";
import { floorFrontLeft, projectIso } from "./iso";
import styles from "./stage.module.scss";

const SLOTS: Array<[number, number]> = [
  [-108, -46],
  [48, -50],
  [102, 4],
  [-6, 48],
  [-118, 16],
  [58, 36],
];

const HOLE_XS = [-102, -78, -54, -30, -6, 18, 42, 66, 90] as const;
const HOLE_YS = [-48, -32, -16, 0, 16, 32] as const;

function moduleLabel(mod: StaticModule): string {
  if (!mod.nameKey) return mod.sku;
  const label = t(mod.nameKey);
  return label === mod.nameKey ? mod.sku : label;
}

function wirePath(fromX: number, fromY: number, toX: number, toY: number): string {
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 34;
  return `M ${fromX.toFixed(1)} ${fromY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${toX.toFixed(1)} ${toY.toFixed(1)}`;
}

export function CircuitLayer({
  boardSku,
  moduleSkus,
}: {
  boardSku: string | null;
  moduleSkus: string[];
}) {
  useLocaleStore((s) => s.locale);
  const family = boardFamily(boardSku);
  const modules = modulesForSkus(moduleSkus).slice(0, SLOTS.length);
  const [hover, setHover] = useState<string | null>(null);
  const active = modules.find((mod) => mod.sku === hover) ?? null;
  const board =
    family === "esp32-c3"
      ? { w: 66, d: 36, fill: "#2c3344" }
      : family === "nucleo"
        ? { w: 104, d: 56, fill: "#e4efe0" }
        : { w: 86, d: 50, fill: "#232733" };
  const boardCenter = projectIso(0, 0, 8);
  const labels: SceneLabel[] = modules.map((mod, index) => {
    const [x, y] = SLOTS[index];
    const point = floorFrontLeft(x, y, 22, 13);
    const dx = point.x - boardCenter.x;
    const dy = point.y - boardCenter.y;
    const span = Math.hypot(dx, dy) || 1;
    const side = point.x < boardCenter.x ? "left" : "right";
    const reach = side === "left" ? 16 : 58;
    const ax = point.x + (dx / span) * reach;
    const ay = point.y + (dy / span) * (side === "left" ? 10 : 30);
    return {
      x: ax,
      y: ay,
      text: moduleLabel(mod),
      place: side,
    };
  });
  const label = t(
    family === "esp32-c3"
      ? "stage.board.esp32c3"
      : family === "nucleo"
        ? "stage.board.nucleo"
        : "stage.board.esp32s3",
  );

  return (
    <div className={styles.layer}>
      <StageCanvas label={label} scene="circuit" labels={labels} gutter={0.34}>
        <DropShadow x={-120} y={-62} w={236} d={128} />
        <IsoBox x={-120} y={-62} w={236} d={128} h={8} fill="#f3e6c4" />
        {HOLE_XS.flatMap((x) =>
          HOLE_YS.map((y) => {
            const point = projectIso(x, y, 8.4);
            return <circle key={`${x}:${y}`} cx={point.x} cy={point.y} r={1.6} fill="#6d5e48" />;
          }),
        )}
        <IsoBox
          x={-board.w / 2}
          y={-board.d / 2}
          z={8}
          w={board.w}
          d={board.d}
          h={6}
          fill={board.fill}
        />
        {family === "nucleo" ? (
          <IsoBox
            x={-board.w / 2}
            y={-board.d / 2}
            z={14}
            w={22}
            d={board.d}
            h={2}
            fill="#1f7a3a"
          />
        ) : (
          <IsoBox x={-10} y={-8} z={14} w={22} d={16} h={2} fill="#111827" />
        )}
        <At x={0} y={board.d / 2 - 2} z={12}>
          <rect
            x={-9}
            y={-3}
            width={18}
            height={7}
            rx={2}
            fill="#d5dde6"
            stroke="#94a3b8"
            strokeWidth={0.8}
          />
        </At>
        {family !== "nucleo" ? (
          <At x={board.w / 2 - 8} y={-6} z={16}>
            <path
              d={family === "esp32-s3" ? "M0 0 q 6 -10 12 0 t 12 0" : "M0 0 q 4 -7 8 0 t 8 0"}
              fill="none"
              stroke="#e8c872"
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </At>
        ) : null}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((offset) => (
          <At key={`pin-${offset}`} x={-board.w / 2 + 6} y={offset * board.d} z={15}>
            <circle r={1.5} fill="#e8c872" />
          </At>
        ))}
        <At x={0} y={0} z={16}>
          <text
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize={8}
            fontFamily="Inter, sans-serif"
            fontWeight={600}
          >
            {family === "nucleo" ? "F401" : family === "esp32-c3" ? "C3" : "S3"}
          </text>
        </At>
        {modules.map((mod, index) => {
          const slot = SLOTS[index];
          const from = projectIso(slot[0] + 16, slot[1] + 10, 18);
          const along = (index + 1) / (modules.length + 1);
          const to = projectIso(board.w / 2 - 2, -board.d / 2 + along * board.d, 16);
          return (
            <g key={`${mod.sku}-wire`}>
              <path
                d={wirePath(from.x, from.y, to.x, to.y)}
                fill="none"
                stroke={mod.color}
                strokeWidth={hover === mod.sku ? 3.6 : 2.4}
                strokeLinecap="round"
              />
              <circle cx={from.x} cy={from.y} r={2.4} fill={mod.color} />
              <circle cx={to.x} cy={to.y} r={2.4} fill={mod.color} />
            </g>
          );
        })}
        {modules.map((mod, index) => {
          const [x, y] = SLOTS[index];
          const known = staticModule(mod.sku);
          return (
            <g
              key={mod.sku}
              onMouseEnter={() => setHover(mod.sku)}
              onMouseLeave={() => setHover(null)}
            >
              <IsoBox x={x} y={y} z={8} w={34} d={22} h={5} fill={mod.color} />
              <At x={x + 10} y={y + 8} z={14}>
                <circle r={2.4} fill="#f8fafc" />
              </At>
              <At x={x + 20} y={y + 12} z={14}>
                <circle r={1.6} fill="#0f172a" opacity={0.35} />
              </At>
              <title>{`${moduleLabel(known ?? mod)} ${mod.pins.join(", ")}`}</title>
            </g>
          );
        })}
      </StageCanvas>
      {active ? (
        <div className={styles.tip} role="tooltip">
          <strong>{moduleLabel(active)}</strong>
          <span>{active.pins.length > 0 ? active.pins.join(" · ") : active.sku}</span>
        </div>
      ) : null}
    </div>
  );
}
