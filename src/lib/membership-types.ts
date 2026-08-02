/** Membership / entitlement types for code-app-web */
export type PlanCode = 'trial' | 'pro' | 'ultra' | 'enterprise' | 'none';
export type EntitlementMode = 'off' | 'shadow_read' | 'enforce';

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
  CODE_EXECUTE_PRO: 'code.execute.pro',
  AI_COPILOT: 'ai.copilot',
  AI_TUTOR: 'ai.tutor',
} as const;

export const PLAN_LABELS: Record<PlanCode, string> = {
  none: '免费用户',
  trial: '试用 Pro',
  pro: '专业版 Pro',
  ultra: '旗舰版 Ultra',
  enterprise: '企业版 Enterprise',
};

export function isEntitlementErrorCode(code?: string): boolean {
  return Boolean(code?.startsWith('ENTITLEMENT_'));
}
