/** @see edu-app-web/src/lib/idp.ts */
import { type User, UserManager, WebStorageStateStore } from 'oidc-client-ts';

export interface IdpConfig {
  issuer: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri?: string;
  scopes?: string;
  tokenKey?: string;
}

export function readIdpConfig(): Partial<IdpConfig> {
  return {
    issuer: import.meta.env.VITE_IDP_ISSUER,
    clientId: import.meta.env.VITE_IDP_CLIENT_ID,
    redirectUri: import.meta.env.VITE_IDP_REDIRECT_URI ?? `${window.location.origin}/auth/callback`,
    postLogoutRedirectUri: import.meta.env.VITE_IDP_POST_LOGOUT_URI ?? window.location.origin,
    scopes: import.meta.env.VITE_IDP_SCOPES ?? 'openid profile email offline_access',
    tokenKey: import.meta.env.VITE_IDP_TOKEN_KEY ?? 'blockyedu_token',
  };
}

export function isDirectIdpEnabled(): boolean {
  const c = readIdpConfig();
  return Boolean(c.issuer && c.clientId);
}

let userManager: UserManager | null = null;

function getUserManager(config: IdpConfig): UserManager {
  if (userManager) return userManager;
  userManager = new UserManager({
    authority: config.issuer.replace(/\/$/, ''),
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    post_logout_redirect_uri: config.postLogoutRedirectUri ?? config.redirectUri,
    response_type: 'code',
    scope: config.scopes ?? 'openid profile email offline_access',
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  });
  return userManager;
}

export async function idpSignIn(returnUrl?: string): Promise<void> {
  const partial = readIdpConfig();
  if (!partial.issuer || !partial.clientId) throw new Error('IdP not configured');
  await getUserManager(partial as IdpConfig).signinRedirect({
    state: returnUrl ? { returnUrl } : undefined,
  });
}

export async function idpHandleCallback(): Promise<{ accessToken: string; returnUrl?: string }> {
  const partial = readIdpConfig();
  if (!partial.issuer || !partial.clientId) throw new Error('IdP not configured');
  const config = partial as IdpConfig;
  const user: User = await getUserManager(config).signinRedirectCallback();
  const tokenKey = config.tokenKey ?? 'blockyedu_token';
  localStorage.setItem(tokenKey, user.access_token);
  const returnUrl =
    typeof user.state === 'object' && user.state && 'returnUrl' in user.state
      ? String((user.state as { returnUrl?: string }).returnUrl ?? '')
      : undefined;
  return { accessToken: user.access_token, returnUrl: returnUrl || undefined };
}

export async function idpSignOut(): Promise<void> {
  const partial = readIdpConfig();
  if (!partial.issuer || !partial.clientId) return;
  const config = partial as IdpConfig;
  localStorage.removeItem(config.tokenKey ?? 'blockyedu_token');
  await getUserManager(config).signoutRedirect();
}
