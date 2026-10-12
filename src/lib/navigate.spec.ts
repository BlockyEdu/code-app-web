import { expect, test } from "@rstest/core";
import {
  isAboutPath,
  isLaunchPath,
  isProjectsPath,
  isSamplePath,
  isSamplesListPath,
  isWorkspacePath,
  parseLaunchArtifactId,
  parseSampleSlug,
  parseSamplesCategory,
  parseWorkspaceArtifactId,
  projectsPath,
  samplesPath,
} from "./navigate";

test("workspace and launch paths", () => {
  expect(isWorkspacePath("/workspace/abc")).toBe(true);
  expect(isLaunchPath("/launch/abc")).toBe(true);
  expect(parseWorkspaceArtifactId("/workspace/abc")).toBe("abc");
  expect(parseLaunchArtifactId("/launch/abc")).toBe("abc");
  expect(isLaunchPath("/workspace/abc")).toBe(false);
  expect(parseSampleSlug("/sample/blog")).toBe("blog");
  expect(isSamplePath("/sample/blog")).toBe(true);
  expect(isSamplePath("/workspace/abc")).toBe(false);
  expect(isSamplePath("/samples")).toBe(false);
});

test("samples and projects paths", () => {
  expect(samplesPath()).toBe("/samples");
  expect(samplesPath("all")).toBe("/samples");
  expect(samplesPath("web")).toBe("/samples?category=web");
  expect(samplesPath("apps")).toBe("/samples?category=apps");
  expect(projectsPath()).toBe("/projects");
  expect(parseSamplesCategory("")).toBeNull();
  expect(parseSamplesCategory("?category=all")).toBeNull();
  expect(parseSamplesCategory("?category=iot")).toBe("iot");
  expect(isSamplesListPath("/samples")).toBe(true);
  expect(isSamplesListPath("/sample/blog")).toBe(false);
  expect(isProjectsPath("/projects")).toBe(true);
  expect(isProjectsPath("/projects/abc")).toBe(false);
});

test("about path", () => {
  expect(isAboutPath("/about")).toBe(true);
  expect(isAboutPath("/about/")).toBe(true);
  expect(isAboutPath("/about/team")).toBe(false);
  expect(isAboutPath("/")).toBe(false);
});
