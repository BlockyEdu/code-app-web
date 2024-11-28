import { create } from "zustand";
import { httpRequest } from "./http";
import { idpSignOut, isDirectIdpEnabled } from "./idp";
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
  closeLoginPrompt: () => void;
}

/** Module-level so Strict Mode remounts share one /me probe. */
let fetchMeInflight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
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

  openLoginPrompt: () => {
    if (isDirectIdpEnabled()) {
      window.location.href = "/login";
      return;
    }
    set({ loginPromptOpen: true });
  },

  closeLoginPrompt: () => set({ loginPromptOpen: false }),
}));
