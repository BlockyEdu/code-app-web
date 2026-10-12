import { expect, test } from "@rstest/core";
import { createWorldState } from "../../lib/targets";
import { createIotWorld } from "../../lib/targets/iot-lab";
import {
  isRaining,
  mapStage,
  parseBeaconSerial,
  parseRoverSerial,
  resolveSceneId,
  SOIL_DRY,
  SOIL_WET,
  soilFill,
  toyExpression,
} from "./map-scene";

test("treats any rain above zero as wet", () => {
  expect(isRaining(0)).toBe(false);
  expect(isRaining(0.2)).toBe(true);
});

test("paints wetter soil darker", () => {
  expect(soilFill(0)).toBe(SOIL_DRY);
  expect(soilFill(100)).toBe(SOIL_WET);
  expect(soilFill(40)).not.toBe(SOIL_DRY);
});

test("maps a smart window from the iot world", () => {
  const world = createWorldState("iot", "smart-window");
  world.iot = createIotWorld("smart-window", { rain: 1, position: 80, temperature: 22 });
  const model = mapStage({ kind: "iot", world, packSlug: "smart-window" });
  expect(model.sceneId).toBe("smart-window");
  expect(model.window).toEqual({ openPct: 80, raining: true });
  expect(model.readouts.length).toBeGreaterThanOrEqual(3);
  expect(model.readouts.length).toBeLessThanOrEqual(5);
});

test("maps irrigation pump, flow, and soil", () => {
  const world = createWorldState("iot", "agri-irrigation");
  world.iot = createIotWorld("agri-irrigation", { soil: 80, pump: 1, flow: 1.2, rain: 0 });
  const model = mapStage({ kind: "iot", world, packSlug: "agri-irrigation" });
  expect(model.irrigation.pumpOn).toBe(true);
  expect(model.irrigation.flowing).toBe(true);
  expect(model.irrigation.soil).toBe(soilFill(80));
});

test("maps pond level, aerator, and spray", () => {
  const world = createWorldState("iot", "agri-pond");
  world.iot = createIotWorld("agri-pond", { level_pct: 40, aerator: 1, spray: 1 });
  const model = mapStage({ kind: "iot", world, packSlug: "agri-pond" });
  expect(model.pond).toEqual({ aeratorOn: true, levelPct: 40, sprayOn: true });
});

test("keeps air beacon readings on the air-beacon pack", () => {
  const world = createWorldState("iot", "air-beacon");
  world.iot = createIotWorld("air-beacon", { temperature: 27, humidity: 62 });
  const model = mapStage({
    kind: "iot",
    world,
    packSlug: "air-beacon",
    templateId: "HP-01 Air Beacon",
  });
  expect(model.sceneId).toBe("air-beacon");
  expect(model.beacon.temperature).toBe(27);
  expect(model.beacon.humidity).toBe(62);
  expect(model.window.raining).toBe(false);
});

test("keeps an idle air beacon before any run", () => {
  const model = mapStage({
    kind: "iot",
    world: null,
    templateId: "HP-01 Air Beacon",
    boardSku: "board.espressif.esp32-s3-devkitc-1",
  });
  expect(model.sceneId).toBe("air-beacon");
  expect(model.beacon.temperature).toBeCloseTo(24.1, 1);
  expect(model.beacon.humidity).toBe(48);
  expect(model.beacon.live).toBe(false);
  expect(model.readouts).toHaveLength(3);
});

test("reads beacon digits from the firmware serial log", () => {
  expect(parseBeaconSerial("BME280 mock T=24.1 H=48")).toEqual({
    temperature: 24.1,
    humidity: 48,
  });
  expect(parseBeaconSerial("boot")).toBeNull();
  const model = mapStage({
    kind: "iot",
    world: null,
    templateId: "HP-01 Air Beacon",
    firmware: { serialLog: "BME280 mock T=21.5 H=60", status: "export_only" },
  });
  expect(model.beacon.temperature).toBeCloseTo(21.5, 1);
  expect(model.beacon.humidity).toBe(60);
  expect(model.beacon.live).toBe(true);
});

test("maps a desk rover speed from the adapter log", () => {
  expect(parseRoverSerial("motor A=0 B=0 heading=0")).toEqual({ speed: 0 });
  expect(parseRoverSerial("motor A=20 B=10")).toEqual({ speed: 30 });
  expect(resolveSceneId({ kind: "iot", templateId: "HP-02 Desk Rover" })).toBe("desk-rover");
  expect(resolveSceneId({ kind: "iot", templateId: "HP-03 Room Node" })).toBe("room-node");
});

test("maps smart-home lights and toy expression", () => {
  const home = createWorldState("smarthome");
  home.home.lights.living = { on: true, brightness: 70 };
  home.home.devices.fan = true;
  home.home.devices.curtain = true;
  const homeModel = mapStage({ kind: "smarthome", world: home });
  expect(homeModel.sceneId).toBe("smarthome");
  expect(homeModel.home.lights.living.on).toBe(true);
  expect(homeModel.home.fan).toBe(true);
  expect(homeModel.home.curtain).toBe(true);

  const toy = createWorldState("toy");
  toy.toy.led = "green";
  toy.toy.speed = 60;
  toy.toy.speech = "";
  expect(toyExpression(toy.toy)).toBe("happy");
  toy.toy.speech = "hello";
  toy.toy.x = 90;
  expect(toyExpression(toy.toy)).toBe("talk");
  const toyModel = mapStage({ kind: "toy", world: toy });
  expect(toyModel.toy.expression).toBe("talk");
  expect(toyModel.toy.nudgeX).toBeGreaterThan(0);
});
