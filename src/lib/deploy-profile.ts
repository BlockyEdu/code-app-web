export type DeployProfile = 'code-standalone' | 'blockyedu-full';

export function getDeployProfile(): DeployProfile {
  const raw = import.meta.env.VITE_DEPLOY_PROFILE?.trim().toLowerCase();
  if (raw === 'code-standalone' || raw === 'code') return 'code-standalone';
  return 'blockyedu-full';
}

export function isCodeStandalone(): boolean {
  return getDeployProfile() === 'code-standalone';
}

export function isEduLoginLinked(): boolean {
  const url = import.meta.env.VITE_EDU_LOGIN_URL?.trim();
  return Boolean(url);
}

export function appBrandTitle(): string {
  return isCodeStandalone() ? 'BlockyEdu 编程平台' : 'BlockyEdu';
}
