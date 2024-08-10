import { type FormEvent, useEffect, useState } from 'react';
import { useAuthStore } from '../lib/auth-store';
import { startSsoLogin } from '../lib/sso';
import { appBrandTitle } from '../lib/deploy-profile';
import { LanguageSelector } from './LanguageSelector';
import { RunControls } from './RunControls';

export function Header() {
  const { user, logout, login, loading, loginPromptOpen, openLoginPrompt, closeLoginPrompt } =
    useAuthStore();
  const showLogin = loginPromptOpen;
  const [ssoAvailable, setSsoAvailable] = useState(false);
  const [username, setUsername] = useState('learner1');
  const [password, setPassword] = useState('learner123');

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) closeLoginPrompt();
  };

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/auth/login?returnUrl=${encodeURIComponent(`${window.location.origin}/auth/callback`)}`,
    )
      .then((r) => r.json())
      .then((info: { mode?: string }) => setSsoAvailable(info.mode === 'oidc'))
      .catch(() => setSsoAvailable(false));
  }, []);

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon">🧩</span>
        <span>{appBrandTitle()}</span>
        <span className="badge">MVP</span>
      </div>
      <LanguageSelector />
      <div className="header-auth">
        {user ? (
          <>
            <span className="user-label">{user.name}</span>
            <button type="button" className="btn-ghost" onClick={logout}>
              退出
            </button>
          </>
        ) : (
          <button type="button" className="btn-ghost" onClick={openLoginPrompt}>
            登录
          </button>
        )}
      </div>
      <RunControls />
      {showLogin && !user && (
        <form className="login-popover" onSubmit={onLogin}>
          <button
            type="button"
            className="login-close"
            onClick={closeLoginPrompt}
            aria-label="关闭"
          >
            ×
          </button>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
          />
          <button type="submit" disabled={loading}>
            登录
          </button>
          <button type="button" className="btn-ghost" onClick={() => startSsoLogin()}>
            {ssoAvailable ? 'SSO 登录' : '统一登录 ↗'}
          </button>
          <span className="login-tip">演示：learner1 / learner123</span>
        </form>
      )}
    </header>
  );
}
