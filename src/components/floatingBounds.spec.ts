import { expect, test } from "@rstest/core";
import {
  clampFloatingRect,
  defaultFloatingRect,
  FLOAT_DEFAULT_HEIGHT,
  FLOAT_DEFAULT_WIDTH,
  FLOAT_MIN_HEIGHT,
  FLOAT_MIN_WIDTH,
} from "./floatingBounds";

test("clamps size to minimums and keeps the panel on screen", () => {
  const next = clampFloatingRect(
    { x: -80, y: -40, width: 100, height: 80 },
    { width: 1280, height: 800 },
  );
  expect(next.width).toBe(FLOAT_MIN_WIDTH);
  expect(next.height).toBe(FLOAT_MIN_HEIGHT);
  expect(next.x).toBe(0);
  expect(next.y).toBe(0);
});

test("never exceeds the viewport so the composer stays visible", () => {
  const next = clampFloatingRect(
    { x: 0, y: 0, width: 900, height: 900 },
    { width: 800, height: 500 },
  );
  expect(next.width).toBe(800);
  expect(next.height).toBe(500);
});

test("default rect sits on the right edge, vertically centered", () => {
  const next = defaultFloatingRect({ width: 1280, height: 800 });
  expect(next.width).toBe(FLOAT_DEFAULT_WIDTH);
  expect(next.height).toBe(FLOAT_DEFAULT_HEIGHT);
  expect(next.x).toBe(1280 - FLOAT_DEFAULT_WIDTH - 24);
  expect(next.y).toBe(Math.round((800 - FLOAT_DEFAULT_HEIGHT) / 2));
});
