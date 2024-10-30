/**
 * Safe step interpreter for create kinds (no network / no DOM).
 * Simplified from BlockyEdu Platform Specs `runtime.ts`.
 */
import type { ArtifactKind } from "../../types/artifact";

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
}

export interface RunResult {
  status: StepStatus;
  lines: ConsoleLine[];
  finalState: WorldState;
  durationMs: number;
  errorMessage?: string;
}

const ROOM_LABELS: Record<string, string> = {
  living: "客厅",
  bedroom: "卧室",
  kitchen: "厨房",
};

const DEVICE_LABELS: Record<string, string> = {
  curtain: "窗帘",
  socket: "插座",
  fan: "风扇",
  alarm: "安防警报",
};

const SCENE_LABELS: Record<string, string> = {
  home: "回家模式",
  away: "离家模式",
  sleep: "睡眠模式",
  movie: "观影模式",
};

const LED_LABELS: Record<string, string> = {
  red: "红色",
  green: "绿色",
  blue: "蓝色",
  yellow: "黄色",
  off: "熄灭",
};

const MOVE_LABELS: Record<string, string> = {
  forward: "前进",
  backward: "后退",
  left: "左转",
  right: "右转",
};

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

export function createWorldState(kind: ArtifactKind): WorldState {
  return {
    kind,
    web: {
      title: "预览页面",
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
      scene: "无",
      timeline: [],
    },
    toy: {
      x: 50,
      y: 70,
      heading: 0,
      speed: 0,
      moving: "停止",
      led: "off",
      servos: { head: 90, arm: 90, claw: 90 },
      sensors: { line: 1, distance: 80, light: 400 },
      sound: "",
      speech: "",
      timeline: [],
    },
  };
}

export type RuntimeKind = Exclude<ArtifactKind, "exercise" | "free">;

interface RunOptions {
  code: string;
  kind: RuntimeKind;
  timeoutMs?: number;
  maxSteps?: number;
}

/** Strip generator `__step('…')` markers — unused in Phase 3 light replay. */
function stripStepMarkers(code: string): string {
  return code.replace(/__step\('[^']*'\);\n?/g, "");
}

/**
 * Execute generated create-kind code against a sandboxed world.
 * Only `web` / `mp` / `home` / `toy` / `console` are exposed — no network/DOM.
 */
export function runTargetProgram(options: RunOptions): RunResult {
  const startedAt = performance.now();
  const timeoutMs = options.timeoutMs ?? 2000;
  const maxSteps = options.maxSteps ?? 500;
  const state = createWorldState(options.kind);
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
      state.web.title = toText(text) || "预览页面";
      pushLine("log", `页面标题：${state.web.title}`);
    },
    setTheme: (primary: unknown, background: unknown) => {
      guard();
      state.web.primary = toText(primary) || "#1677ff";
      state.web.background = toText(background) || "#f5f5f5";
      pushLine("log", `主题色 ${state.web.primary}，背景 ${state.web.background}`);
    },
    addHeading: (text: unknown, level: unknown) => {
      guard();
      const value = toText(text);
      state.web.elements.push({ kind: "heading", text: value, level: toText(level) || "h2" });
      pushLine("log", `添加标题：${value}`);
    },
    addText: (text: unknown) => {
      guard();
      const value = toText(text);
      state.web.elements.push({ kind: "text", text: value });
      pushLine("log", `添加段落：${value}`);
    },
    addCard: (title: unknown, body: unknown) => {
      guard();
      const head = toText(title);
      state.web.elements.push({ kind: "card", text: head, extra: toText(body) });
      pushLine("log", `添加卡片：${head}`);
    },
    addButton: (label: unknown, message: unknown) => {
      guard();
      const text = toText(label) || "按钮";
      state.web.elements.push({ kind: "button", text, extra: toText(message) });
      pushLine("log", `添加按钮：${text}`);
    },
    addImageBox: (caption: unknown) => {
      guard();
      const text = toText(caption);
      state.web.elements.push({ kind: "image", text });
      pushLine("log", `添加图片占位：${text || "未命名"}`);
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
      pushLine("log", `创建页面 ${id}：${page.title}`);
    },
    addComponent: (pageId: unknown, kind: unknown, content: unknown) => {
      guard();
      const page = ensurePage(toText(pageId) || "home");
      const componentKind = (toText(kind) || "text") as MiniAppComponent["kind"];
      const text = toText(content);
      page.components.push({ kind: componentKind, content: text });
      pushLine("log", `页面 ${page.id} 添加组件 ${componentKind}：${text}`);
    },
    setData: (key: unknown, value: unknown) => {
      guard();
      const dataKey = toText(key) || "value";
      state.miniapp.data[dataKey] = value;
      pushLine("log", `数据 ${dataKey} = ${toText(value)}`);
    },
    bindData: (pageId: unknown, key: unknown, label: unknown) => {
      guard();
      const page = ensurePage(toText(pageId) || "home");
      const dataKey = toText(key) || "value";
      page.components.push({ kind: "bind", content: toText(label), dataKey });
      pushLine("log", `页面 ${page.id} 绑定数据 ${dataKey}`);
    },
    addNavButton: (label: unknown, pageId: unknown) => {
      guard();
      const page = ensurePage(state.miniapp.activePage || "home");
      const target = toText(pageId) || "home";
      page.components.push({
        kind: "nav",
        content: toText(label) || "跳转",
        targetPage: target,
      });
      pushLine("log", `添加跳转按钮，目标页面 ${target}`);
    },
    navigate: (pageId: unknown) => {
      guard();
      const target = toText(pageId) || "home";
      ensurePage(target);
      state.miniapp.activePage = target;
      pushLine("log", `跳转到页面 ${target}`);
    },
    showToast: (text: unknown) => {
      guard();
      const value = toText(text);
      state.miniapp.toasts.push(value);
      pushLine("log", `提示：${value}`);
    },
  };

  const home = {
    setLight: (room: unknown, stateValue: unknown) => {
      guard();
      const key = toText(room) || "living";
      const on = toText(stateValue) === "on";
      if (!state.home.lights[key]) state.home.lights[key] = { on: false, brightness: 60 };
      state.home.lights[key].on = on;
      const text = `${ROOM_LABELS[key] || key}灯${on ? "打开" : "关闭"}`;
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
      const text = `${ROOM_LABELS[key] || key}灯亮度调到 ${brightness}%`;
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    setTemperature: (value: unknown) => {
      guard();
      state.home.temperature = clamp(Math.round(toNumber(value, 26)), 16, 32);
      const text = `空调目标温度设为 ${state.home.temperature}℃`;
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    setDevice: (device: unknown, stateValue: unknown) => {
      guard();
      const key = toText(device) || "socket";
      const on = toText(stateValue) === "on";
      state.home.devices[key] = on;
      const text = `${DEVICE_LABELS[key] || key}${on ? "打开" : "关闭"}`;
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    readSensor: (sensor: unknown) => {
      guard();
      const key = toText(sensor) || "temperature";
      const value = toNumber(state.home.sensors[key], 0);
      pushLine("log", `读取传感器 ${key}：${value}`);
      return value;
    },
    triggerSensor: (sensor: unknown, value: unknown) => {
      guard();
      const key = toText(sensor) || "temperature";
      const num = toNumber(value, 0);
      state.home.sensors[key] = num;
      const text = `传感器 ${key} 读数变为 ${num}`;
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    runScene: (scene: unknown) => {
      guard();
      const key = toText(scene) || "home";
      state.home.scene = SCENE_LABELS[key] || key;
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
      const text = `执行场景联动：${state.home.scene}`;
      state.home.timeline.push(text);
      pushLine("log", text);
    },
    wait: (seconds: unknown) => {
      guard();
      const value = clamp(toNumber(seconds, 1), 0, 10);
      pushLine("log", `等待 ${value} 秒`);
    },
  };

  const toy = {
    move: (direction: unknown, speed: unknown, seconds: unknown) => {
      guard();
      const dir = toText(direction) || "forward";
      const spd = clamp(Math.round(toNumber(speed, 60)), 0, 100);
      const secs = clamp(toNumber(seconds, 1), 0, 10);
      state.toy.speed = spd;
      state.toy.moving = MOVE_LABELS[dir] || dir;
      if (dir === "left") state.toy.heading = (state.toy.heading - 90 + 360) % 360;
      else if (dir === "right") state.toy.heading = (state.toy.heading + 90) % 360;
      else {
        const sign = dir === "backward" ? -1 : 1;
        const distance = (spd / 100) * secs * 14;
        const rad = (state.toy.heading * Math.PI) / 180;
        state.toy.x = clamp(state.toy.x + Math.sin(rad) * distance * sign, 6, 94);
        state.toy.y = clamp(state.toy.y - Math.cos(rad) * distance * sign, 6, 94);
      }
      const text = `${state.toy.moving}，速度 ${spd}，持续 ${secs} 秒`;
      state.toy.timeline.push(text);
      pushLine("log", text);
    },
    stop: () => {
      guard();
      state.toy.speed = 0;
      state.toy.moving = "停止";
      state.toy.timeline.push("小车停止");
      pushLine("log", "小车停止");
    },
    setServo: (servo: unknown, angle: unknown) => {
      guard();
      const key = toText(servo) || "arm";
      const value = clamp(Math.round(toNumber(angle, 90)), 0, 180);
      state.toy.servos[key] = value;
      const text = `舵机 ${key} 转到 ${value} 度`;
      state.toy.timeline.push(text);
      pushLine("log", text);
    },
    setLed: (color: unknown) => {
      guard();
      const key = toText(color) || "off";
      state.toy.led = key;
      const text = `LED 设为${LED_LABELS[key] || key}`;
      state.toy.timeline.push(text);
      pushLine("log", text);
    },
    buzz: (tone: unknown) => {
      guard();
      const key = toText(tone) || "beep";
      state.toy.sound = key;
      const text = `蜂鸣器播放 ${key}`;
      state.toy.timeline.push(text);
      pushLine("log", text);
    },
    readSensor: (sensor: unknown) => {
      guard();
      const key = toText(sensor) || "line";
      const value = toNumber(state.toy.sensors[key], 0);
      pushLine("log", `读取传感器 ${key}：${value}`);
      return value;
    },
    wait: (seconds: unknown) => {
      guard();
      const value = clamp(toNumber(seconds, 1), 0, 10);
      pushLine("log", `等待 ${value} 秒`);
    },
    say: (text: unknown) => {
      guard();
      const value = toText(text);
      state.toy.speech = value;
      state.toy.timeline.push(`说：${value}`);
      pushLine("log", `玩具说：${value}`);
    },
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
      "console",
      "__step",
      `"use strict";\n${code}`,
    );
    runner(web, mp, home, toy, sandboxConsole, setBlock);
  } catch (error) {
    if (aborted === "timeout") {
      status = "timeout";
      errorMessage = `执行超时（超过 ${timeoutMs} ms）`;
      pushLine("system", errorMessage);
    } else if (aborted === "step_limit") {
      status = "step_limit";
      errorMessage = `执行步数超过上限 ${maxSteps} 步`;
      pushLine("system", errorMessage);
    } else {
      status = "error";
      const raw = error as Error;
      errorMessage = raw?.message || "运行时错误";
      pushLine("error", errorMessage);
    }
  }

  if (status === "success" && lines.length === 0) {
    pushLine("system", "程序执行完成，但没有产生任何可预览的动作。");
  }

  return {
    status,
    lines,
    finalState: cloneState(state),
    durationMs: Math.round(performance.now() - startedAt),
    errorMessage,
  };
}
