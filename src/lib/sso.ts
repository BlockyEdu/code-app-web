const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const EDU_LOGIN_URL =
  import.meta.env.VITE_EDU_LOGIN_URL ?? 'http://localhost:18082/login';

export function authCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export function readTokenFromHash(): string | null {
  const raw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(raw).get('access_token');
}

export function clearAuthHash(): void {
  window.history.replaceState(null, '', window.location.pathname);
}

export function redirectWithToken(returnUrl: string, accessToken: string): void {
  const url = new URL(returnUrl);
  url.hash = new URLSearchParams({
    access_token: accessToken,
    token_type: 'Bearer',
  }).toString();
  window.location.href = url.toString();
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

/** 未配置 OIDC 时：跳转 edu 统一登录页 */
export function startUnifiedLogin(returnUrl = authCallbackUrl()): void {
  const params = new URLSearchParams({ returnUrl });
  window.location.href = `${EDU_LOGIN_URL}?${params}`;
}

export function startSsoLogin(returnUrl = authCallbackUrl()): void {
  fetch(`${API_BASE}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    .then((res) => res.json())
    .then((info: { mode?: string; redirect?: string }) => {
      if (info.mode === 'oidc' && info.redirect) {
        window.location.href = info.redirect;
        return;
      }
      startUnifiedLogin(returnUrl);
    })
    .catch(() => startUnifiedLogin(returnUrl));
}

export function logoutAndRedirect(returnUrl?: string): void {
  const target = returnUrl ?? window.location.origin;
  localStorage.removeItem('blockyedu_token');
  fetch(`${API_BASE}/auth/logout?returnUrl=${encodeURIComponent(target)}`)
    .then((res) => res.json())
    .then((info: { mode?: string; redirect?: string }) => {
      if (info.mode === 'oidc' && info.redirect) {
        window.location.href = info.redirect;
        return;
      }
      window.location.href = target;
    })
    .catch(() => {
      window.location.href = target;
    });
}
