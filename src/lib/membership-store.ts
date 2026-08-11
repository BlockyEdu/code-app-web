import { create } from "zustand";
import { api } from "./api";
import { FEATURE, type MembershipResponse, type PlanCode } from "./membership-types";

interface MembershipState {
  loaded: boolean;
  membership: MembershipResponse | null;
  fetchMembership: () => Promise<void>;
  ensureTrialOnEntry: () => Promise<void>;
  clear: () => void;
  effectivePlan: () => PlanCode;
  trialEndsAt: () => string | null;
  trialActive: () => boolean;
  canExecutePro: () => boolean;
}

let fetchMembershipInflight: Promise<void> | null = null;
let ensureTrialInflight: Promise<void> | null = null;

export const useMembershipStore = create<MembershipState>((set, get) => ({
  loaded: false,
  membership: null,

  async fetchMembership() {
    if (fetchMembershipInflight) return fetchMembershipInflight;
    fetchMembershipInflight = (async () => {
      try {
        const membership = await api.getMembership();
        set({ membership, loaded: true });
      } catch {
        set({ loaded: true });
      }
    })().finally(() => {
      fetchMembershipInflight = null;
    });
    return fetchMembershipInflight;
  },

  async ensureTrialOnEntry() {
    if (ensureTrialInflight) return ensureTrialInflight;
    ensureTrialInflight = (async () => {
      try {
        await api.ensureTrial();
      } catch {
        /* ignore */
      }
      await get().fetchMembership();
    })().finally(() => {
      ensureTrialInflight = null;
    });
    return ensureTrialInflight;
  },

  clear() {
    set({ loaded: false, membership: null });
  },

  effectivePlan() {
    return get().membership?.snapshot?.effectivePlan ?? get().membership?.effectivePlan ?? "none";
  },

  trialEndsAt() {
    return (
      get().membership?.snapshot?.trial?.endsAt ??
      get().membership?.trial?.endsAt ??
      get().membership?.memberExpire ??
      null
    );
  },

  trialActive() {
    return Boolean(get().membership?.snapshot?.trial?.active ?? get().membership?.trial?.active);
  },

  canExecutePro() {
    const mode = get().membership?.mode;
    if (!mode || mode === "off") return true;
    const f = get().membership?.snapshot?.features?.[FEATURE.CODE_EXECUTE_PRO];
    if (!f) return mode !== "enforce";
    return Boolean(f.allowed);
  },
}));

export { FEATURE };
