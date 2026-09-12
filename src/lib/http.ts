/**
 * Shared fetch helper with in-flight coalescing.
 * React 19 Strict Mode remounts effects in DEV; without coalescing every
 * useEffect(fetch) appears as duplicate network traffic.
 */

import { shouldAttemptRefresh } from "./auth-refresh";
import { getLocale, t } from "./i18n";

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class UnauthorizedError extends Error {
  readonly status = 401;

  constructor(message = t("auth.needSignIn")) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class EntitlementRequiredError extends Error {
  readonly status = 402;
  readonly code?: string;
  readonly featureCode?: string;

  constructor(message: string, opts?: { code?: string; featureCode?: string }) {
    super(message);
    this.name = "EntitlementRequiredError";
    this.code = opts?.code;
    this.featureCode = opts?.featureCode;
  }
}

type UnauthorizedHandler = () => void;
type EntitlementHandler = (err: EntitlementRequiredError) => void;

let onUnauthorized: UnauthorizedHandler | null = null;
let onEntitlementRequired: EntitlementHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler;
}

export function setEntitlementRequiredHandler(handler: EntitlementHandler) {
  onEntitlementRequired = handler;
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const storage = typeof globalThis !== "undefined" ? globalThis.localStorage : undefined;
  const token = storage?.getItem("blockyedu_token") ?? null;
  const locale = getLocale();
  return {
    "Content-Type": "application/json",
    "Accept-Language": locale === "en" ? "en-US" : "zh-CN",
    ...(token ? { Authorization: `Bearer ${token}`, "x-oidc-access-token": token } : {}),
    ...extra,
  };
}

const inflight = new Map<string, Promise<unknown>>();

export type HttpRequestInit = RequestInit & {
  /**
   * Share one promise across concurrent identical calls.
   * - omitted: coalesce GET by default
   * - true: coalesce this call (any method) by method+url+body
   * - string: coalesce under an explicit key
   * - false: never coalesce
   */
  coalesce?: boolean | string;
  /** Skip 401/402 global handlers (e.g. password login probe). */
  skipAuthHandlers?: boolean;
};

type HttpRequestInternal = HttpRequestInit & {
  /** Internal: original request already retried after a refresh. */
  alreadyRetried?: boolean;
};

let refreshInflight: Promise<boolean> | null = null;

async function persistAccessToken(accessToken: string) {
  const storage = typeof globalThis !== "undefined" ? globalThis.localStorage : undefined;
  storage?.setItem("blockyedu_token", accessToken);
}

/** One coalesced POST /auth/refresh. 501/401/network → false (not success). */
async function refreshAccessToken(): Promise<boolean> {
  if (refreshInflight) return refreshInflight;

  refreshInflight = (async () => {
    try {
      const data = await httpRequest<{ accessToken?: unknown }>("/auth/refresh", {
        method: "POST",
        skipAuthHandlers: true,
        coalesce: false,
      });
      if (typeof data.accessToken !== "string" || !data.accessToken) return false;
      persistAccessToken(data.accessToken);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshInflight = null;
  });

  return refreshInflight;
}

function coalesceKey(path: string, init?: HttpRequestInit): string | null {
  const opt = init?.coalesce;
  if (opt === false) return null;
  if (typeof opt === "string") return opt;
  const method = (init?.method ?? "GET").toUpperCase();
  if (opt !== true && method !== "GET") return null;
  const body = typeof init?.body === "string" ? init.body : "";
  return `${method} ${API_BASE}${path} ${body}`;
}

type ErrorBody = { message?: unknown; error?: unknown; code?: unknown };

function readErrorCode(json: ErrorBody): string | undefined {
  if (typeof json.code === "string" && json.code.trim()) return json.code.trim();
  if (json.error && typeof json.error === "object") {
    const nested = (json.error as { code?: unknown }).code;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  if (json.message && typeof json.message === "object") {
    const nested = (json.message as { code?: unknown }).code;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return undefined;
}

function readErrorMessage(json: ErrorBody, fallback: string): string {
  if (typeof json.message === "string" && json.message.trim()) return json.message;
  if (json.message && typeof json.message === "object") {
    const nested = (json.message as { message?: unknown }).message;
    if (typeof nested === "string" && nested.trim()) return nested;
  }
  if (typeof json.error === "string" && json.error.trim() && json.error !== "Service Unavailable") {
    return json.error;
  }
  if (json.error && typeof json.error === "object") {
    const nested = (json.error as { message?: unknown }).message;
    if (typeof nested === "string" && nested.trim()) return nested;
  }
  return fallback;
}

async function parseErrorBody(res: Response): Promise<{ message: string; code?: string }> {
  let raw = "";
  try {
    raw = await res.text();
  } catch {
    return { message: res.statusText };
  }
  try {
    const json = JSON.parse(raw) as ErrorBody;
    return {
      message: readErrorMessage(json, raw.trim() || res.statusText),
      code: readErrorCode(json),
    };
  } catch {
    /* not JSON */
  }
  return { message: raw.trim() || res.statusText };
}

/** WEB-ERR-* / PREVIEW-ERR-* / CP-ERR-* (and other API codes) from a thrown request error. */
export function errorCodeOf(err: unknown): string | undefined {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  ) {
    const code = (err as { code: string }).code.trim();
    if (code) return code;
  }
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return msg.match(/\b((?:WEB|PREVIEW|SMARTHOME|CP)-ERR-[A-Z0-9-]+)\b/)?.[1];
}

async function execute<T>(path: string, init?: HttpRequestInternal): Promise<T> {
  const { coalesce: _coalesce, skipAuthHandlers, alreadyRetried, ...fetchInit } = init ?? {};
  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchInit,
    headers: authHeaders(fetchInit.headers),
  });

  if (res.status === 401) {
    if (
      shouldAttemptRefresh({
        status: res.status,
        alreadyRetried,
        skipAuthHandlers,
        path,
      })
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return execute<T>(path, { ...init, alreadyRetried: true });
      }
    }
    if (!skipAuthHandlers) onUnauthorized?.();
    throw new UnauthorizedError(t("auth.needSignInCloud"));
  }

  if (res.status === 402) {
    let payload: { error?: { code?: string; message?: string; featureCode?: string } } = {};
    try {
      payload = JSON.parse(await res.text()) as typeof payload;
    } catch {
      /* ignore */
    }
    const err = new EntitlementRequiredError(payload.error?.message || t("membership.needPaid"), {
      code: payload.error?.code,
      featureCode: payload.error?.featureCode,
    });
    if (!skipAuthHandlers) onEntitlementRequired?.(err);
    throw err;
  }

  if (!res.ok) {
    const parsed = await parseErrorBody(res);
    const err = new Error(parsed.message || res.statusText);
    if (parsed.code) Object.assign(err, { code: parsed.code });
    throw err;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/** JSON API request against `API_BASE`. */
export function httpRequest<T>(path: string, init?: HttpRequestInit): Promise<T> {
  const key = coalesceKey(path, init);
  if (!key) {
    return execute<T>(path, init);
  }

  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const pending = execute<T>(path, init).finally(() => {
    if (inflight.get(key) === pending) {
      inflight.delete(key);
    }
  });
  inflight.set(key, pending);
  return pending;
}

/** Test helper / rare forced refresh: drop coalesced entry. */
export function clearHttpInflight(keyPrefix?: string) {
  if (!keyPrefix) {
    inflight.clear();
    refreshInflight = null;
    return;
  }
  for (const key of inflight.keys()) {
    if (key.includes(keyPrefix)) inflight.delete(key);
  }
}
