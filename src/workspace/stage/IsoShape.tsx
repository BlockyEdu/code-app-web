import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import {
  isoBoxFaces,
  paddedViewBox,
  pointsAttr,
  projectIso,
  roundedFacePath,
  shadeHex,
} from "./iso";
import styles from "./stage.module.scss";

export type SceneLabel = {
  x: number;
  y: number;
  text: string;
  /** Which way the pill grows from the anchor so it stays off the object. */
  place?: "left" | "right" | "above" | "below" | "fore";
};

type BoxProps = {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  fill: string;
};

export function IsoBox({ x, y, z = 0, w, d, h, fill }: BoxProps) {
  const faces = isoBoxFaces({ x, y, z }, { x: w, y: d, z: h });
  const top = shadeHex(fill, 1.16);
  const left = shadeHex(fill, 0.84);
  const right = shadeHex(fill, 0.62);
  const edge = "rgba(8, 12, 20, 0.28)";
  return (
    <g>
      <path d={roundedFacePath(faces.left, 3.2)} fill={left} stroke={edge} strokeWidth={1} />
      <path d={roundedFacePath(faces.right, 3.2)} fill={right} stroke={edge} strokeWidth={1} />
      <path
        d={roundedFacePath(faces.top, 3.2)}
        fill={top}
        stroke="rgba(255,255,255,0.62)"
        strokeWidth={1}
      />
      <polyline
        points={pointsAttr([faces.top[1], faces.top[2], faces.top[3]])}
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function DropShadow({ x, y, z = 0, w, d }: Omit<BoxProps, "h" | "fill">) {
  const center = projectIso(x + w / 2, y + d / 2, z);
  const rx = Math.max(8, (w + d) * 0.22);
  return <ellipse cx={center.x} cy={center.y + 5} rx={rx} ry={rx * 0.32} fill="rgba(0,0,0,0.22)" />;
}

export function Halo({
  x,
  y,
  z = 0,
  r,
  color,
  active,
}: {
  x: number;
  y: number;
  z?: number;
  r: number;
  color: string;
  active: boolean;
}) {
  const point = projectIso(x, y, z);
  return (
    <g transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`}>
      <circle
        r={r * (active ? 2.4 : 1.5)}
        fill={color}
        opacity={active ? 0.38 : 0.16}
        className={active ? styles.glow : undefined}
      />
      <circle r={r} fill={color} opacity={active ? 0.95 : 0.45} />
    </g>
  );
}

export function At({
  x,
  y,
  z = 0,
  children,
}: {
  x: number;
  y: number;
  z?: number;
  children: ReactNode;
}) {
  const point = projectIso(x, y, z);
  return <g transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`}>{children}</g>;
}

function pillStyle(
  viewBox: string,
  width: number,
  height: number,
  item: SceneLabel,
): CSSProperties {
  const [vx, vy, vw, vh] = viewBox.split(" ").map(Number);
  const scale = Math.min(width / vw, height / vh);
  const offsetX = (width - vw * scale) / 2;
  const offsetY = (height - vh * scale) / 2;
  const left = offsetX + (item.x - vx) * scale;
  const top = offsetY + (item.y - vy) * scale;
  const shift =
    item.place === "right"
      ? "translate(-8px, -50%)"
      : item.place === "above"
        ? "translate(-50%, calc(-100% - 6px))"
        : item.place === "below"
          ? "translate(0, 6px)"
          : item.place === "fore"
            ? "translate(calc(-100% + 4px), 2px)"
            : "translate(calc(-100% + 8px), -50%)";
  return { left, top, transform: shift };
}

const NO_LABELS: SceneLabel[] = [];

export function StageCanvas({
  label,
  scene,
  children,
  labels = NO_LABELS,
  gutter = 0,
}: {
  label: string;
  scene: string;
  children: ReactNode;
  labels?: SceneLabel[];
  /** Extra viewBox room on the left so corner badges are not clipped. */
  gutter?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const [frame, setFrame] = useState({ viewBox: "0 0 240 160", width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = groupRef.current;
    const wrap = wrapRef.current;
    if (!node || !wrap) return;
    const measure = () => {
      const box = node.getBBox();
      if (box.width < 1 || box.height < 1) return;
      const viewBox = paddedViewBox(box.x, box.y, box.width, box.height, 0.08, 0.12, gutter);
      const width = wrap.clientWidth;
      const height = wrap.clientHeight;
      setFrame((current) =>
        current.viewBox === viewBox && current.width === width && current.height === height
          ? current
          : { viewBox, width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  });

  return (
    <div ref={wrapRef} className={styles.canvasWrap}>
      <svg
        className={styles.sceneSvg}
        viewBox={frame.viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={label}
        data-scene={scene}
      >
        <g ref={groupRef}>{children}</g>
      </svg>
      {frame.width > 0
        ? labels.map((item) => (
            <span
              key={`${item.text}:${item.x.toFixed(1)}:${item.y.toFixed(1)}`}
              className={styles.pill}
              style={pillStyle(frame.viewBox, frame.width, frame.height, item)}
            >
              {item.text}
            </span>
          ))
        : null}
    </div>
  );
}
