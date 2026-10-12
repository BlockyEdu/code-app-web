import { expect, test } from "@rstest/core";
import {
  featuredOfficialSamples,
  filterOfficialSamples,
  findOfficialSample,
  OFFICIAL_SAMPLES,
  officialSamplesByTrack,
  sampleChipSelected,
} from "./official-samples";

test("official samples keep identity and catalog fields", () => {
  expect(findOfficialSample("blog")?.templateId).toBe("博客");
  expect(findOfficialSample("missing")).toBeNull();
  expect(featuredOfficialSamples()).toHaveLength(5);
  expect(new Set(OFFICIAL_SAMPLES.map((sample) => sample.palette.to)).size).toBe(
    OFFICIAL_SAMPLES.length,
  );
  expect(
    filterOfficialSamples("apps").every(
      (sample) => sample.category === "web" || sample.category === "miniprogram",
    ),
  ).toBe(true);
  expect(filterOfficialSamples("devices").some((sample) => sample.category === "smarthome")).toBe(
    true,
  );
  expect(sampleChipSelected("web", "apps")).toBe(true);
  expect(sampleChipSelected("iot", "apps")).toBe(false);
  expect(sampleChipSelected("all", null)).toBe(true);
  for (const chip of ["web", "miniprogram", "smarthome", "iot", "basics"] as const) {
    expect(filterOfficialSamples(chip).length).toBeGreaterThan(0);
  }
  expect(findOfficialSample("room-node")?.category).toBe("iot");
  expect(findOfficialSample("living-room")?.kind).toBe("smarthome");
  expect(findOfficialSample("desk-pet")?.kind).toBe("toy");
  const flagship = findOfficialSample("smart-window");
  expect(flagship?.templateId).toBe("智慧窗控");
  expect(flagship?.kind).toBe("iot");
  expect(flagship?.track).toBe("iot");
  expect(flagship?.featured).toBe(true);
});

test("every sample belongs to one home track", () => {
  const tracks = ["iot", "apps", "basics"] as const;
  const seen = tracks.flatMap((track) => officialSamplesByTrack(track).map((s) => s.slug));
  expect(seen.sort()).toEqual(OFFICIAL_SAMPLES.map((s) => s.slug).sort());
  expect(officialSamplesByTrack("iot")[0]?.slug).toBe("smart-window");
  expect(officialSamplesByTrack("basics").map((s) => s.slug)).toEqual([
    "hello-world",
    "sort-numbers",
    "pair-exercise",
  ]);
  expect(findOfficialSample("irrigation")?.templateId).toBe("智慧灌溉");
  expect(findOfficialSample("pond")?.templateId).toBe("鱼塘增氧");
  expect(findOfficialSample("event-signup")?.kind).toBe("miniprogram");
  expect(findOfficialSample("shop-mini")?.kind).toBe("miniprogram");
  expect(
    officialSamplesByTrack("apps").every((s) => s.kind === "web" || s.kind === "miniprogram"),
  ).toBe(true);
});
