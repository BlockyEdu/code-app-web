import { expect, test } from "@rstest/core";
import { runTargetProgram } from "./runtime";
import {
  isSmarthomeLabTemplate,
  SMARTHOME_LAB_TEMPLATES,
  smarthomeLabFiles,
  starterSmarthomeCode,
} from "./smarthome-lab";

test("every lab template seeds floor.json and runnable behavior", () => {
  for (const templateId of SMARTHOME_LAB_TEMPLATES) {
    expect(isSmarthomeLabTemplate(templateId)).toBe(true);
    const files = smarthomeLabFiles(templateId);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("floor.json");
    expect(paths).toContain("behavior.js");
    expect(paths).toContain("blocks/smarthome.blocks.xml");
    const code = starterSmarthomeCode(templateId);
    const result = runTargetProgram({ kind: "smarthome", code });
    expect(result.status).toBe("success");
    expect(result.finalState.home.timeline.length).toBeGreaterThan(0);
  }
});

test("motion case lights the living room via virtual MQTT", () => {
  const result = runTargetProgram({
    kind: "smarthome",
    code: starterSmarthomeCode("人体感应"),
  });
  expect(result.finalState.home.lights.living.on).toBe(true);
  expect(result.finalState.home.sensors.motion).toBe(1);
});

test("movie case dims living light and closes curtain", () => {
  const result = runTargetProgram({
    kind: "smarthome",
    code: starterSmarthomeCode("观影模式"),
  });
  expect(result.finalState.home.lights.living.brightness).toBe(18);
  expect(result.finalState.home.lights.living.on).toBe(true);
  expect(result.finalState.home.lights.bedroom.on).toBe(false);
  expect(result.finalState.home.lights.kitchen.on).toBe(false);
  expect(result.finalState.home.devices.curtain).toBe(false);
  expect(result.finalState.home.devices.fan).toBe(false);
  expect(result.finalState.home.devices.socket).toBe(true);
});
