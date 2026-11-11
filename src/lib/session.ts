/**
 * code-server session is the host-only HttpOnly cookie `be_code_session`.
 * JavaScript cannot read it. The browser sends it on credentialed requests.
 *
 * `blockyedu_sess` is a non-secret `1` / `0` flag for this origin. It is not a
 * JWT and not a credential. The entry wall uses it only to tell logged-in
 * from logged-out without reading the session cookie.
 *
 * An in-memory access token may exist for this document when an OIDC library
 * just handed one over. It is cleared on logout and is never copied into
 * localStorage or document.cookie.
 */

export const SESSION_FLAG_KEY = "blockyedu_sess";

const DURABLE_TOKEN_KEYS = ["blockyedu_token", "blockyedu_id_token", "luminary_access_token"];

let memoryAccessToken: string | null = null;

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function scrubDurableAccessTokens(extraKeys: Array<string | undefined> = []): void {
  const store = storage();
  if (!store) return;
  const extras = extraKeys.filter((key): key is string => Boolean(key) && key !== SESSION_FLAG_KEY);
  try {
    for (const key of [...DURABLE_TOKEN_KEYS, ...extras]) store.removeItem(key);
    const doomed: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key?.startsWith("oidc.user:")) doomed.push(key);
    }
    for (const key of doomed) store.removeItem(key);
  } catch {
    /* private mode */
  }
}

export function markSessionActive(): void {
  scrubDurableAccessTokens();
  try {
    storage()?.setItem(SESSION_FLAG_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function clearClientSession(): void {
  memoryAccessToken = null;
  scrubDurableAccessTokens();
  try {
    storage()?.setItem(SESSION_FLAG_KEY, "0");
  } catch {
    /* private mode */
  }
}

/** Non-secret hint. Not a credential. */
export function isSessionActive(): boolean {
  try {
    return storage()?.getItem(SESSION_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function hasSessionHint(): boolean {
  return isSessionActive();
}

export function getAccessToken(): string | null {
  scrubDurableAccessTokens();
  if (storage()?.getItem(SESSION_FLAG_KEY) === "0") {
    memoryAccessToken = null;
    return null;
  }
  return memoryAccessToken;
}

/** Keep a library-provided token for this page only. Does not persist it. */
export function rememberPageToken(token: string | null | undefined, extraKey?: string): void {
  if (!token) {
    markSessionActive();
    return;
  }
  memoryAccessToken = token;
  scrubDurableAccessTokens(extraKey ? [extraKey] : []);
  try {
    storage()?.setItem(SESSION_FLAG_KEY, "1");
  } catch {
    /* private mode */
  }
}

scrubDurableAccessTokens();
