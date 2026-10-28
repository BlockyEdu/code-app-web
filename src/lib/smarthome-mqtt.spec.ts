import { expect, test } from "@rstest/core";
import { applyMqttPublish, type MqttHomeActions } from "./smarthome-mqtt";

function captureActions() {
  const calls: string[] = [];
  const actions: MqttHomeActions = {
    setLight: (room, state) => calls.push(`light:${room}:${state}`),
    setBrightness: (room, value) => calls.push(`brightness:${room}:${value}`),
    setTemperature: (value) => calls.push(`temp:${value}`),
    setDevice: (device, state) => calls.push(`device:${device}:${state}`),
    triggerSensor: (sensor, value) => calls.push(`sensor:${sensor}:${value}`),
    runScene: (scene) => calls.push(`scene:${scene}`),
  };
  return { calls, actions };
}

test("maps living light topic", () => {
  const { calls, actions } = captureActions();
  const result = applyMqttPublish("home/living/light", "on", actions);
  expect(result.ok).toBe(true);
  expect(calls).toEqual(["light:living:on"]);
});

test("maps motion sensor publish", () => {
  const { calls, actions } = captureActions();
  const result = applyMqttPublish("home/sensor/motion", "1", actions);
  expect(result.ok).toBe(true);
  expect(calls).toEqual(["sensor:motion:1"]);
});

test("rejects unknown topics", () => {
  const { calls, actions } = captureActions();
  const result = applyMqttPublish("home/unknown", "1", actions);
  expect(result).toEqual({ ok: false, reason: "unknown_topic" });
  expect(calls).toEqual([]);
});

test("rejects bad payloads", () => {
  const { calls, actions } = captureActions();
  const result = applyMqttPublish("home/living/light", "maybe", actions);
  expect(result).toEqual({ ok: false, reason: "bad_payload" });
  expect(calls).toEqual([]);
});
