import { expect, test } from "@rstest/core";
import { nextPhaseAfterAction } from "./pair-mission";

test("hint stays in hint_loop", () => {
  expect(nextPhaseAfterAction("hint", "mission")).toBe("hint_loop");
});

test("implement requires review", () => {
  expect(nextPhaseAfterAction("implement", "hint_loop")).toBe("implement_review");
});

test("review after test completes the mission", () => {
  expect(nextPhaseAfterAction("review", "test")).toBe("complete");
});

test("explain does not skip gates", () => {
  expect(nextPhaseAfterAction("explain", "mission")).toBe("mission");
});
