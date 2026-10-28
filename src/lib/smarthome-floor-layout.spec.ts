import { expect, test } from "@rstest/core";
import {
  DEFAULT_SMARTHOME_FLOOR,
  parseFloorLayout,
  parseFloorLayoutJson,
  readFloorLayoutFromFiles,
  serializeFloorLayout,
} from "./smarthome-floor-layout";

test("falls back to default apartment on invalid JSON", () => {
  const layout = parseFloorLayoutJson("{not-json");
  expect(layout.id).toBe(DEFAULT_SMARTHOME_FLOOR.id);
  expect(layout.devices.length).toBeGreaterThan(0);
});

test("parses a custom v2 floor layout", () => {
  const layout = parseFloorLayout({
    version: 2,
    id: "lab",
    labelKey: "stage.floor.customLabel",
    sceneImage: "/smarthome/scenes/apartment.svg",
    rooms: [{ id: "living", labelKey: "room.living", x: 0, y: 0, w: 1, h: 1, fill: "#123456" }],
    devices: [{ id: "light-1", kind: "light", roomId: "living", x: 0.5, y: 0.5, bind: "living" }],
  });
  expect(layout.id).toBe("lab");
  expect(layout.version).toBe(2);
  expect(layout.devices[0]?.bind).toBe("living");
});

test("replaces stale bundled apartment drafts with the current revision", () => {
  const layout = parseFloorLayout({
    version: 2,
    revision: 1,
    id: "default-apartment",
    sceneImage: "/smarthome/scenes/apartment.svg",
    rooms: [{ id: "living", labelKey: "room.living", x: 0, y: 0, w: 1, h: 1, fill: "#123456" }],
    devices: [{ id: "light-1", kind: "light", roomId: "living", x: 0.5, y: 0.5, bind: "living" }],
  });
  expect(layout.revision).toBe(DEFAULT_SMARTHOME_FLOOR.revision);
  expect(layout.devices).toHaveLength(DEFAULT_SMARTHOME_FLOOR.devices.length);
});

test("upgrades legacy v1 layouts without sceneImage to default apartment", () => {
  const layout = parseFloorLayout({
    version: 1,
    id: "old-rect",
    rooms: [{ id: "living", labelKey: "room.living", x: 0, y: 0, w: 1, h: 1, fill: "#123456" }],
    devices: [{ id: "light-1", kind: "light", roomId: "living", x: 0.5, y: 0.5, bind: "living" }],
  });
  expect(layout.id).toBe(DEFAULT_SMARTHOME_FLOOR.id);
  expect(layout.sceneImage).toBe(DEFAULT_SMARTHOME_FLOOR.sceneImage);
});

test("clamps out-of-range coordinates", () => {
  const layout = parseFloorLayout({
    ...DEFAULT_SMARTHOME_FLOOR,
    devices: [{ id: "light-1", kind: "light", roomId: "living", x: 2, y: -1, bind: "living" }],
  });
  expect(layout.devices[0]?.x).toBe(1);
  expect(layout.devices[0]?.y).toBe(0);
});

test("round-trips serialize and parse", () => {
  const text = serializeFloorLayout(DEFAULT_SMARTHOME_FLOOR);
  const again = parseFloorLayoutJson(text);
  expect(again.id).toBe(DEFAULT_SMARTHOME_FLOOR.id);
  expect(again.devices).toHaveLength(DEFAULT_SMARTHOME_FLOOR.devices.length);
});

test("reads floor.json from artifact files", () => {
  const layout = readFloorLayoutFromFiles([
    { path: "home.json", content: "{}" },
    {
      path: "floor.json",
      content: serializeFloorLayout({
        ...DEFAULT_SMARTHOME_FLOOR,
        id: "from-files",
      }),
    },
  ]);
  expect(layout.id).toBe("from-files");
});
