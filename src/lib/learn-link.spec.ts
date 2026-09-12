import { describe, expect, it } from "@rstest/core";
import { formatSubmittedVersion, mergeLearnLink, shouldShowLessonSubmit } from "./learn-link";

describe("shouldShowLessonSubmit", () => {
  it("hides when there is no artifact", () => {
    expect(shouldShowLessonSubmit({ artifactId: null, submissionState: "draft" })).toBe(false);
    expect(shouldShowLessonSubmit({ artifactId: "", submissionState: "draft" })).toBe(false);
  });

  it("hides when already submitted", () => {
    expect(shouldShowLessonSubmit({ artifactId: "a1", submissionState: "submitted" })).toBe(false);
  });

  it("shows for draft, returned, none, and missing state", () => {
    expect(shouldShowLessonSubmit({ artifactId: "a1", submissionState: "draft" })).toBe(true);
    expect(shouldShowLessonSubmit({ artifactId: "a1", submissionState: "returned" })).toBe(true);
    expect(shouldShowLessonSubmit({ artifactId: "a1", submissionState: "none" })).toBe(true);
    expect(shouldShowLessonSubmit({ artifactId: "a1" })).toBe(true);
  });
});

describe("mergeLearnLink", () => {
  it("keeps assignmentId when picker only sends workspaceLessonId", () => {
    expect(
      mergeLearnLink(
        { assignmentId: "asg-1", courseId: "c1", submissionState: "none" },
        { workspaceLessonId: "hello-world", submissionState: "draft" },
      ),
    ).toEqual({
      assignmentId: "asg-1",
      courseId: "c1",
      workspaceLessonId: "hello-world",
      submissionState: "draft",
    });
  });
});

describe("formatSubmittedVersion", () => {
  it("returns empty suffix without an id", () => {
    expect(formatSubmittedVersion(undefined)).toBe("");
    expect(formatSubmittedVersion("  ")).toBe("");
  });

  it("wraps a version id for display", () => {
    expect(formatSubmittedVersion("ver-1")).toBe(" (ver-1)");
  });
});
