/** Deterministic IoT lab world for BlockyEdu (window / irrigation / pond). */

export type IotPackSlug = "smart-window" | "agri-irrigation" | "agri-pond";

export type IotRunMode = "sim" | "live" | "firmware";

export type IotEvent = {
  t: number;
  kind: "telemetry" | "command" | "scene" | "deny" | "stop";
  text: string;
  commandId?: string;
  reason?: string;
};

export type IotAssertion = {
  id: string;
  ok: boolean;
  detail: string;
};

export type IotWorldState = {
  packSlug: IotPackSlug;
  channels: Record<string, number>;
  actuators: Record<string, number | boolean | string>;
  killSwitch: boolean;
  timeline: IotEvent[];
  lastDecision: { decision: "dispatch" | "deny" | "noop"; commandId?: string; reason?: string } | null;
  assertions: IotAssertion[];
};

export const IOT_PACK_SLUGS: IotPackSlug[] = ["smart-window", "agri-irrigation", "agri-pond"];

export const TEMPLATE_TO_PACK: Record<string, IotPackSlug> = {
  智慧窗控: "smart-window",
  智慧灌溉: "agri-irrigation",
  鱼塘增氧: "agri-pond",
};

export const PACK_TO_TEMPLATE: Record<IotPackSlug, string> = {
  "smart-window": "智慧窗控",
  "agri-irrigation": "智慧灌溉",
  "agri-pond": "鱼塘增氧",
};

export const PACK_ASSERTIONS: Record<IotPackSlug, string[]> = {
  "smart-window": ["rain-close", "rain-deny-open", "heat-vent"],
  "agri-irrigation": ["soil-irrigate", "rain-skip", "dry-run-stop"],
  "agri-pond": ["low-do-aerate", "heat-spray", "low-level-deny-spray"],
};

const PACK_CHANNELS: Record<IotPackSlug, Array<{ key: string; label: string }>> = {
  "smart-window": [
    { key: "rain", label: "雨量" },
    { key: "temperature", label: "温度" },
    { key: "position", label: "开度" },
    { key: "limit_open", label: "开限位" },
    { key: "limit_close", label: "关限位" },
  ],
  "agri-irrigation": [
    { key: "soil", label: "土壤湿度" },
    { key: "rain", label: "雨量" },
    { key: "flow", label: "流量" },
    { key: "pump", label: "泵" },
    { key: "zone", label: "分区" },
  ],
  "agri-pond": [
    { key: "do_mgl", label: "溶氧" },
    { key: "level_pct", label: "水位" },
    { key: "temp", label: "水温" },
    { key: "aerator", label: "增氧" },
    { key: "spray", label: "喷淋" },
  ],
};

const PACK_COMMANDS: Record<IotPackSlug, Array<[string, string]>> = {
  "smart-window": [
    ["open", "开窗"],
    ["close", "关窗"],
    ["stop", "停止"],
    ["setPosition", "设定开度"],
  ],
  "agri-irrigation": [
    ["zoneOn", "开阀"],
    ["zoneOff", "关阀"],
    ["pumpOn", "开泵"],
    ["pumpOff", "停泵"],
  ],
  "agri-pond": [
    ["aerateOn", "增氧开"],
    ["aerateOff", "增氧关"],
    ["sprayOn", "喷淋开"],
    ["sprayOff", "喷淋关"],
  ],
};

const PACK_SCENES: Record<IotPackSlug, Array<[string, string]>> = {
  "smart-window": [
    ["win-rain-close", "下雨关窗"],
    ["win-heat-vent", "高温开缝"],
    ["win-manual", "手动窗控"],
    ["pack", "整包策略"],
  ],
  "agri-irrigation": [
    ["irr-soil", "土壤干燥浇水"],
    ["irr-rain-skip", "下雨跳过"],
    ["irr-dry-run", "无流量停泵"],
    ["pack", "整包策略"],
  ],
  "agri-pond": [
    ["pond-aerate", "低溶氧增氧"],
    ["pond-spray", "高温喷水"],
    ["pond-level", "低水位禁喷"],
    ["pack", "整包策略"],
  ],
};

export function isIotLabPack(value: string | null | undefined): value is IotPackSlug {
  return IOT_PACK_SLUGS.includes(value as IotPackSlug);
}

export function packSlugFromTemplate(templateId: string | null | undefined): IotPackSlug | null {
  if (!templateId) return null;
  return TEMPLATE_TO_PACK[templateId] ?? null;
}

export function channelOptions(packSlug: IotPackSlug): Array<[string, string]> {
  return PACK_CHANNELS[packSlug].map((ch) => [ch.label, ch.key]);
}

export function commandOptions(packSlug: IotPackSlug): Array<[string, string]> {
  return PACK_COMMANDS[packSlug];
}

export function sceneOptions(packSlug: IotPackSlug): Array<[string, string]> {
  return PACK_SCENES[packSlug];
}

export function createIotWorld(
  packSlug: IotPackSlug,
  telemetry?: Record<string, unknown>,
): IotWorldState {
  const defaults: Record<IotPackSlug, Record<string, number>> = {
    "smart-window": {
      rain: 0,
      temperature: 22,
      position: 0,
      limit_open: 0,
      limit_close: 1,
    },
    "agri-irrigation": { soil: 45, rain: 0, flow: 1.2, pump: 0, zone: 0 },
    "agri-pond": { do_mgl: 6.5, level_pct: 80, temp: 24, aerator: 0, spray: 0 },
  };
  const channels = { ...defaults[packSlug] };
  for (const [key, value] of Object.entries(telemetry ?? {})) {
    const num = Number(value);
    if (Number.isFinite(num)) channels[key] = num;
  }
  return {
    packSlug,
    channels,
    actuators: {},
    killSwitch: false,
    timeline: [],
    lastDecision: null,
    assertions: [],
  };
}

function num(world: IotWorldState, key: string, fallback = 0): number {
  const value = Number(world.channels[key]);
  return Number.isFinite(value) ? value : fallback;
}

function push(world: IotWorldState, event: Omit<IotEvent, "t">) {
  world.timeline.push({ t: world.timeline.length, ...event });
}

function deny(world: IotWorldState, commandId: string, reason: string) {
  world.lastDecision = { decision: "deny", commandId, reason };
  push(world, { kind: "deny", text: `拒绝 ${commandId}（${reason}）`, commandId, reason });
  return world.lastDecision;
}

function applyCommand(world: IotWorldState, commandId: string, params?: Record<string, unknown>) {
  if (world.killSwitch) return deny(world, commandId, "KILL_SWITCH");
  const pack = world.packSlug;
  const allowed = PACK_COMMANDS[pack].map(([id]) => id);
  if (!allowed.includes(commandId)) return deny(world, commandId, "COMMAND_DENIED");

  if (pack === "smart-window") {
    if (num(world, "rain") > 0 && (commandId === "open" || commandId === "setPosition")) {
      return deny(world, commandId, "INTERLOCK");
    }
    if (commandId === "open") world.channels.position = 80;
    if (commandId === "close") world.channels.position = 0;
    if (commandId === "stop") {
      /* hold */
    }
    if (commandId === "setPosition") {
      const pct = Number(params?.pct ?? params?.value ?? 40);
      world.channels.position = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 40;
    }
    world.channels.limit_open = world.channels.position >= 95 ? 1 : 0;
    world.channels.limit_close = world.channels.position <= 5 ? 1 : 0;
  }

  if (pack === "agri-irrigation") {
    if (num(world, "rain") > 0 && (commandId === "zoneOn" || commandId === "pumpOn")) {
      return deny(world, commandId, "INTERLOCK");
    }
    if (commandId === "pumpOn" && num(world, "flow") <= 0) {
      world.channels.pump = 0;
      return deny(world, commandId, "DRY_RUN");
    }
    if (commandId === "zoneOn") {
      world.channels.zone = 1;
      world.channels.soil = Math.min(100, num(world, "soil") + 15);
    }
    if (commandId === "zoneOff") world.channels.zone = 0;
    if (commandId === "pumpOn") world.channels.pump = 1;
    if (commandId === "pumpOff") world.channels.pump = 0;
  }

  if (pack === "agri-pond") {
    if (commandId === "sprayOn" && num(world, "level_pct") < 30) {
      return deny(world, commandId, "INTERLOCK");
    }
    if (commandId === "aerateOn") world.channels.aerator = 1;
    if (commandId === "aerateOff") world.channels.aerator = 0;
    if (commandId === "sprayOn") world.channels.spray = 1;
    if (commandId === "sprayOff") world.channels.spray = 0;
  }

  world.lastDecision = { decision: "dispatch", commandId };
  push(world, { kind: "command", text: `执行 ${commandId}`, commandId });
  return world.lastDecision;
}

export function evaluateIotScene(world: IotWorldState, sceneId: string) {
  const pack = world.packSlug;
  const rain = num(world, "rain");
  if (pack === "smart-window") {
    if (sceneId === "win-rain-close" || (sceneId === "pack" && rain > 0)) {
      return applyCommand(world, "close");
    }
    if (sceneId === "win-heat-vent" || (sceneId === "pack" && num(world, "temperature") >= 30 && rain <= 0)) {
      return applyCommand(world, "setPosition", { pct: 20 });
    }
    if (sceneId === "win-manual") {
      return world.lastDecision ?? { decision: "noop" as const };
    }
  }
  if (pack === "agri-irrigation") {
    if (sceneId === "irr-rain-skip" || (sceneId === "pack" && rain > 0)) {
      return deny(world, "zoneOn", "RAIN_SKIP");
    }
    if (sceneId === "irr-dry-run" || (sceneId === "pack" && num(world, "flow") <= 0 && num(world, "pump") > 0)) {
      return applyCommand(world, "pumpOff");
    }
    if (sceneId === "irr-soil" || (sceneId === "pack" && num(world, "soil") < 30 && rain <= 0)) {
      applyCommand(world, "zoneOn");
      return applyCommand(world, "pumpOn");
    }
  }
  if (pack === "agri-pond") {
    if (sceneId === "pond-level" || (sceneId === "pack" && num(world, "level_pct") < 30)) {
      return deny(world, "sprayOn", "INTERLOCK");
    }
    if (sceneId === "pond-aerate" || (sceneId === "pack" && num(world, "do_mgl") < 4.5)) {
      return applyCommand(world, "aerateOn");
    }
    if (sceneId === "pond-spray" || (sceneId === "pack" && num(world, "temp") >= 30 && num(world, "level_pct") >= 30)) {
      return applyCommand(world, "sprayOn");
    }
  }
  world.lastDecision = { decision: "noop" };
  push(world, { kind: "scene", text: `场景 ${sceneId} 无动作` });
  return world.lastDecision;
}

export function evaluateIotAssertions(world: IotWorldState, ids = PACK_ASSERTIONS[world.packSlug]): IotAssertion[] {
  const denied = world.timeline.filter((e) => e.kind === "deny");
  const cmds = world.timeline.filter((e) => e.kind === "command");
  const checks: Record<string, () => IotAssertion> = {
    "rain-close": () => ({
      id: "rain-close",
      ok: num(world, "rain") > 0 && num(world, "position") <= 5,
      detail: `雨量 ${num(world, "rain")} 开度 ${num(world, "position")}`,
    }),
    "rain-deny-open": () => ({
      id: "rain-deny-open",
      ok: denied.some((e) => e.commandId === "open" && e.reason === "INTERLOCK"),
      detail: "下雨时开窗应被互锁拒绝",
    }),
    "heat-vent": () => ({
      id: "heat-vent",
      ok: num(world, "temperature") < 30 || num(world, "position") >= 15,
      detail: `温度 ${num(world, "temperature")} 开度 ${num(world, "position")}`,
    }),
    "soil-irrigate": () => ({
      id: "soil-irrigate",
      ok: num(world, "soil") >= 30 || cmds.some((e) => e.commandId === "zoneOn"),
      detail: `土壤 ${num(world, "soil")}`,
    }),
    "rain-skip": () => ({
      id: "rain-skip",
      ok: num(world, "rain") <= 0 || denied.some((e) => e.reason === "RAIN_SKIP" || e.reason === "INTERLOCK"),
      detail: "下雨时应跳过浇水",
    }),
    "dry-run-stop": () => ({
      id: "dry-run-stop",
      ok: num(world, "flow") > 0 || num(world, "pump") === 0 || cmds.some((e) => e.commandId === "pumpOff"),
      detail: `流量 ${num(world, "flow")} 泵 ${num(world, "pump")}`,
    }),
    "low-do-aerate": () => ({
      id: "low-do-aerate",
      ok: num(world, "do_mgl") >= 4.5 || num(world, "aerator") === 1,
      detail: `溶氧 ${num(world, "do_mgl")}`,
    }),
    "heat-spray": () => ({
      id: "heat-spray",
      ok: num(world, "temp") < 30 || num(world, "spray") === 1 || denied.some((e) => e.commandId === "sprayOn"),
      detail: `水温 ${num(world, "temp")}`,
    }),
    "low-level-deny-spray": () => ({
      id: "low-level-deny-spray",
      ok: num(world, "level_pct") >= 30 || denied.some((e) => e.commandId === "sprayOn" && e.reason === "INTERLOCK"),
      detail: `水位 ${num(world, "level_pct")}`,
    }),
  };
  world.assertions = ids.map((id) => checks[id]?.() ?? { id, ok: false, detail: "unknown" });
  return world.assertions;
}

export function iotApi(world: IotWorldState, guard: () => void, log: (text: string) => void) {
  return {
    readChannel: (key: unknown) => {
      guard();
      const name = String(key || "");
      const value = num(world, name);
      log(`读取 ${name} = ${value}`);
      return value;
    },
    setChannel: (key: unknown, value: unknown) => {
      guard();
      const name = String(key || "");
      const numValue = Number(value);
      if (!Number.isFinite(numValue)) return;
      world.channels[name] = numValue;
      push(world, { kind: "telemetry", text: `注入 ${name}=${numValue}` });
      log(`注入 ${name}=${numValue}`);
    },
    command: (commandId: unknown, params?: Record<string, unknown>) => {
      guard();
      const id = String(commandId || "stop");
      applyCommand(world, id, params);
      log(world.lastDecision?.decision === "deny" ? `拒绝 ${id}` : `命令 ${id}`);
      return world.lastDecision;
    },
    evaluateScene: (sceneId: unknown) => {
      guard();
      const id = String(sceneId || "pack");
      evaluateIotScene(world, id);
      log(`场景 ${id} → ${world.lastDecision?.decision ?? "noop"}`);
      return world.lastDecision;
    },
    wait: (seconds: unknown) => {
      guard();
      log(`等待 ${Number(seconds) || 0} 秒`);
    },
    emergencyStop: () => {
      guard();
      world.killSwitch = true;
      world.channels.pump = 0;
      world.channels.aerator = 0;
      world.channels.spray = 0;
      push(world, { kind: "stop", text: "紧急停止" });
      log("紧急停止");
    },
  };
}

export function starterIotCode(packSlug: IotPackSlug): string {
  if (packSlug === "smart-window") {
    return `iot.setChannel('temperature', 32);
iot.setChannel('rain', 1);
if (iot.readChannel('rain') > 0) {
  iot.command('close');
  iot.command('open');
} else if (iot.readChannel('temperature') >= 30) {
  iot.command('setPosition', { pct: 20 });
}
iot.evaluateScene('win-rain-close');
`;
  }
  if (packSlug === "agri-irrigation") {
    return `iot.setChannel('soil', 18);
iot.setChannel('rain', 0);
iot.setChannel('flow', 1.2);
if (iot.readChannel('rain') > 0) {
  iot.evaluateScene('irr-rain-skip');
} else if (iot.readChannel('soil') < 30) {
  iot.command('zoneOn');
  iot.command('pumpOn');
}
iot.setChannel('flow', 0);
iot.evaluateScene('irr-dry-run');
`;
  }
  return `iot.setChannel('do_mgl', 3.2);
iot.setChannel('temp', 31);
iot.setChannel('level_pct', 80);
if (iot.readChannel('do_mgl') < 4.5) {
  iot.command('aerateOn');
}
if (iot.readChannel('temp') >= 30) {
  iot.command('sprayOn');
}
iot.setChannel('level_pct', 10);
iot.command('sprayOn');
`;
}

export function starterIotXml(packSlug: IotPackSlug): string {
  const channel = packSlug === "agri-pond" ? "do_mgl" : packSlug === "agri-irrigation" ? "soil" : "rain";
  const command = packSlug === "agri-pond" ? "aerateOn" : packSlug === "agri-irrigation" ? "zoneOn" : "close";
  const scene = packSlug === "agri-pond" ? "pond-aerate" : packSlug === "agri-irrigation" ? "irr-soil" : "win-rain-close";
  return `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="iot_set_channel" x="30" y="30">
    <field name="CHANNEL">${channel}</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">${packSlug === "smart-window" ? 1 : 18}</field></block></value>
    <next>
      <block type="controls_if">
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">LT</field>
            <value name="A"><block type="iot_read_channel"><field name="CHANNEL">${channel}</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">${packSlug === "smart-window" ? 1 : 30}</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="iot_command">
            <field name="COMMAND">${command}</field>
            <next>
              <block type="iot_evaluate_scene"><field name="SCENE">${scene}</field></block>
            </next>
          </block>
        </statement>
      </block>
    </next>
  </block>
</xml>`;
}
