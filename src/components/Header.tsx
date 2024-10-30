import { type FormEvent, useState } from 'react';
import { useAuthStore } from '../lib/auth-store';
import { isDirectIdpEnabled, isLocalPasswordLoginAllowed } from '../lib/idp';
import { appBrandTitle } from '../lib/deploy-profile';
import { LanguageSelector } from './LanguageSelector';
import { LogoMark } from './Logo';
import { RunControls } from './RunControls';

export function Header() {
  const { user, logout, login, loading, loginPromptOpen, openLoginPrompt, closeLoginPrompt } =
    useAuthStore();
  const showLogin = loginPromptOpen && isLocalPasswordLoginAllowed() && !isDirectIdpEnabled();
  const [username, setUsername] = useState('learner1');
  const [password, setPassword] = useState('learner123');

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) closeLoginPrompt();
  };

  const goLogin = () => {
    if (isDirectIdpEnabled()) {
      window.location.href = '/login';
      return;
    }
    openLoginPrompt();
  };

  return (
    <header className="app-header">
      <div className="brand">
        <LogoMark size={28} />
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
          <button type="button" className="btn-ghost" onClick={goLogin}>
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
          <a className="btn-ghost" href="/login">
            统一登录 ↗
          </a>
          <span className="login-tip">演示：learner1 / learner123</span>
        </form>
      )}
    </header>
  );
}
