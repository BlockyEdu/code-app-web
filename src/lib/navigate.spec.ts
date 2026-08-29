import { expect, test } from "@rstest/core";
import { isLaunchPath, isWorkspacePath, parseLaunchArtifactId, parseWorkspaceArtifactId } from "./navigate";

test("workspace and launch paths", () => {
  expect(isWorkspacePath("/workspace/abc")).toBe(true);
  expect(isLaunchPath("/launch/abc")).toBe(true);
  expect(parseWorkspaceArtifactId("/workspace/abc")).toBe("abc");
  expect(parseLaunchArtifactId("/launch/abc")).toBe("abc");
  expect(isLaunchPath("/workspace/abc")).toBe(false);
});
