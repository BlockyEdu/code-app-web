import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../lib/auth-store';
import {
  consumePostLoginPath,
  idpHandleCallback,
  idpHandlePopupCallback,
  isDirectIdpEnabled,
  isOidcPopupWindow,
} from '../lib/idp';
import { clearAuthHash, readTokenFromHash } from '../lib/sso';

export function AuthCallbackPage() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      if (isDirectIdpEnabled()) {
        try {
          if (isOidcPopupWindow()) {
            await idpHandlePopupCallback();
            return;
          }
          const { accessToken, returnUrl } = await idpHandleCallback();
          localStorage.setItem('blockyedu_token', accessToken);
          await fetchMe();
          const dest = consumePostLoginPath(
            (returnUrl || '/').replace(/^\/?/, '/') || '/',
          );
          window.location.replace(dest.startsWith('http') ? '/' : dest);
          return;
        } catch (e) {
          setError(e instanceof Error ? e.message : 'SSO 登录失败');
          return;
        }
      }

      const token = readTokenFromHash();
      if (!token) {
        setError('未收到登录令牌，请重新登录');
        return;
      }
      localStorage.setItem('blockyedu_token', token);
      clearAuthHash();
      try {
        await fetchMe();
        window.location.replace('/');
      } catch {
        setError('登录状态无效，请重试');
      }
    };
    void run();
  }, [fetchMe]);

  if (error) {
    return (
      <div className="auth-callback-page">
        <p className="error">{error}</p>
        <button type="button" className="btn-ghost" onClick={() => window.location.replace('/login')}>
          返回登录
        </button>
      </div>
    );
  }

  return (
    <div className="auth-callback-page">
      <p className="muted">正在完成登录…</p>
    </div>
  );
}
