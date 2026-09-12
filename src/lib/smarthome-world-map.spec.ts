import { describe, expect, it } from "@rstest/core";
import {
  applyServerWorldToHome,
  clientRoomKey,
  lightDeviceId,
  nonLightDeviceId,
  type SmarthomeServerWorld,
  serverRoomKey,
} from "./smarthome-world-map";
import type { HomeState } from "./targets";

const prev: HomeState = {
  lights: {
    living: { on: false, brightness: 60 },
    bedroom: { on: false, brightness: 60 },
  },
  devices: { curtain: false, socket: true },
  temperature: 22,
  sensors: { temperature: 22, humidity: 40 },
  scene: "",
  timeline: ["local"],
};

const world: SmarthomeServerWorld = {
  rooms: ["living_room", "bedroom"],
  devices: [
    { id: "light-living", kind: "light", room: "living_room", on: true, brightness: 80 },
    { id: "light-bedroom", kind: "light", room: "bedroom", on: false, brightness: 20 },
    { id: "ac-living", kind: "ac", room: "living_room", on: true, temperatureC: 26 },
    { id: "curtain-bedroom", kind: "curtain", room: "bedroom", on: true },
  ],
  sensors: { temperature: 24, humidity: 55 },
  activeScene: "sleep",
  timeline: [
    { ts: "2026-01-01T00:00:00Z", kind: "scene", message: "sleep" },
    { ts: "2026-01-01T00:00:01Z", kind: "device", message: "light-living on" },
  ],
};

describe("room key mapping", () => {
  it("maps living_room to living and back", () => {
    expect(clientRoomKey("living_room")).toBe("living");
    expect(clientRoomKey("living-room")).toBe("living");
    expect(clientRoomKey("bedroom")).toBe("bedroom");
    expect(serverRoomKey("living")).toBe("living_room");
    expect(serverRoomKey("bedroom")).toBe("bedroom");
  });
});

describe("lightDeviceId", () => {
  it("uses the server light id when the room is known", () => {
    expect(lightDeviceId(world, "living")).toBe("light-living");
    expect(lightDeviceId(world, "bedroom")).toBe("light-bedroom");
  });

  it("falls back to light-<room> without a server world", () => {
    expect(lightDeviceId(null, "living")).toBe("light-living");
    expect(lightDeviceId(undefined, "kitchen")).toBe("light-kitchen");
  });
});

describe("nonLightDeviceId", () => {
  it("maps local kind keys to server ids after hydrate", () => {
    expect(nonLightDeviceId(world, "curtain")).toBe("curtain-bedroom");
    expect(nonLightDeviceId(world, "curtain-bedroom")).toBe("curtain-bedroom");
    expect(nonLightDeviceId(world, "ac")).toBe("ac-living");
  });

  it("keeps the local key when the server world is empty", () => {
    expect(nonLightDeviceId(null, "curtain")).toBe("curtain");
  });
});

describe("applyServerWorldToHome", () => {
  it("overlays lights, replaces non-light devices, and copies scene/sensors", () => {
    const next = applyServerWorldToHome(prev, world);
    expect(next.lights.living).toEqual({ on: true, brightness: 80 });
    expect(next.lights.bedroom).toEqual({ on: false, brightness: 20 });
    expect(next.devices).toEqual({ "ac-living": true, "curtain-bedroom": true });
    expect(next.temperature).toBe(26);
    expect(next.sensors).toEqual({ temperature: 24, humidity: 55 });
    expect(next.scene).toBe("sleep");
    expect(next.timeline).toEqual(["sleep", "light-living on"]);
  });

  it("keeps previous home when the server world is empty", () => {
    const next = applyServerWorldToHome(prev, null);
    expect(next.devices).toEqual(prev.devices);
    expect(next.temperature).toBe(22);
    expect(next.scene).toBe("");
    expect(next.timeline).toEqual(["local"]);
  });
});
