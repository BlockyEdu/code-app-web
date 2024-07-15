import { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/auth-store';
import { idpHandleCallback, isDirectIdpEnabled } from '../lib/idp';
import { clearAuthHash, readTokenFromHash } from '../lib/sso';

export function AuthCallbackPage() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (isDirectIdpEnabled()) {
        try {
          await idpHandleCallback();
          await fetchMe();
          window.location.replace('/');
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
        <button type="button" className="btn-ghost" onClick={() => window.location.replace('/')}>
          返回编辑器
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
