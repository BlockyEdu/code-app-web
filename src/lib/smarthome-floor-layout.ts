/**
 * Smart-home floor layout (MF-PlaneGraph scene schema).
 * Coordinates are normalized 0–1 over the bundled isometric render.
 */

export type FloorDeviceKind = "light" | "curtain" | "fan" | "ac" | "socket" | "alarm" | "sensor";

export type FloorRoom = {
  id: string;
  /** Label key under room.* or plain id */
  labelKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
};

export type FloorDevice = {
  id: string;
  kind: FloorDeviceKind;
  roomId: string;
  /** Normalized position on the floor canvas */
  x: number;
  y: number;
  /**
   * Runtime bind:
   * - light → room key in home.lights
   * - sensor → sensor key in home.sensors
   * - others → key in home.devices (or "ac" via temperature)
   */
  bind: string;
};

/** Bump when the bundled apartment scene or default marker positions change. */
const DEFAULT_FLOOR_REVISION = 7;

export type FloorLayout = {
  /** v2 = MF-PlaneGraph–style scene image + image-space marker coords */
  version: 1 | 2;
  /** Bundled-scene revision. Older default apartments are replaced on load. */
  revision?: number;
  id: string;
  labelKey: string;
  /** Isometric scene image under `/smarthome/scenes/…` (MF-PlaneGraph–style). */
  sceneImage?: string;
  rooms: FloorRoom[];
  devices: FloorDevice[];
};

export const FLOOR_JSON_PATH = "floor.json";
export const DEFAULT_FLOOR_SCENE = "/smarthome/scenes/apartment.png";

/** Default living / bedroom / kitchen apartment layout for kind=smarthome only. */
export const DEFAULT_SMARTHOME_FLOOR: FloorLayout = {
  version: 2,
  revision: DEFAULT_FLOOR_REVISION,
  id: "default-apartment",
  labelKey: "stage.floor.defaultLabel",
  sceneImage: DEFAULT_FLOOR_SCENE,
  rooms: [
    {
      id: "living",
      labelKey: "room.living",
      x: 0.12,
      y: 0.45,
      w: 0.42,
      h: 0.32,
      fill: "#f3ebe1",
    },
    {
      id: "bedroom",
      labelKey: "room.bedroom",
      x: 0.35,
      y: 0.18,
      w: 0.42,
      h: 0.3,
      fill: "#efe6f5",
    },
    {
      id: "kitchen",
      labelKey: "room.kitchen",
      x: 0.35,
      y: 0.48,
      w: 0.42,
      h: 0.32,
      fill: "#e5f2ea",
    },
  ],
  devices: [
    // Image-space % on apartment.png (MF scene 1): living upper-right, bedroom lower-center, kitchen left.
    { id: "ac-living", kind: "ac", roomId: "living", x: 0.6, y: 0.26, bind: "ac" },
    { id: "fan-living", kind: "fan", roomId: "living", x: 0.66, y: 0.32, bind: "fan" },
    { id: "light-living", kind: "light", roomId: "living", x: 0.58, y: 0.36, bind: "living" },
    { id: "sensor-living", kind: "sensor", roomId: "living", x: 0.5, y: 0.38, bind: "motion" },
    { id: "alarm-hall", kind: "alarm", roomId: "living", x: 0.48, y: 0.2, bind: "alarm" },
    {
      id: "curtain-bedroom",
      kind: "curtain",
      roomId: "bedroom",
      x: 0.165,
      y: 0.3,
      bind: "curtain",
    },
    {
      id: "light-bedroom",
      kind: "light",
      roomId: "bedroom",
      x: 0.52,
      y: 0.66,
      bind: "bedroom",
    },
    { id: "light-kitchen", kind: "light", roomId: "kitchen", x: 0.18, y: 0.48, bind: "kitchen" },
    { id: "socket-kitchen", kind: "socket", roomId: "kitchen", x: 0.22, y: 0.58, bind: "socket" },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

const DEVICE_KINDS = new Set<FloorDeviceKind>([
  "light",
  "curtain",
  "fan",
  "ac",
  "socket",
  "alarm",
  "sensor",
]);

function parseDevice(raw: unknown, index: number): FloorDevice | null {
  if (!isRecord(raw)) return null;
  const kind = String(raw.kind ?? "") as FloorDeviceKind;
  if (!DEVICE_KINDS.has(kind)) return null;
  const id = String(raw.id ?? `device-${index}`);
  const roomId = String(raw.roomId ?? "living");
  const bind = String(raw.bind ?? (kind === "light" ? roomId : kind));
  return {
    id,
    kind,
    roomId,
    x: clamp01(num(raw.x, 0.5)),
    y: clamp01(num(raw.y, 0.5)),
    bind,
  };
}

function parseRoom(raw: unknown, index: number): FloorRoom | null {
  if (!isRecord(raw)) return null;
  const id = String(raw.id ?? `room-${index}`);
  return {
    id,
    labelKey: String(raw.labelKey ?? `room.${id}`),
    x: clamp01(num(raw.x, 0)),
    y: clamp01(num(raw.y, 0)),
    w: clamp01(num(raw.w, 0.3)),
    h: clamp01(num(raw.h, 0.3)),
    fill: typeof raw.fill === "string" && raw.fill ? raw.fill : "#6f8fb8",
  };
}

/** Parse floor.json; invalid / legacy v1 input falls back to the default apartment. */
export function parseFloorLayout(raw: unknown): FloorLayout {
  if (!isRecord(raw)) return structuredClone(DEFAULT_SMARTHOME_FLOOR);
  const version = Number(raw.version);
  // Old rectangle-stage layouts (v1 / no sceneImage) do not map onto the isometric scene.
  if (version < 2 && !(typeof raw.sceneImage === "string" && raw.sceneImage.trim())) {
    return structuredClone(DEFAULT_SMARTHOME_FLOOR);
  }
  const rooms = Array.isArray(raw.rooms)
    ? raw.rooms.map(parseRoom).filter((item): item is FloorRoom => Boolean(item))
    : [];
  const devices = Array.isArray(raw.devices)
    ? raw.devices.map(parseDevice).filter((item): item is FloorDevice => Boolean(item))
    : [];
  if (rooms.length === 0 || devices.length === 0) {
    return structuredClone(DEFAULT_SMARTHOME_FLOOR);
  }
  const id = String(raw.id ?? "custom");
  const revision = Number(raw.revision);
  // Guest drafts of the bundled apartment keep stale marker positions until revision matches.
  if (
    id === DEFAULT_SMARTHOME_FLOOR.id &&
    (!Number.isFinite(revision) || revision < DEFAULT_FLOOR_REVISION)
  ) {
    return structuredClone(DEFAULT_SMARTHOME_FLOOR);
  }
  const sceneImage =
    typeof raw.sceneImage === "string" && raw.sceneImage.trim()
      ? raw.sceneImage.trim()
      : DEFAULT_FLOOR_SCENE;
  return {
    version: 2,
    revision: Number.isFinite(revision) ? revision : undefined,
    id,
    labelKey: String(raw.labelKey ?? "stage.floor.customLabel"),
    sceneImage,
    rooms,
    devices,
  };
}

export function parseFloorLayoutJson(text: string | null | undefined): FloorLayout {
  if (!text?.trim()) return structuredClone(DEFAULT_SMARTHOME_FLOOR);
  try {
    return parseFloorLayout(JSON.parse(text) as unknown);
  } catch {
    return structuredClone(DEFAULT_SMARTHOME_FLOOR);
  }
}

export function serializeFloorLayout(layout: FloorLayout): string {
  return `${JSON.stringify(layout, null, 2)}\n`;
}

export function readFloorLayoutFromFiles(
  files: ReadonlyArray<{ path: string; content?: string | null }>,
): FloorLayout {
  const hit = files.find(
    (f) => f.path === FLOOR_JSON_PATH || f.path.endsWith(`/${FLOOR_JSON_PATH}`),
  );
  return parseFloorLayoutJson(hit?.content ?? null);
}
