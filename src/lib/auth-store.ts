import { create } from 'zustand';
import { logoutAndRedirect } from './sso';
import { idpSignIn, idpSignOut, isDirectIdpEnabled } from './idp';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

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
  loginPromptOpen: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  fetchMe: () => Promise<void>;
  logout: () => void;
  openLoginPrompt: () => void;
  closeLoginPrompt: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  loginPromptOpen: false,
  login: async (username, password) => {
    set({ loading: true });
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { accessToken: string; user: AuthUser };
      localStorage.setItem('blockyedu_token', data.accessToken);
      set({ user: data.user, loading: false, loginPromptOpen: false });
      return true;
    } catch {
      set({ loading: false });
      return false;
    }
  },
  fetchMe: async () => {
    const token = localStorage.getItem('blockyedu_token');
    if (!token) return;
    set({ loading: true });
    try {
      const res = await fetch(`${BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('unauthorized');
      set({ user: (await res.json()) as AuthUser, loading: false });
    } catch {
      localStorage.removeItem('blockyedu_token');
      set({ user: null, loading: false });
    }
  },
  logout: () => {
    set({ user: null, loginPromptOpen: false });
    if (isDirectIdpEnabled()) {
      idpSignOut().catch(() => {
        window.location.href = window.location.origin;
      });
      return;
    }
    logoutAndRedirect(window.location.origin);
  },
  openLoginPrompt: () => {
    if (isDirectIdpEnabled()) {
      void idpSignIn(`${window.location.origin}/auth/callback`);
      return;
    }
    set({ loginPromptOpen: true });
  },
  closeLoginPrompt: () => set({ loginPromptOpen: false }),
}));
