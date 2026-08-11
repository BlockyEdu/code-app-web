/**
 * Shared fetch helper with in-flight coalescing.
 * React 19 Strict Mode remounts effects in DEV; without coalescing every
 * useEffect(fetch) appears as duplicate network traffic.
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class UnauthorizedError extends Error {
  readonly status = 401;

  constructor(message = "请先登录") {
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
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function coalesceKey(path: string, init?: HttpRequestInit): string | null {
  const opt = init?.coalesce;
  if (opt === false) return null;
  if (typeof opt === "string") return opt;
  const method = (init?.method ?? "GET").toUpperCase();
  if (opt !== true && method !== "GET") return null;
  const body = typeof init?.body === "string" ? init.body : "";
  return `${method} ${API_BASE}${path} ${body}`;
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return res.statusText;
  }
}

async function execute<T>(path: string, init?: HttpRequestInit): Promise<T> {
  const { coalesce: _coalesce, skipAuthHandlers, ...fetchInit } = init ?? {};
  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchInit,
    headers: authHeaders(fetchInit.headers),
  });

  if (res.status === 401) {
    if (!skipAuthHandlers) onUnauthorized?.();
    throw new UnauthorizedError("请先登录后再使用云端功能");
  }

  if (res.status === 402) {
    let payload: { error?: { code?: string; message?: string; featureCode?: string } } = {};
    try {
      payload = JSON.parse(await res.text()) as typeof payload;
    } catch {
      /* ignore */
    }
    const err = new EntitlementRequiredError(
      payload.error?.message || "需要 Pro / Ultra / 企业订阅",
      { code: payload.error?.code, featureCode: payload.error?.featureCode },
    );
    if (!skipAuthHandlers) onEntitlementRequired?.(err);
    throw err;
  }

  if (!res.ok) {
    throw new Error((await parseErrorBody(res)) || res.statusText);
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
    return;
  }
  for (const key of inflight.keys()) {
    if (key.includes(keyPrefix)) inflight.delete(key);
  }
}
