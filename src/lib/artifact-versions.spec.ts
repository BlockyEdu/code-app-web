import { describe, expect, it } from "@rstest/core";
import {
  ARTIFACT_VERSION_STRIP_LIMIT,
  formatVersionTime,
  takeRecentArtifactVersions,
  versionHasFiles,
} from "./artifact-versions";

describe("takeRecentArtifactVersions", () => {
  it("takes the first 8 items", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(takeRecentArtifactVersions(items)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(takeRecentArtifactVersions(items)).toHaveLength(ARTIFACT_VERSION_STRIP_LIMIT);
    expect(items).toHaveLength(10);
  });

  it("returns all items when there are 8 or fewer", () => {
    expect(takeRecentArtifactVersions([1, 2, 3])).toEqual([1, 2, 3]);
    expect(takeRecentArtifactVersions([])).toEqual([]);
    expect(takeRecentArtifactVersions(null)).toEqual([]);
    expect(takeRecentArtifactVersions(undefined)).toEqual([]);
  });
});

describe("versionHasFiles", () => {
  it("is true when files is a non-empty array", () => {
    expect(versionHasFiles({ files: [{ path: "app.js" }] })).toBe(true);
  });

  it("is false when files is missing or empty", () => {
    expect(versionHasFiles(undefined)).toBe(false);
    expect(versionHasFiles(null)).toBe(false);
    expect(versionHasFiles({})).toBe(false);
    expect(versionHasFiles({ files: [] })).toBe(false);
    expect(versionHasFiles({ files: null })).toBe(false);
  });
});

describe("formatVersionTime", () => {
  const now = Date.parse("2026-09-10T16:00:00.000Z");

  it("uses relative time for recent timestamps", () => {
    expect(formatVersionTime("2026-09-10T15:00:00.000Z", "en", now)).toMatch(/hour/);
  });

  it("falls back to ISO when older than a week, or the raw string when invalid", () => {
    expect(formatVersionTime("2020-01-01T00:00:00.000Z", "en", now)).toBe(
      "2020-01-01T00:00:00.000Z",
    );
    expect(formatVersionTime("not-a-date")).toBe("not-a-date");
  });
});
