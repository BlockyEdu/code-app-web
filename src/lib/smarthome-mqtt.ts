/**
 * Virtual MQTT topic → home.* mapping for smart-home protocol lessons.
 * Browser-only simulation; SyncroBrain owns real brokers (SH-FR).
 */

export type MqttHomeActions = {
  setLight: (room: string, state: "on" | "off") => void;
  setBrightness: (room: string, value: number) => void;
  setTemperature: (celsius: number) => void;
  setDevice: (device: string, state: "on" | "off") => void;
  triggerSensor: (sensor: string, value: number) => void;
  runScene: (scene: string) => void;
};

export type MqttTopicPreset = {
  topic: string;
  labelKey: string;
};

/** Curriculum presets shown in Blockly dropdowns. */
export const MQTT_TOPIC_PRESETS: readonly MqttTopicPreset[] = [
  { topic: "home/living/light", labelKey: "mqtt.topic.livingLight" },
  { topic: "home/bedroom/light", labelKey: "mqtt.topic.bedroomLight" },
  { topic: "home/kitchen/light", labelKey: "mqtt.topic.kitchenLight" },
  { topic: "home/living/brightness", labelKey: "mqtt.topic.livingBrightness" },
  { topic: "home/device/curtain", labelKey: "mqtt.topic.curtain" },
  { topic: "home/device/fan", labelKey: "mqtt.topic.fan" },
  { topic: "home/device/socket", labelKey: "mqtt.topic.socket" },
  { topic: "home/device/alarm", labelKey: "mqtt.topic.alarm" },
  { topic: "home/climate/temperature", labelKey: "mqtt.topic.temperature" },
  { topic: "home/scene", labelKey: "mqtt.topic.scene" },
  { topic: "home/sensor/motion", labelKey: "mqtt.topic.motion" },
  { topic: "home/sensor/temperature", labelKey: "mqtt.topic.sensorTemp" },
] as const;

export type MqttApplyResult =
  | { ok: true; summaryKey: string; vars?: Record<string, string | number> }
  | { ok: false; reason: "unknown_topic" | "bad_payload" };

function asOnOff(payload: string): "on" | "off" | null {
  const v = payload.trim().toLowerCase();
  if (v === "on" || v === "1" || v === "true") return "on";
  if (v === "off" || v === "0" || v === "false") return "off";
  return null;
}

function asNumber(payload: string): number | null {
  const n = Number(payload);
  return Number.isFinite(n) ? n : null;
}

/**
 * Apply a virtual MQTT publish to home.* actions.
 * Returns whether the topic was recognized (unknown topics still log; no throw).
 */
export function applyMqttPublish(
  topic: string,
  payload: string,
  actions: MqttHomeActions,
): MqttApplyResult {
  const path = topic.trim().replace(/^\/+|\/+$/g, "");
  const body = payload.trim();

  const light = /^home\/(living|bedroom|kitchen)\/light$/.exec(path);
  if (light) {
    const state = asOnOff(body);
    if (!state) return { ok: false, reason: "bad_payload" };
    actions.setLight(light[1], state);
    return { ok: true, summaryKey: "runtime.mqttLight", vars: { room: light[1], state } };
  }

  const brightness = /^home\/(living|bedroom|kitchen)\/brightness$/.exec(path);
  if (brightness) {
    const value = asNumber(body);
    if (value == null) return { ok: false, reason: "bad_payload" };
    actions.setBrightness(brightness[1], value);
    return {
      ok: true,
      summaryKey: "runtime.mqttBrightness",
      vars: { room: brightness[1], brightness: Math.round(value) },
    };
  }

  const device = /^home\/device\/(curtain|socket|fan|alarm|ac)$/.exec(path);
  if (device) {
    const state = asOnOff(body);
    if (!state) return { ok: false, reason: "bad_payload" };
    actions.setDevice(device[1], state);
    return { ok: true, summaryKey: "runtime.mqttDevice", vars: { device: device[1], state } };
  }

  if (path === "home/climate/temperature") {
    const value = asNumber(body);
    if (value == null) return { ok: false, reason: "bad_payload" };
    actions.setTemperature(value);
    return { ok: true, summaryKey: "runtime.mqttTemp", vars: { temp: Math.round(value) } };
  }

  if (path === "home/scene") {
    const scene = body || "home";
    if (!["home", "away", "sleep", "movie"].includes(scene)) {
      return { ok: false, reason: "bad_payload" };
    }
    actions.runScene(scene);
    return { ok: true, summaryKey: "runtime.mqttScene", vars: { scene } };
  }

  const sensor = /^home\/sensor\/(temperature|humidity|light|motion|smoke|door)$/.exec(path);
  if (sensor) {
    const value = asNumber(body);
    if (value == null) return { ok: false, reason: "bad_payload" };
    actions.triggerSensor(sensor[1], value);
    return {
      ok: true,
      summaryKey: "runtime.mqttSensor",
      vars: { sensor: sensor[1], value },
    };
  }

  return { ok: false, reason: "unknown_topic" };
}
