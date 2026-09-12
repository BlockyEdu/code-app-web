/**
 * Safe step interpreter for create kinds (no network / no DOM).
 * Simplified from BlockyEdu Platform Specs `runtime.ts`.
 */
import type { ArtifactKind } from "../../types/artifact";
import { t } from "../i18n";
import {
  createIotWorld,
  evaluateIotAssertions,
  type IotPackSlug,
  type IotWorldState,
  iotApi,
  isIotLabPack,
} from "./iot-lab";

export type StepStatus = "success" | "error" | "timeout" | "step_limit";

export interface ConsoleLine {
  level: "log" | "info" | "warn" | "error" | "system";
  text: string;
}

export interface WebElement {
  kind: "heading" | "text" | "card" | "button" | "image" | "notice";
  text: string;
  extra?: string;
  level?: string;
}

export interface MiniAppComponent {
  kind: "text" | "card" | "list" | "input" | "bind" | "nav";
  content: string;
  dataKey?: string;
  targetPage?: string;
}

export interface MiniAppPage {
  id: string;
  title: string;
  components: MiniAppComponent[];
}

export interface HomeState {
  lights: Record<string, { on: boolean; brightness: number }>;
  devices: Record<string, boolean>;
  temperature: number;
  sensors: Record<string, number>;
  scene: string;
  timeline: string[];
}

export interface ToyState {
  x: number;
  y: number;
  heading: number;
  speed: number;
  moving: string;
  led: string;
  servos: Record<string, number>;
  sensors: Record<string, number>;
  sound: string;
  speech: string;
  timeline: string[];
}

export interface WorldState {
  kind: ArtifactKind;
  web: {
    title: string;
    primary: string;
    background: string;
    elements: WebElement[];
    notices: string[];
  };
  miniapp: {
    pages: MiniAppPage[];
    activePage: string;
    data: Record<string, unknown>;
    toasts: string[];
  };
  home: HomeState;
  toy: ToyState;
  iot: IotWorldState | null;
}

export interface RunResult {
  status: StepStatus;
  lines: ConsoleLine[];
  finalState: WorldState;
  durationMs: number;
  errorMessage?: string;
}

function labeled(ns: "room" | "device" | "scene" | "led" | "move" | "sensor", key: string): string {
  const path = `${ns}.${key}`;
  const label = t(path);
  return label === path ? key : label;
}

function servoLabel(key: string): string {
  return key === "head" || key === "arm" || key === "claw" ? t(`servo.${key}`) : key;
}

function buzzLabel(key: string): string {
  return key === "beep" || key === "long" || key === "alert" || key === "win"
    ? t(`buzz.${key}`)
    : key;
}

function toySensorLabel(key: string): string {
  return key === "line" || key === "distance" || key === "light" ? t(`toySensor.${key}`) : key;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function cloneState(state: WorldState): WorldState {
  return JSON.parse(JSON.stringify(state)) as WorldState;
}

export function createWorldState(kind: ArtifactKind, packSlug?: IotPackSlug): WorldState {
  return {
    kind,
    web: {
      title: t("runtime.previewTitle"),
      primary: "#1677ff",
      background: "#f5f5f5",
      elements: [],
      notices: [],
    },
    miniapp: {
      pages: [],
      activePage: "",
      data: {},
      toasts: [],
    },
    home: {
      lights: {
        living: { on: false, brightness: 60 },
        bedroom: { on: false, brightness: 60 },
        kitchen: { on: false, brightness: 60 },
      },
      devices: { curtain: false, socket: false, fan: false, alarm: false },
      temperature: 26,
      sensors: {
        temperature: 24,
        humidity: 55,
        light: 300,
        motion: 0,
        smoke: 120,
        door: 0,
      },
      scene: t("runtime.sceneNone"),
      timeline: [],
    },
    toy: {
      x: 50,
      y: 70,
      heading: 0,
      speed: 0,
      moving: t("runtime.stopped"),
      led: "off",
      servos: { head: 90, arm: 90, claw: 90 },
      sensors: { line: 1, distance: 80, light: 400 },
      sound: "",
      speech: "",
      timeline: [],
    },
    iot: kind === "iot" && packSlug ? createIotWorld(packSlug) : null,
  };
}

export type RuntimeKind = Exclude<ArtifactKind, "exercise" | "free">;

interface RunOptions {
  code: string;
  kind: RuntimeKind;
  timeoutMs?: number;
  maxSteps?: number;
  packSlug?: IotPackSlug | string | null;
  telemetry?: Record<string, unknown>;
}

/** Strip generator `__step('…')` markers — unused in Phase 3 light replay. */
function stripStepMarkers(code: string): string {
  return code.replace(/__step\('[^']*'\);\n?/g, "");
}

/**
 * Execute generated create-kind code against a sandboxed world.
 * Only `web` / `mp` / `home` / `toy` / `iot` / `console` are exposed — no network/DOM.
 */
export function runTargetProgram(options: RunOptions): RunResult {
  const startedAt = performance.now();
  const timeoutMs = options.timeoutMs ?? 2000;
  const maxSteps = options.maxSteps ?? 500;
  const packSlug: IotPackSlug | undefined =
    options.kind === "iot"
      ? isIotLabPack(options.packSlug ?? "")
        ? (options.packSlug as IotPackSlug)
        : "smart-window"
      : undefined;
  const state = createWorldState(options.kind, packSlug);
  if (state.iot && options.telemetry) {
    state.iot = createIotWorld(state.iot.packSlug, options.telemetry);
  }
  const lines: ConsoleLine[] = [];
  let stepCount = 0;
  let aborted: StepStatus | null = null;
  let currentBlockId: string | null = null;

  const pushLine = (level: ConsoleLine["level"], text: string) => {
    lines.push({ level, text });
  };

  const guard = () => {
    if (aborted) throw new Error("__BLOCKY_ABORT__");
    if (performance.now() - startedAt > timeoutMs) {
      aborted = "timeout";
      throw new Error("__BLOCKY_ABORT__");
    }
    stepCount += 1;
    if (stepCount > maxSteps) {
      aborted = "step_limit";
      throw new Error("__BLOCKY_ABORT__");
    }
  };

  const setBlock = (id: string) => {
    currentBlockId = id || null;
    void currentBlockId;
  };

  const web = {
    setTitle: (text: unknown) => {
      guard();
      state.web.title = toText(text) || t("runtime.previewTitle");
      pushLine("log", t("runtime.pageTitle", { title: state.web.title }));
    },
    setTheme: (primary: unknown, background: unknown) => {
      guard();
      state.web.primary = toText(primary) || "#1677ff";
      state.web.background = toText(background) || "#f5f5f5";
      pushLine(
        "log",
        t("runtime.theme", { primary: state.web.primary, background: state.web.background }),
      );
    },
    addHeading: (text: unknown, level: unknown) => {
      guard();
      const value = toText(text);
      state.web.elements.push({ kind: "heading", text: value, level: toText(level) || "h2" });
      pushLine("log", t("runtime.addHeading", { value }));
    },
    addText: (text: unknown) => {
      guard();
      const value = toText(text);
      state.web.elements.push({ kind: "text", text: value });
      pushLine("log", t("runtime.addText", { value }));
    },
    addCard: (title: unknown, body: unknown) => {
      guard();
      const head = toText(title);
      state.web.elements.push({ kind: "card", text: head, extra: toText(body) });
      pushLine("log", t("runtime.addCard", { head }));
    },
    addButton: (label: unknown, message: unknown) => {
      guard();
      const text = toText(label) || t("runtime.button");
      state.web.elements.push({ kind: "button", text, extra: toText(message) });
      pushLine("log", t("runtime.addButton", { text }));
    },
    addImageBox: (caption: unknown) => {
      guard();
      const text = toText(caption);
      state.web.elements.push({ kind: "image", text });
      pushLine("log", t("runtime.addImage", { text: text || t("runtime.unnamed") }));
    },
  };

  const ensurePage = (pageId: string, title?: string): MiniAppPage => {
    const id = pageId || "home";
    let page = state.miniapp.pages.find((item) => item.id === id);
    if (!page) {
      page = { id, title: title || id, components: [] };
      state.miniapp.pages.push(page);
      if (!state.miniapp.activePage) state.miniapp.activePage = id;
    } else if (title) {
      page.title = title;
    }
    return page;
  };

  const mp = {
    createPage: (pageId: unknown, title: unknown) => {
      guard();
      const id = toText(pageId) || "home";
      const page = ensurePage(id, toText(title) || id);
      state.miniapp.activePage = id;
      pushLine("log", t("runtime.createPage", { id, title: page.title }));
    },
    addComponent: (pageId: unknown, kind: unknown, content: unknown) => {
      guard();
      const page = ensurePage(toText(pageId) || "home");
      const componentKind = (toText(kind) || "text") as MiniAppComponent["kind"];
      const text = toText(content);
      page.components.push({ kind: componentKind, content: text });
      pushLine("log", t("runtime.addComponent", { id: page.id, kind: componentKind, text }));
    },
    setData: (key: unknown, value: unknown) => {
      guard();
      const dataKey = toText(key) || "value";
      state.miniapp.data[dataKey] = value;
      pushLine("log", t("runtime.setData", { key: dataKey, value: toText(value) }));
    },
    bindData: (pageId: unknown, key: unknown, label: unknown) => {
      guard();
      const page = ensurePage(toText(pageId) || "home");
      const dataKey = toText(key) || "value";
      page.components.push({ kind: "bind", content: toText(label), dataKey });
      pushLine("log", t("runtime.bindData", { id: page.id, key: dataKey }));
    },
    addNavButton: (label: unknown, pageId: unknown) => {
      guard();
      const page = ensurePage(state.miniapp.activePage || "home");
      const target = toText(pageId) || "home";
      page.components.push({
        kind: "nav",
        content: toText(label) || t("runtime.nav"),
        targetPage: target,
      });
      pushLine("log", t("runtime.addNav", { target }));
    },
    navigate: (pageId: unknown) => {
      guard();
      const target = toText(pageId) || "home";
      ensurePage(target);
      state.miniapp.activePage = target;
      pushLine("log", t("runtime.navigate", { target }));
    },
    showToast: (text: unknown) => {
      guard();
      const value = toText(text);
      state.miniapp.toasts.push(value);
      pushLine("log", t("runtime.toast", { value }));
    },
  };

  const home = {
    setLight: (room: unknown, stateValue: unknown) => {
      guard();
      const key = toText(room) || "living";
      const on = toText(stateValue) === "on";
      if (!state.home.lights[key]) state.home.lights[key] = { on: false, brightness: 60 };
      state.home.lights[key].on = on;
      const text = t("runtime.lightToggle", {
        room: labeled("room", key),
        state: t(on ? "action.on" : "action.off"),
      });
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    setBrightness: (room: unknown, value: unknown) => {
      guard();
      const key = toText(room) || "living";
      const brightness = clamp(Math.round(toNumber(value, 60)), 0, 100);
      if (!state.home.lights[key]) state.home.lights[key] = { on: false, brightness: 60 };
      state.home.lights[key].brightness = brightness;
      if (brightness > 0) state.home.lights[key].on = true;
      const text = t("runtime.lightBrightness", { room: labeled("room", key), brightness });
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    setTemperature: (value: unknown) => {
      guard();
      state.home.temperature = clamp(Math.round(toNumber(value, 26)), 16, 32);
      const text = t("runtime.acTemp", { temp: state.home.temperature });
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    setDevice: (device: unknown, stateValue: unknown) => {
      guard();
      const key = toText(device) || "socket";
      const on = toText(stateValue) === "on";
      state.home.devices[key] = on;
      const text = t("runtime.deviceToggle", {
        device: labeled("device", key),
        state: t(on ? "action.on" : "action.off"),
      });
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    readSensor: (sensor: unknown) => {
      guard();
      const key = toText(sensor) || "temperature";
      const value = toNumber(state.home.sensors[key], 0);
      pushLine("log", t("runtime.readSensor", { key: labeled("sensor", key), value }));
      return value;
    },
    triggerSensor: (sensor: unknown, value: unknown) => {
      guard();
      const key = toText(sensor) || "temperature";
      const num = toNumber(value, 0);
      state.home.sensors[key] = num;
      const text = t("runtime.triggerSensor", { key: labeled("sensor", key), value: num });
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    runScene: (scene: unknown) => {
      guard();
      const key = toText(scene) || "home";
      state.home.scene = labeled("scene", key);
      if (key === "home") {
        state.home.lights.living = { on: true, brightness: 80 };
        state.home.devices.curtain = true;
        state.home.devices.alarm = false;
      } else if (key === "away") {
        for (const room of Object.keys(state.home.lights)) {
          state.home.lights[room].on = false;
        }
        state.home.devices.curtain = false;
        state.home.devices.socket = false;
        state.home.devices.alarm = true;
      } else if (key === "sleep") {
        state.home.lights.living.on = false;
        state.home.lights.kitchen.on = false;
        state.home.lights.bedroom = { on: true, brightness: 20 };
      } else if (key === "movie") {
        state.home.lights.living = { on: true, brightness: 20 };
        state.home.devices.curtain = false;
      }
      const text = t("runtime.runScene", { scene: state.home.scene });
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    wait: (seconds: unknown) => {
      guard();
      const value = clamp(toNumber(seconds, 1), 0, 10);
      pushLine("log", t("runtime.wait", { value }));
    },
  };

  const toy = {
    move: (direction: unknown, speed: unknown, seconds: unknown) => {
      guard();
      const dir = toText(direction) || "forward";
      const spd = clamp(Math.round(toNumber(speed, 60)), 0, 100);
      const secs = clamp(toNumber(seconds, 1), 0, 10);
      state.toy.speed = spd;
      state.toy.moving = labeled("move", dir);
      if (dir === "left") state.toy.heading = (state.toy.heading - 90 + 360) % 360;
      else if (dir === "right") state.toy.heading = (state.toy.heading + 90) % 360;
      else {
        const sign = dir === "backward" ? -1 : 1;
        const distance = (spd / 100) * secs * 14;
        const rad = (state.toy.heading * Math.PI) / 180;
        state.toy.x = clamp(state.toy.x + Math.sin(rad) * distance * sign, 6, 94);
        state.toy.y = clamp(state.toy.y - Math.cos(rad) * distance * sign, 6, 94);
      }
      const text = t("runtime.toyMove", { moving: state.toy.moving, spd, secs });
      state.toy.timeline.push(text);
      pushLine("log", text);
    },
    stop: () => {
      guard();
      state.toy.speed = 0;
      state.toy.moving = t("runtime.stopped");
      const text = t("runtime.toyStop");
      state.toy.timeline.push(text);
      pushLine("log", text);
    },
    setServo: (servo: unknown, angle: unknown) => {
      guard();
      const key = toText(servo) || "arm";
      const value = clamp(Math.round(toNumber(angle, 90)), 0, 180);
      state.toy.servos[key] = value;
      const text = t("runtime.servo", { key: servoLabel(key), value });
      state.toy.timeline.push(text);
      pushLine("log", text);
    },
    setLed: (color: unknown) => {
      guard();
      const key = toText(color) || "off";
      state.toy.led = key;
      const text = t("runtime.led", { color: labeled("led", key) });
      state.toy.timeline.push(text);
      pushLine("log", text);
    },
    buzz: (tone: unknown) => {
      guard();
      const key = toText(tone) || "beep";
      state.toy.sound = key;
      const text = t("runtime.buzz", { key: buzzLabel(key) });
      state.toy.timeline.push(text);
      pushLine("log", text);
    },
    readSensor: (sensor: unknown) => {
      guard();
      const key = toText(sensor) || "line";
      const value = toNumber(state.toy.sensors[key], 0);
      pushLine("log", t("runtime.toyRead", { key: toySensorLabel(key), value }));
      return value;
    },
    wait: (seconds: unknown) => {
      guard();
      const value = clamp(toNumber(seconds, 1), 0, 10);
      pushLine("log", t("runtime.wait", { value }));
    },
    say: (text: unknown) => {
      guard();
      const value = toText(text);
      state.toy.speech = value;
      state.toy.timeline.push(t("runtime.say", { value }));
      pushLine("log", t("runtime.toySay", { value }));
    },
  };

  const iot =
    state.iot != null
      ? iotApi(state.iot, guard, (text) => pushLine("log", text))
      : {
          readChannel: () => 0,
          setChannel: () => undefined,
          command: () => ({ decision: "deny" as const }),
          evaluateScene: () => ({ decision: "noop" as const }),
          wait: () => undefined,
          emergencyStop: () => undefined,
        };

  const sandboxConsole = {
    log: (...args: unknown[]) => {
      guard();
      pushLine("log", args.map(toText).join(" "));
    },
    info: (...args: unknown[]) => {
      guard();
      pushLine("info", args.map(toText).join(" "));
    },
    warn: (...args: unknown[]) => {
      guard();
      pushLine("warn", args.map(toText).join(" "));
    },
    error: (...args: unknown[]) => {
      guard();
      pushLine("error", args.map(toText).join(" "));
    },
  };

  let status: StepStatus = "success";
  let errorMessage: string | undefined;
  const code = stripStepMarkers(options.code);

  try {
    const runner = new Function(
      "web",
      "mp",
      "home",
      "toy",
      "iot",
      "console",
      "__step",
      `"use strict";\n${code}`,
    );
    runner(web, mp, home, toy, iot, sandboxConsole, setBlock);
  } catch (error) {
    if (aborted === "timeout") {
      status = "timeout";
      errorMessage = t("runtime.timeout", { ms: timeoutMs });
      pushLine("system", errorMessage);
    } else if (aborted === "step_limit") {
      status = "step_limit";
      errorMessage = t("runtime.stepLimit", { max: maxSteps });
      pushLine("system", errorMessage);
    } else {
      status = "error";
      const raw = error as Error;
      errorMessage = raw?.message || t("runtime.error");
      pushLine("error", errorMessage);
    }
  }

  if (status === "success" && lines.length === 0) {
    pushLine("system", t("runtime.noActions"));
  }

  if (state.iot) evaluateIotAssertions(state.iot);

  return {
    status,
    lines,
    finalState: cloneState(state),
    durationMs: Math.round(performance.now() - startedAt),
    errorMessage,
  };
}
