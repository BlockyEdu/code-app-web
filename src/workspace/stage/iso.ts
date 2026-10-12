/**
 * True isometric projection. +z is up (smaller screen y).
 * The camera sits on the +x/+y side, so those two side faces are the visible ones.
 */

export type Vec2 = { x: number; y: number };
export type Vec3 = { x: number; y: number; z: number };

const ISO_COS = Math.cos(Math.PI / 6);
const ISO_SIN = Math.sin(Math.PI / 6);

export function projectIso(x: number, y: number, z = 0): Vec2 {
  return {
    x: (x - y) * ISO_COS,
    y: (x + y) * ISO_SIN - z,
  };
}

/** Screen point at a floor tile's front-left corner (the +y edge, min x). */
export function floorFrontLeft(x: number, y: number, depth: number, z: number): Vec2 {
  return projectIso(x, y + depth, z);
}

export function pointsClear(points: readonly Vec2[], minGap: number): boolean {
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.hypot(dx, dy) < minGap) return false;
    }
  }
  return true;
}

export function pointsAttr(points: readonly Vec2[]): string {
  return points.map((point) => `${round2(point.x)},${round2(point.y)}`).join(" ");
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Tight viewBox around measured art, with padding so labels stay inside the frame. */
export function paddedViewBox(
  x: number,
  y: number,
  width: number,
  height: number,
  pad = 0.08,
  extraTop = 0,
  extraLeft = 0,
): string {
  const px = width * pad;
  const py = height * pad;
  const top = height * extraTop;
  const left = width * extraLeft;
  return `${round2(x - px - left)} ${round2(y - py - top)} ${round2(width + px * 2 + left)} ${round2(height + py * 2 + top)}`;
}

function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function mul(v: Vec2, scale: number): Vec2 {
  return { x: v.x * scale, y: v.y * scale };
}

function len(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

/** Closed face with quadratic corners so iso boxes read as rounded solids. */
export function roundedFacePath(points: readonly Vec2[], radius: number): string {
  const count = points.length;
  if (count < 3) return "";
  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const prev = points[(index - 1 + count) % count];
    const curr = points[index];
    const next = points[(index + 1) % count];
    const toPrev = sub(prev, curr);
    const toNext = sub(next, curr);
    const prevLen = len(toPrev);
    const nextLen = len(toNext);
    const use = Math.min(radius, prevLen / 2.2, nextLen / 2.2);
    const start = {
      x: curr.x + (toPrev.x / (prevLen || 1)) * use,
      y: curr.y + (toPrev.y / (prevLen || 1)) * use,
    };
    const end = mul({ x: toNext.x / (nextLen || 1), y: toNext.y / (nextLen || 1) }, use);
    const endPoint = { x: curr.x + end.x, y: curr.y + end.y };
    if (index === 0) parts.push(`M ${round2(start.x)} ${round2(start.y)}`);
    else parts.push(`L ${round2(start.x)} ${round2(start.y)}`);
    parts.push(`Q ${round2(curr.x)} ${round2(curr.y)} ${round2(endPoint.x)} ${round2(endPoint.y)}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

export type IsoFaces = {
  /** +y face, appears on the left of the screen. */
  left: Vec2[];
  /** +x face, appears on the right of the screen. */
  right: Vec2[];
  top: Vec2[];
};

export function isoBoxFaces(origin: Vec3, size: Vec3): IsoFaces {
  const { x, y, z } = origin;
  const w = size.x;
  const d = size.y;
  const h = size.z;
  const p = (px: number, py: number, pz: number) => projectIso(px, py, pz);
  return {
    left: [p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x, y + d, z + h)],
    right: [p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x + w, y, z + h)],
    top: [p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)],
  };
}

export function shadeHex(hex: string, factor: number): string {
  const raw = hex.trim().replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => `${ch}${ch}`)
          .join("")
      : raw;
  const channel = (start: number) => {
    const value = Math.round(Number.parseInt(full.slice(start, start + 2), 16) * factor);
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}
