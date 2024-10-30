/**
 * LuminaryWorks OIDC SPA client — thin wrapper over `@luminaryworks/auth-react`.
 * Rsbuild/Vite only inlines static `import.meta.env.VITE_*` reads.
 */
import {
  createPostLoginPathHelpers,
  handleSignInCallback,
  handleSignInPopupCallback,
  isIdpConfigured,
  isOidcPopupWindow,
  type LuminaryAuthSession,
  type LuminaryIdpConfig,
  readIdpConfigFromEnv,
  resetUserManager,
  signInRedirect,
  signOutRedirect,
} from '@luminaryworks/auth-react';

export type { LuminaryAuthSession, LuminaryIdpConfig };

export const DEFAULT_REDIRECT_PATH = '/auth/callback';

function viteEnv(): Record<string, string | undefined> {
  return {
    VITE_AUTH_GATEWAY_URL: import.meta.env.VITE_AUTH_GATEWAY_URL,
    PUBLIC_AUTH_GATEWAY_URL: import.meta.env.PUBLIC_AUTH_GATEWAY_URL,
    AUTH_GATEWAY_URL: import.meta.env.AUTH_GATEWAY_URL,
    VITE_AUTH_EXPERIENCE_URL: import.meta.env.VITE_AUTH_EXPERIENCE_URL,
    PUBLIC_AUTH_EXPERIENCE_URL: import.meta.env.PUBLIC_AUTH_EXPERIENCE_URL,
    AUTH_EXPERIENCE_URL: import.meta.env.AUTH_EXPERIENCE_URL,
    VITE_IDP_ISSUER: import.meta.env.VITE_IDP_ISSUER,
    PUBLIC_IDP_ISSUER: import.meta.env.PUBLIC_IDP_ISSUER,
    IDP_ISSUER: import.meta.env.IDP_ISSUER,
    VITE_IDP_CLIENT_ID: import.meta.env.VITE_IDP_CLIENT_ID,
    PUBLIC_IDP_CLIENT_ID: import.meta.env.PUBLIC_IDP_CLIENT_ID,
    VITE_IDP_REDIRECT_URI: import.meta.env.VITE_IDP_REDIRECT_URI,
    PUBLIC_IDP_REDIRECT_URI: import.meta.env.PUBLIC_IDP_REDIRECT_URI,
    VITE_IDP_POPUP_REDIRECT_URI: import.meta.env.VITE_IDP_POPUP_REDIRECT_URI,
    PUBLIC_IDP_POPUP_REDIRECT_URI: import.meta.env.PUBLIC_IDP_POPUP_REDIRECT_URI,
    VITE_IDP_POST_LOGOUT_URI: import.meta.env.VITE_IDP_POST_LOGOUT_URI,
    PUBLIC_IDP_POST_LOGOUT_URI: import.meta.env.PUBLIC_IDP_POST_LOGOUT_URI,
    VITE_IDP_SCOPES: import.meta.env.VITE_IDP_SCOPES,
    PUBLIC_IDP_SCOPES: import.meta.env.PUBLIC_IDP_SCOPES,
    VITE_IDP_AUDIENCE: import.meta.env.VITE_IDP_AUDIENCE,
    PUBLIC_IDP_AUDIENCE: import.meta.env.PUBLIC_IDP_AUDIENCE,
    VITE_IDP_TOKEN_KEY: import.meta.env.VITE_IDP_TOKEN_KEY ?? 'blockyedu_token',
  };
}

export function readLuminaryIdpConfig(): Partial<LuminaryIdpConfig> {
  const env = viteEnv();
  const fromShared = readIdpConfigFromEnv(env);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUri =
    fromShared.redirectUri ||
    env.VITE_IDP_REDIRECT_URI ||
    `${origin}${DEFAULT_REDIRECT_PATH}`;
  return {
    ...fromShared,
    redirectUri,
    popupRedirectUri: fromShared.popupRedirectUri || redirectUri,
    postLogoutRedirectUri:
      fromShared.postLogoutRedirectUri ||
      env.VITE_IDP_POST_LOGOUT_URI ||
      `${origin}/login`,
    tokenStorageKey: fromShared.tokenStorageKey || 'blockyedu_token',
  };
}

export function readIdpConfig(): Partial<LuminaryIdpConfig> {
  return readLuminaryIdpConfig();
}

export function isDirectIdpEnabled(): boolean {
  return isIdpConfigured(readLuminaryIdpConfig());
}

export function isLocalPasswordLoginAllowed(): boolean {
  return import.meta.env.VITE_ALLOW_LOCAL_LOGIN === 'true';
}

export const { rememberPostLoginPath, peekPostLoginPath, consumePostLoginPath } =
  createPostLoginPathHelpers({
    storageKey: 'blockyedu:code:postLoginPath',
    defaultPath: '/',
    unsafePrefixes: ['/login', '/auth'],
  });

export async function idpSignIn(returnUrl?: string): Promise<void> {
  const config = readLuminaryIdpConfig();
  if (!isIdpConfigured(config)) throw new Error('IdP not configured');
  resetUserManager();
  await signInRedirect(config, returnUrl);
}

export async function idpHandleCallback(): Promise<{
  accessToken: string;
  returnUrl?: string;
  session: LuminaryAuthSession;
}> {
  const config = readLuminaryIdpConfig();
  if (!isIdpConfigured(config)) throw new Error('IdP not configured');
  const { session, returnUrl } = await handleSignInCallback(config);
  localStorage.setItem(config.tokenStorageKey ?? 'blockyedu_token', session.accessToken);
  return { accessToken: session.accessToken, returnUrl, session };
}

export async function idpHandlePopupCallback(): Promise<void> {
  const config = readLuminaryIdpConfig();
  if (!isIdpConfigured(config)) throw new Error('IdP not configured');
  await handleSignInPopupCallback(config);
}

export async function idpSignOut(): Promise<void> {
  const config = readLuminaryIdpConfig();
  if (!isIdpConfigured(config)) return;
  await signOutRedirect(config);
}

export { isOidcPopupWindow, handleSignInCallback };
