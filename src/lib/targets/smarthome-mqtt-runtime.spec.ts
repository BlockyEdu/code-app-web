import { expect, test } from "@rstest/core";
import { runTargetProgram } from "./runtime";

test("virtual mqtt subscribe then publish lights the living room", () => {
  const result = runTargetProgram({
    kind: "smarthome",
    code: `
mqtt.subscribe('home/sensor/motion', function(payload) {
  if (Number(payload) > 0) {
    mqtt.publish('home/living/light', 'on');
  }
});
mqtt.publish('home/sensor/motion', '1');
`,
  });
  expect(result.status).toBe("success");
  expect(result.finalState.home.lights.living.on).toBe(true);
  expect(result.finalState.home.sensors.motion).toBe(1);
  expect(result.finalState.home.timeline.some((line) => line.includes("[mqtt]"))).toBe(true);
});

test("each preset scene changes a different part of the home", () => {
  const home = runTargetProgram({ kind: "smarthome", code: `home.runScene('home');` }).finalState
    .home;
  expect(home.scene).toBe("home");
  expect(home.lights.living.on).toBe(true);
  expect(home.devices.curtain).toBe(true);
  expect(home.devices.alarm).toBe(false);

  const away = runTargetProgram({ kind: "smarthome", code: `home.runScene('away');` }).finalState
    .home;
  expect(away.scene).toBe("away");
  expect(away.lights.living.on).toBe(false);
  expect(away.devices.alarm).toBe(true);
  expect(away.devices.curtain).toBe(false);

  const sleep = runTargetProgram({ kind: "smarthome", code: `home.runScene('sleep');` }).finalState
    .home;
  expect(sleep.scene).toBe("sleep");
  expect(sleep.lights.bedroom).toEqual({ on: true, brightness: 15 });
  expect(sleep.lights.living.on).toBe(false);
  expect(sleep.devices.alarm).toBe(false);

  const movie = runTargetProgram({ kind: "smarthome", code: `home.runScene('movie');` }).finalState
    .home;
  expect(movie.scene).toBe("movie");
  expect(movie.lights.living).toEqual({ on: true, brightness: 18 });
  expect(movie.lights.bedroom.on).toBe(false);
  expect(movie.devices.curtain).toBe(false);
  expect(movie.devices.socket).toBe(true);
});

test("mqtt scene publish applies home scene", () => {
  const result = runTargetProgram({
    kind: "smarthome",
    code: `mqtt.publish('home/scene', 'away');`,
  });
  expect(result.status).toBe("success");
  expect(result.finalState.home.devices.alarm).toBe(true);
  expect(result.finalState.home.lights.living.on).toBe(false);
});
