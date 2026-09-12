import { describe, expect, it } from "@rstest/core";
import { checkLessonStep } from "./index";

describe("checkLessonStep", () => {
  it("treats __SKIP__ as passed", () => {
    expect(checkLessonStep([], "__SKIP__")).toBe(true);
    expect(checkLessonStep(["unrelated"], "__SKIP__")).toBe(true);
  });

  it("returns true when a console line includes the check value", () => {
    expect(checkLessonStep(["hello world", "ok"], "hello")).toBe(true);
  });

  it("returns false when no line matches", () => {
    expect(checkLessonStep(["foo", "bar"], "baz")).toBe(false);
    expect(checkLessonStep([], "hello")).toBe(false);
  });
});
