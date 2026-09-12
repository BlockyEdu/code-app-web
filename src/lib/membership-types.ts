import { t } from "./i18n";

/** Membership / entitlement types for code-app-web */
export type PlanCode = "trial" | "pro" | "ultra" | "enterprise" | "none";
export type EntitlementMode = "off" | "shadow_read" | "enforce";

export interface MembershipResponse {
  subjectId?: string;
  productCode?: string;
  mode?: EntitlementMode;
  snapshot?: {
    effectivePlan: PlanCode;
    trial?: { active: boolean; endsAt: string | null; consumed: boolean };
    features?: Record<string, { allowed: boolean }>;
  } | null;
  effectivePlan?: PlanCode;
  isMember?: boolean;
  memberTier?: string;
  memberExpire?: string | null;
  trial?: { active: boolean; endsAt: string | null; consumed: boolean };
}

export const FEATURE = {
  CODE_EXECUTE_PRO: "code.execute.pro",
  AI_COPILOT: "ai.copilot",
  AI_TUTOR: "ai.tutor",
} as const;

export function planLabel(plan: PlanCode): string {
  switch (plan) {
    case "none":
      return t("membership.planNone");
    case "trial":
      return t("membership.planTrial");
    case "pro":
      return t("membership.planPro");
    case "ultra":
      return t("membership.planUltra");
    case "enterprise":
      return t("membership.planEnterprise");
  }
}

export function isEntitlementErrorCode(code?: string): boolean {
  return Boolean(code?.startsWith("ENTITLEMENT_"));
}
