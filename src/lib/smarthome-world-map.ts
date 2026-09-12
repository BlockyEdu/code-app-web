import type { HomeState } from "./targets";

export type SmarthomeServerWorld = {
  rooms?: string[];
  devices?: Array<{
    id: string;
    kind: string;
    room: string;
    on: boolean;
    brightness?: number;
    temperatureC?: number;
  }>;
  sensors?: Record<string, number>;
  activeScene?: string | null;
  timeline?: Array<{ ts?: string; kind?: string; message?: string }>;
};

export function clientRoomKey(room: string): string {
  if (room === "living_room" || room === "living-room") return "living";
  return room;
}

export function serverRoomKey(room: string): string {
  if (room === "living") return "living_room";
  return room;
}

export function applyServerWorldToHome(
  prev: HomeState | undefined,
  world: SmarthomeServerWorld | null | undefined,
): HomeState {
  const serverDevices = world?.devices ?? [];
  const lights: HomeState["lights"] = { ...(prev?.lights ?? {}) };
  const devices: HomeState["devices"] = serverDevices.length ? {} : { ...(prev?.devices ?? {}) };
  for (const device of serverDevices) {
    if (device.kind === "light") {
      lights[clientRoomKey(device.room)] = {
        on: device.on,
        brightness: device.brightness ?? 0,
      };
    } else {
      devices[device.id] = device.on;
    }
  }
  const ac = (world?.devices ?? []).find((d) => d.kind === "ac");
  const timeline = (world?.timeline ?? [])
    .map((e) => e.message)
    .filter((m): m is string => Boolean(m))
    .slice(-8);
  return {
    lights,
    devices,
    temperature: ac?.temperatureC ?? world?.sensors?.temperature ?? prev?.temperature ?? 24,
    sensors: { ...(prev?.sensors ?? {}), ...(world?.sensors ?? {}) },
    scene: world?.activeScene ?? prev?.scene ?? "",
    timeline: timeline.length ? timeline : (prev?.timeline ?? []),
  };
}

export function lightDeviceId(
  world: SmarthomeServerWorld | null | undefined,
  room: string,
): string {
  const serverRoom = serverRoomKey(room);
  const hit = (world?.devices ?? []).find((d) => d.kind === "light" && d.room === serverRoom);
  return hit?.id ?? `light-${room}`;
}

/** Map a local card key (`curtain`, `curtain-bedroom`, …) to a server device id. */
export function nonLightDeviceId(
  world: SmarthomeServerWorld | null | undefined,
  key: string,
): string {
  const devices = world?.devices ?? [];
  const exact = devices.find((d) => d.id === key);
  if (exact) return exact.id;
  const kindHit = devices.find(
    (d) => d.kind !== "light" && (d.kind === key || d.id.startsWith(`${key}-`)),
  );
  return kindHit?.id ?? key;
}
