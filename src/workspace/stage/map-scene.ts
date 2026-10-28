import type { HomeState, ToyState, WorldState } from "../../lib/targets";
import type { IotWorldState } from "../../lib/targets/iot-lab";

export type SceneId =
  | "smart-window"
  | "agri-irrigation"
  | "agri-pond"
  | "air-beacon"
  | "desk-rover"
  | "room-node"
  | "smarthome"
  | "toy";

export type Readout = {
  id: string;
  labelKey: string;
  value: number;
  min: number;
  max: number;
  digits: number;
  unitKey?: string;
  format?: "number" | "bool";
};

export type StageEvent = {
  id: string;
  text: string;
};

export type StageAssertion = {
  id: string;
  name: string;
  ok: boolean;
  detail: string;
};

export type ToyExpression = "idle" | "happy" | "alert" | "talk" | "move";

export type FirmwareView = {
  serialLog: string;
  status: string;
  assertions?: Array<{ id: string; name: string; ok: boolean; detail: string }>;
} | null;

export type StageModel = {
  sceneId: SceneId;
  readouts: Readout[];
  events: StageEvent[];
  assertions: StageAssertion[];
  window: { openPct: number; raining: boolean };
  irrigation: {
    pumpOn: boolean;
    moisture: number;
    flowing: boolean;
    raining: boolean;
    soil: string;
  };
  pond: { aeratorOn: boolean; levelPct: number; sprayOn: boolean };
  beacon: { temperature: number; humidity: number; comfort: number; live: boolean };
  rover: { speed: number; heading: number; ledOn: boolean };
  room: { temperature: number; humidity: number; relayOn: boolean };
  home: {
    lights: Record<string, { on: boolean; brightness: number }>;
    devices: Record<string, boolean>;
    sensors: Record<string, number>;
    fan: boolean;
    curtain: boolean;
    ac: boolean;
    temperature: number;
    scene: string;
  };
  toy: {
    expression: ToyExpression;
    led: string;
    speech: string;
    speed: number;
    heading: number;
    nudgeX: number;
    distance: number;
  };
};

export const SOIL_DRY = "#d7b07a";
export const SOIL_WET = "#3f6b46";

const IDLE_BEACON = { temperature: 24.1, humidity: 48 };

/** Rain above this value matches the lab interlock (`rain > 0`). */
export function isRaining(rain: number): boolean {
  return rain > 0;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function mixHex(from: string, to: string, t: number): string {
  const amount = clamp(t, 0, 1);
  const parse = (hex: string) => {
    const raw = hex.replace("#", "");
    return [0, 2, 4].map((index) => Number.parseInt(raw.slice(index, index + 2), 16));
  };
  const a = parse(from);
  const b = parse(to);
  const channel = (index: number) =>
    Math.round(a[index] + (b[index] - a[index]) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

export function soilFill(moisture: number): string {
  return mixHex(SOIL_DRY, SOIL_WET, clamp(moisture, 0, 100) / 100);
}

export function resolveSceneId(input: {
  kind: "iot" | "smarthome" | "toy";
  packSlug?: string | null;
  templateId?: string | null;
  boardSku?: string | null;
}): SceneId {
  if (input.kind === "smarthome") return "smarthome";
  if (input.kind === "toy") return "toy";
  if (input.packSlug === "smart-window") return "smart-window";
  if (input.packSlug === "agri-irrigation") return "agri-irrigation";
  if (input.packSlug === "agri-pond") return "agri-pond";
  if (input.packSlug === "air-beacon") return "air-beacon";
  if (input.packSlug === "room-node") return "room-node";
  if (input.packSlug === "desk-rover") return "desk-rover";
  const template = input.templateId ?? "";
  if (template.includes("Desk Rover") || template.includes("HP-02")) return "desk-rover";
  if (template.includes("Room Node") || template.includes("HP-03") || template === "设备联动") {
    return "room-node";
  }
  if ((input.boardSku ?? "").includes("nucleo") && !input.packSlug) return "desk-rover";
  return "air-beacon";
}

export function toyExpression(toy: ToyState | null): ToyExpression {
  if (!toy) return "idle";
  if (toy.speech.trim()) return "talk";
  if (toy.led === "red" || toy.led === "yellow") return "alert";
  if (toy.led === "green" || toy.led === "blue") return "happy";
  if (toy.speed > 0) return "move";
  return "idle";
}

/** Display values already printed by the firmware adapter log. Not an MCU pass. */
export function parseBeaconSerial(
  log: string | null | undefined,
): { temperature: number; humidity: number } | null {
  if (!log) return null;
  const temperature = /T=([0-9]+(?:\.[0-9]+)?)/.exec(log);
  const humidity = /H=([0-9]+(?:\.[0-9]+)?)/.exec(log);
  if (!temperature && !humidity) return null;
  return {
    temperature: temperature ? Number(temperature[1]) : IDLE_BEACON.temperature,
    humidity: humidity ? Number(humidity[1]) : IDLE_BEACON.humidity,
  };
}

export function parseRoverSerial(log: string | null | undefined): { speed: number } | null {
  if (!log) return null;
  const match = /motor\s+A=(-?[0-9.]+)\s+B=(-?[0-9.]+)/i.exec(log);
  if (!match) return null;
  const a = Math.abs(Number(match[1]));
  const b = Math.abs(Number(match[2]));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { speed: a + b };
}

function comfortIndex(temperature: number, humidity: number): number {
  const score = 100 - Math.abs(temperature - 22) * 8 - Math.abs(humidity - 50) * 0.8;
  return Math.round(clamp(score, 0, 100));
}

function num(record: Record<string, number> | undefined, key: string, fallback: number): number {
  const value = Number(record?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function readout(
  id: string,
  labelKey: string,
  value: number,
  min: number,
  max: number,
  digits: number,
  unitKey?: string,
  format: "number" | "bool" = "number",
): Readout {
  return { id, labelKey, value, min, max, digits, unitKey, format };
}

function idleHomeLights(): Record<string, { on: boolean; brightness: number }> {
  return {
    living: { on: false, brightness: 60 },
    bedroom: { on: false, brightness: 60 },
    kitchen: { on: false, brightness: 60 },
  };
}

function mapHome(home: HomeState | null): StageModel["home"] {
  const lights =
    home?.lights && Object.keys(home.lights).length > 0 ? home.lights : idleHomeLights();
  return {
    lights,
    devices: { ...(home?.devices ?? {}) },
    sensors: { ...(home?.sensors ?? {}) },
    fan: Boolean(home?.devices.fan),
    curtain: Boolean(home?.devices.curtain),
    ac: Boolean(home?.devices.ac),
    temperature: home?.temperature ?? 26,
    scene: home?.scene ?? "",
  };
}

function mapToy(toy: ToyState | null): StageModel["toy"] {
  return {
    expression: toyExpression(toy),
    led: toy?.led || "off",
    speech: toy?.speech ?? "",
    speed: toy?.speed ?? 0,
    heading: toy?.heading ?? 0,
    nudgeX: clamp(((toy?.x ?? 50) - 50) * 0.6, -28, 28),
    distance: toy?.sensors.distance ?? 80,
  };
}

function eventsFrom(lines: string[]): StageEvent[] {
  return lines.slice(-8).map((text, index) => ({ id: `${index}:${text}`, text }));
}

function firmwareEvents(firmware: FirmwareView): StageEvent[] {
  if (!firmware?.serialLog.trim()) return [];
  return eventsFrom(
    firmware.serialLog
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

function firmwareAssertions(firmware: FirmwareView): StageAssertion[] {
  return (firmware?.assertions ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    ok: item.ok,
    detail: item.detail,
  }));
}

export function mapStage(input: {
  kind: "iot" | "smarthome" | "toy";
  world: WorldState | null;
  packSlug?: string | null;
  templateId?: string | null;
  boardSku?: string | null;
  firmware?: FirmwareView;
}): StageModel {
  const sceneId = resolveSceneId(input);
  const iot = input.world?.iot ?? null;
  const home = mapHome(input.world?.home ?? null);
  const toy = mapToy(input.world?.toy ?? null);
  const serialBeacon = parseBeaconSerial(input.firmware?.serialLog);
  const serialRover = parseRoverSerial(input.firmware?.serialLog);
  const beaconLive = Boolean(input.world) || Boolean(input.firmware?.serialLog?.trim());

  const beaconTemp =
    iot && (iot.channels.temperature != null || iot.channels.temp != null)
      ? num(iot.channels, "temperature", num(iot.channels, "temp", IDLE_BEACON.temperature))
      : (serialBeacon?.temperature ??
        (input.world
          ? num(input.world.home.sensors, "temperature", input.world.home.temperature)
          : IDLE_BEACON.temperature));
  const beaconHum =
    iot && iot.channels.humidity != null
      ? num(iot.channels, "humidity", IDLE_BEACON.humidity)
      : (serialBeacon?.humidity ??
        (input.world
          ? num(input.world.home.sensors, "humidity", IDLE_BEACON.humidity)
          : IDLE_BEACON.humidity));

  const windowState = {
    openPct: clamp(iot ? num(iot.channels, "position", 0) : 0, 0, 100),
    raining: isRaining(iot ? num(iot.channels, "rain", 0) : 0),
  };
  const moisture = iot ? num(iot.channels, "soil", 45) : 45;
  const pumpOn = iot ? num(iot.channels, "pump", 0) > 0 : false;
  const irrigation = {
    pumpOn,
    moisture,
    flowing: pumpOn && (iot ? num(iot.channels, "flow", 0) > 0 : false),
    raining: isRaining(iot ? num(iot.channels, "rain", 0) : 0),
    soil: soilFill(moisture),
  };
  const pond = {
    aeratorOn: iot ? num(iot.channels, "aerator", 0) > 0 : false,
    levelPct: clamp(iot ? num(iot.channels, "level_pct", 80) : 80, 0, 100),
    sprayOn: iot ? num(iot.channels, "spray", 0) > 0 : false,
  };
  const roverPack = iot?.packSlug === "desk-rover";
  const roverSpeed = roverPack
    ? num(iot?.channels, "speed", 0)
    : toy.speed > 0
      ? toy.speed
      : (serialRover?.speed ?? 0);
  const roverHeading = roverPack ? num(iot?.channels, "heading", toy.heading) : toy.heading;
  const roverLedOn = roverPack ? num(iot?.channels, "led", 0) > 0 : toy.led !== "off";
  const relayOn = Boolean(input.world?.home.devices.light) || num(iot?.channels, "relay", 0) > 0;

  const readouts = readoutsFor(sceneId, {
    iot,
    home,
    toy,
    beaconTemp,
    beaconHum,
    irrigation,
    pond,
    roverSpeed,
    roverHeading,
    roverLedOn,
    relayOn,
  });

  const worldEvents = iot
    ? eventsFrom(iot.timeline.map((event) => event.text))
    : input.kind === "smarthome"
      ? eventsFrom(input.world?.home.timeline ?? [])
      : input.kind === "toy"
        ? eventsFrom(input.world?.toy.timeline ?? [])
        : eventsFrom(input.world?.home.timeline ?? []);
  const events = worldEvents.length > 0 ? worldEvents : firmwareEvents(input.firmware ?? null);
  const iotAssertions: StageAssertion[] = (iot?.assertions ?? []).map((item) => ({
    id: item.id,
    name: item.id,
    ok: item.ok,
    detail: item.detail,
  }));
  const assertions =
    iotAssertions.length > 0 ? iotAssertions : firmwareAssertions(input.firmware ?? null);

  return {
    sceneId,
    readouts,
    events,
    assertions,
    window: windowState,
    irrigation,
    pond,
    beacon: {
      temperature: beaconTemp,
      humidity: beaconHum,
      comfort: comfortIndex(beaconTemp, beaconHum),
      live: beaconLive,
    },
    rover: {
      speed: roverSpeed,
      heading: roverHeading,
      ledOn: roverLedOn,
    },
    room: { temperature: beaconTemp, humidity: beaconHum, relayOn },
    home,
    toy,
  };
}

function readoutsFor(
  sceneId: SceneId,
  src: {
    iot: IotWorldState | null;
    home: StageModel["home"];
    toy: StageModel["toy"];
    beaconTemp: number;
    beaconHum: number;
    irrigation: StageModel["irrigation"];
    pond: StageModel["pond"];
    roverSpeed: number;
    roverHeading: number;
    roverLedOn: boolean;
    relayOn: boolean;
  },
): Readout[] {
  const ch = (key: string, fallback: number) => num(src.iot?.channels, key, fallback);
  if (sceneId === "smart-window") {
    return [
      readout("rain", "iotCh.rain", ch("rain", 0), 0, 1, 0, undefined, "bool"),
      readout("temperature", "iotCh.temperature", ch("temperature", 22), 0, 50, 1, "stage.unit.c"),
      readout("position", "iotCh.position", ch("position", 0), 0, 100, 0, "stage.unit.pct"),
    ];
  }
  if (sceneId === "agri-irrigation") {
    return [
      readout("soil", "iotCh.soil", src.irrigation.moisture, 0, 100, 0, "stage.unit.pct"),
      readout("rain", "iotCh.rain", ch("rain", 0), 0, 1, 0, undefined, "bool"),
      readout("flow", "iotCh.flow", ch("flow", 0), 0, 5, 1, "stage.unit.lpm"),
      readout("pump", "iotCh.pump", src.irrigation.pumpOn ? 1 : 0, 0, 1, 0, undefined, "bool"),
    ];
  }
  if (sceneId === "agri-pond") {
    return [
      readout("do", "iotCh.do_mgl", ch("do_mgl", 6.5), 0, 12, 1, "stage.unit.mgl"),
      readout("level", "iotCh.level_pct", src.pond.levelPct, 0, 100, 0, "stage.unit.pct"),
      readout("temp", "iotCh.temp", ch("temp", 24), 0, 40, 1, "stage.unit.c"),
      readout("aerator", "iotCh.aerator", src.pond.aeratorOn ? 1 : 0, 0, 1, 0, undefined, "bool"),
      readout("spray", "iotCh.spray", src.pond.sprayOn ? 1 : 0, 0, 1, 0, undefined, "bool"),
    ];
  }
  if (sceneId === "smarthome") {
    const living = src.home.lights.living;
    return [
      readout("temperature", "sensor.temperature", src.home.temperature, 0, 40, 0, "stage.unit.c"),
      readout(
        "light",
        "device.light",
        living?.on ? living.brightness : 0,
        0,
        100,
        0,
        "stage.unit.pct",
      ),
      readout("fan", "device.fan", src.home.fan ? 1 : 0, 0, 1, 0, undefined, "bool"),
      readout("curtain", "device.curtain", src.home.curtain ? 1 : 0, 0, 1, 0, undefined, "bool"),
    ];
  }
  if (sceneId === "toy") {
    return [
      readout("speed", "stage.readout.speed", src.toy.speed, 0, 100, 0),
      readout("heading", "stage.readout.heading", src.toy.heading, 0, 360, 0, "stage.unit.deg"),
      readout(
        "led",
        "stage.readout.led",
        src.toy.led === "off" ? 0 : 1,
        0,
        1,
        0,
        undefined,
        "bool",
      ),
      readout("distance", "stage.readout.distance", src.toy.distance, 0, 200, 0),
    ];
  }
  if (sceneId === "desk-rover") {
    return [
      readout("speed", "stage.readout.speed", src.roverSpeed, 0, 100, 0),
      readout("heading", "stage.readout.heading", src.roverHeading, 0, 360, 0, "stage.unit.deg"),
      readout("led", "stage.readout.led", src.roverLedOn ? 1 : 0, 0, 1, 0, undefined, "bool"),
    ];
  }
  if (sceneId === "room-node") {
    return [
      readout("temperature", "sensor.temperature", src.beaconTemp, 0, 50, 1, "stage.unit.c"),
      readout("humidity", "sensor.humidity", src.beaconHum, 0, 100, 0, "stage.unit.pct"),
      readout("relay", "stage.readout.relay", src.relayOn ? 1 : 0, 0, 1, 0, undefined, "bool"),
    ];
  }
  return [
    readout("temperature", "sensor.temperature", src.beaconTemp, 0, 50, 1, "stage.unit.c"),
    readout("humidity", "sensor.humidity", src.beaconHum, 0, 100, 0, "stage.unit.pct"),
    readout(
      "comfort",
      "stage.readout.comfort",
      comfortIndex(src.beaconTemp, src.beaconHum),
      0,
      100,
      0,
      "stage.unit.pct",
    ),
  ];
}

export function defaultModuleSkus(sceneId: SceneId): string[] {
  switch (sceneId) {
    case "smart-window":
      return ["mod.relay-12v-iso", "mod.limit-switch", "mod.rain-sensor"];
    case "agri-irrigation":
      return ["mod.relay-12v-iso", "mod.soil-moisture"];
    case "agri-pond":
      return ["mod.relay-12v-iso", "mod.float-switch"];
    case "desk-rover":
      return ["mod.motor-tb6612", "mod.ssd1306", "mod.led"];
    case "room-node":
      return ["mod.bme280", "mod.relay", "mod.button"];
    case "smarthome":
      return ["mod.bme280", "mod.relay", "mod.led"];
    case "toy":
      return ["mod.led", "mod.button", "mod.motor-tb6612"];
    default:
      return ["mod.bme280", "mod.ssd1306", "mod.button"];
  }
}
