import { useCallback, useEffect, useMemo } from 'react';
import {
  HeadlessLoginPanel,
  type LuminaryAuthSession,
} from '@luminaryworks/auth-react';
import { useAuthStore } from '../lib/auth-store';
import {
  isDirectIdpEnabled,
  isLocalPasswordLoginAllowed,
  peekPostLoginPath,
  readLuminaryIdpConfig,
  rememberPostLoginPath,
} from '../lib/idp';
import { LogoMark } from '../components/Logo';
import { appBrandTitle } from '../lib/deploy-profile';

export function LoginPage() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const ssoEnabled = isDirectIdpEnabled();
  const allowLocal = isLocalPasswordLoginAllowed();
  const config = useMemo(() => readLuminaryIdpConfig(), []);
  const returnUrl = useMemo(() => peekPostLoginPath() || '/', []);

  useEffect(() => {
    rememberPostLoginPath(returnUrl);
  }, [returnUrl]);

  const onOidcSession = useCallback(
    async (session: LuminaryAuthSession, next?: string) => {
      localStorage.setItem('blockyedu_token', session.accessToken);
      await fetchMe();
      const dest = (next || returnUrl || '/').replace(/^\/?/, '/');
      window.location.replace(dest.startsWith('http') ? '/' : dest);
    },
    [fetchMe, returnUrl],
  );

  return (
    <div className="login-page">
      <div className="login-page__panel">
        <div className="login-page__brand">
          <LogoMark size={36} />
          <h1>{appBrandTitle()}</h1>
          <p className="muted">LuminaryWorks 统一账号登录</p>
        </div>

        {ssoEnabled ? (
          <HeadlessLoginPanel
            config={config}
            productName="BlockyEdu"
            themeColor="#3a84ff"
            mode="redirect"
            returnUrl={returnUrl}
            onOidcSession={onOidcSession}
            labels={{
              title: '登录编程工作台',
              subtitle: '使用统一账号继续编码练习',
              identifierPlaceholder: '邮箱 / 用户名',
              passwordPlaceholder: '密码',
              submitPassword: '继续',
              submitSso: '使用统一账号登录',
              hint: '企业 SSO 与 MFA 由身份提供商处理。',
              experienceUnavailable: '密码登录暂不可用，请使用统一账号。',
            }}
          />
        ) : (
          <p className="error">统一登录未配置（缺少 VITE_IDP_CLIENT_ID）</p>
        )}

        {allowLocal ? (
          <form
            className="login-page__local"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const username = String(fd.get('username') || '');
              const password = String(fd.get('password') || '');
              const ok = await login(username, password);
              if (ok) window.location.replace('/');
            }}
          >
            <p className="muted">本地开发登录（VITE_ALLOW_LOCAL_LOGIN）</p>
            <input name="username" defaultValue="learner1" placeholder="用户名" />
            <input
              name="password"
              type="password"
              defaultValue="learner123"
              placeholder="密码"
            />
            <button type="submit" disabled={loading}>
              本地登录
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
