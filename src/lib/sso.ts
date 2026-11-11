import { clearClientSession } from "./session";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const EDU_LOGIN_URL = import.meta.env.VITE_EDU_LOGIN_URL?.trim() ?? "";

export function authCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export function postAuthLogout(returnUrl?: string): Promise<Response> {
  const qs = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : "";
  return fetch(`${API_BASE}/auth/logout${qs}`, {
    method: "POST",
    credentials: "include",
  });
}

export function isExternalReturnUrl(returnUrl: string): boolean {
  try {
    return new URL(returnUrl).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/** OIDC：经 server 发起，state 内携带 returnUrl */
export function startOidcLogin(returnUrl = authCallbackUrl()): void {
  const params = new URLSearchParams({ returnUrl });
  window.location.href = `${API_BASE}/auth/login?${params}`;
}

/** 未配置 OIDC 时：跳转 edu 统一登录页（code-standalone 下禁用） */
export function startUnifiedLogin(returnUrl = authCallbackUrl()): void {
  if (!EDU_LOGIN_URL) {
    startOidcLogin(returnUrl);
    return;
  }
  const params = new URLSearchParams({ returnUrl });
  window.location.href = `${EDU_LOGIN_URL}?${params}`;
}

export function startSsoLogin(returnUrl = authCallbackUrl()): void {
  fetch(`${API_BASE}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((info: { mode?: string; redirect?: string }) => {
      if (info.mode === "oidc" && info.redirect) {
        window.location.href = info.redirect;
        return;
      }
      startUnifiedLogin(returnUrl);
    })
    .catch(() => startUnifiedLogin(returnUrl));
}

export function logoutAndRedirect(returnUrl?: string): void {
  const target = returnUrl ?? window.location.origin;
  postAuthLogout(target)
    .then((res) => res.json())
    .then((info: { mode?: string; redirect?: string }) => {
      clearClientSession();
      if (info.mode === "oidc" && info.redirect) {
        window.location.href = info.redirect;
        return;
      }
      window.location.href = target;
    })
    .catch(() => {
      clearClientSession();
      window.location.href = target;
    });
}
