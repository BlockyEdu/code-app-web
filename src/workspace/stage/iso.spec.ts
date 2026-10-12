import { expect, test } from "@rstest/core";
import {
  floorFrontLeft,
  isoBoxFaces,
  paddedViewBox,
  pointsClear,
  projectIso,
  roundedFacePath,
  shadeHex,
} from "./iso";

test("projects the origin to the origin", () => {
  expect(projectIso(0, 0, 0)).toEqual({ x: 0, y: 0 });
});

test("sends +x right and +y left", () => {
  const east = projectIso(1, 0, 0);
  const north = projectIso(0, 1, 0);
  expect(east.x).toBeGreaterThan(0);
  expect(north.x).toBeLessThan(0);
  expect(projectIso(1, 1, 0).x).toBeCloseTo(0, 5);
});

test("lifts +z toward the top of the screen", () => {
  expect(projectIso(0, 0, 4).y).toBeLessThan(projectIso(0, 0, 0).y);
});

test("builds three quad faces for a box", () => {
  const faces = isoBoxFaces({ x: 0, y: 0, z: 0 }, { x: 10, y: 8, z: 4 });
  expect(faces.top).toHaveLength(4);
  expect(faces.left).toHaveLength(4);
  expect(faces.right).toHaveLength(4);
  const topY = Math.min(...faces.top.map((point) => point.y));
  const baseY = Math.min(...faces.left.map((point) => point.y));
  expect(topY).toBeLessThan(baseY);
});

test("keeps smart-home room badges apart", () => {
  const anchors = [
    floorFrontLeft(-108, -8, 68, 6),
    floorFrontLeft(-16, -58, 52, 6),
    floorFrontLeft(16, 10, 56, 6),
  ];
  expect(pointsClear(anchors, 50)).toBe(true);
});

test("pads a view box by about eight percent", () => {
  expect(paddedViewBox(0, 10, 100, 50, 0.08)).toBe("-8 6 116 58");
});

test("rounds a face into a closed path", () => {
  const path = roundedFacePath(
    [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 20 },
      { x: 0, y: 20 },
    ],
    4,
  );
  expect(path.startsWith("M ")).toBe(true);
  expect(path.endsWith("Z")).toBe(true);
  expect(path.includes("Q ")).toBe(true);
});

test("shades a hex color toward black", () => {
  expect(shadeHex("#ffffff", 0.5)).toBe("#808080");
  expect(shadeHex("#fff", 1)).toBe("#ffffff");
});
