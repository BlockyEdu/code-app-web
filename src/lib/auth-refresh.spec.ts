import { describe, expect, it } from "@rstest/core";
import { shouldAttemptRefresh } from "./auth-refresh";

const base = {
  status: 401,
  alreadyRetried: false,
  skipAuthHandlers: false,
  path: "/auth/me",
} as const;

describe("shouldAttemptRefresh", () => {
  it("is true for a first 401 on a normal path", () => {
    expect(shouldAttemptRefresh(base)).toBe(true);
    expect(shouldAttemptRefresh({ ...base, path: "/projects" })).toBe(true);
  });

  it("is false when skipAuthHandlers is set", () => {
    expect(shouldAttemptRefresh({ ...base, skipAuthHandlers: true })).toBe(false);
  });

  it("is false when the request was already retried", () => {
    expect(shouldAttemptRefresh({ ...base, alreadyRetried: true })).toBe(false);
  });

  it("is false when the status is not 401", () => {
    expect(shouldAttemptRefresh({ ...base, status: 200 })).toBe(false);
    expect(shouldAttemptRefresh({ ...base, status: 403 })).toBe(false);
    expect(shouldAttemptRefresh({ ...base, status: 501 })).toBe(false);
  });

  it("is false for /auth/refresh and /auth/login", () => {
    expect(shouldAttemptRefresh({ ...base, path: "/auth/refresh" })).toBe(false);
    expect(shouldAttemptRefresh({ ...base, path: "/auth/login" })).toBe(false);
    expect(shouldAttemptRefresh({ ...base, path: "/auth/login?returnUrl=/" })).toBe(false);
  });
});
