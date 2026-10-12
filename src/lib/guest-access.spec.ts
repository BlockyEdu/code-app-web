import { expect, test } from "@rstest/core";
import { shouldForceEntryLogin } from "./guest-access";

test("official site does not force login", () => {
  expect(shouldForceEntryLogin({ requireLogin: false, hasToken: false, path: "/" })).toBe(false);
});

test("private deploy sends anonymous visitors to login", () => {
  expect(shouldForceEntryLogin({ requireLogin: true, hasToken: false, path: "/sample/blog" })).toBe(
    true,
  );
  expect(shouldForceEntryLogin({ requireLogin: true, hasToken: true, path: "/" })).toBe(false);
  expect(shouldForceEntryLogin({ requireLogin: true, hasToken: false, path: "/legal/terms" })).toBe(
    false,
  );
});
