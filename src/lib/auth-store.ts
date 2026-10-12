import { create } from "zustand";
import { httpRequest } from "./http";
import { idpSignOut, isDirectIdpEnabled, PRODUCT_LOGIN_POPUP, rememberPostLoginPath } from "./idp";
import { navigate } from "./navigate";
import { logoutAndRedirect } from "./sso";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  roles: string[];
  permissions: string[];
  status: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** True after the first auth probe finishes (token missing or /me settled). */
  initialized: boolean;
  loginPromptOpen: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  fetchMe: () => Promise<void>;
  logout: () => void;
  openLoginPrompt: () => void;
  /** Opens the product login page. Resolves true when a session is ready. */
  ensureSignedIn: () => Promise<boolean>;
  closeLoginPrompt: () => void;
}

/** Module-level so Strict Mode remounts share one /me probe. */
let fetchMeInflight: Promise<void> | null = null;

function safeReturnPath(): string {
  const path = `${window.location.pathname}${window.location.search}`;
  if (path.startsWith("/login") || path.startsWith("/auth")) return "/";
  return path || "/";
}

function loginHref(returnPath: string): string {
  return `/login?redirect=${encodeURIComponent(returnPath)}`;
}

/** Same-tab product login page. Shared with the education site; not the IdP hosted UI. */
function goToLoginPage(): void {
  const next = safeReturnPath();
  rememberPostLoginPath(next);
  if (window.location.pathname === "/login") return;
  navigate(loginHref(next));
}

function openLoginPopup(fetchMe: () => Promise<void>, hasUser: () => boolean): Promise<boolean> {
  const next = safeReturnPath();
  rememberPostLoginPath(next);
  const popup = window.open(loginHref(next), PRODUCT_LOGIN_POPUP, "popup,width=520,height=760");
  if (!popup) {
    goToLoginPage();
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearInterval(timer);
      resolve(ok);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string } | null;
      if (data?.type !== "blockyedu:signed-in") return;
      void fetchMe().finally(() => finish(hasUser()));
    };
    window.addEventListener("message", onMessage);
    const timer = window.setInterval(() => {
      if (!popup.closed) return;
      void fetchMe().finally(() => finish(hasUser()));
    }, 400);
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  loginPromptOpen: false,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const data = await httpRequest<{ accessToken: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        coalesce: false,
        skipAuthHandlers: true,
      });
      localStorage.setItem("blockyedu_token", data.accessToken);
      set({ user: data.user, loading: false, initialized: true, loginPromptOpen: false });
      return true;
    } catch {
      set({ loading: false, initialized: true });
      return false;
    }
  },

  fetchMe: async () => {
    if (fetchMeInflight) return fetchMeInflight;

    fetchMeInflight = (async () => {
      const token = localStorage.getItem("blockyedu_token");
      if (!token) {
        set({ user: null, loading: false, initialized: true });
        return;
      }
      set({ loading: true });
      try {
        // 401 is refreshed once inside httpRequest; OIDC 501 is not treated as success.
        const user = await httpRequest<AuthUser>("/auth/me");
        set({ user, loading: false, initialized: true });
      } catch {
        localStorage.removeItem("blockyedu_token");
        set({ user: null, loading: false, initialized: true });
      }
    })().finally(() => {
      fetchMeInflight = null;
    });

    return fetchMeInflight;
  },

  logout: () => {
    const loginUrl = `${window.location.origin}/login`;
    set({ user: null, loginPromptOpen: false, initialized: true });
    localStorage.removeItem("blockyedu_token");
    if (isDirectIdpEnabled()) {
      idpSignOut().catch(() => {
        window.location.href = loginUrl;
      });
      return;
    }
    logoutAndRedirect(loginUrl);
  },

  ensureSignedIn: async () => {
    if (get().user) return true;
    if (!isDirectIdpEnabled()) {
      goToLoginPage();
      return false;
    }
    return openLoginPopup(
      () => get().fetchMe(),
      () => Boolean(get().user),
    );
  },

  openLoginPrompt: () => {
    goToLoginPage();
  },

  closeLoginPrompt: () => set({ loginPromptOpen: false }),
}));
