import { type FormEvent, useState } from "react";
import { useAuthStore } from "../lib/auth-store";
import { appBrandTitle } from "../lib/deploy-profile";
import { t } from "../lib/i18n";
import { isDirectIdpEnabled, isLocalPasswordLoginAllowed } from "../lib/idp";
import { useLocaleStore } from "../lib/locale-store";
import { LanguageSelector } from "./LanguageSelector";
import { LogoMark } from "./Logo";
import { RunControls } from "./RunControls";

export function Header() {
  useLocaleStore((s) => s.locale);
  const { user, logout, login, loading, loginPromptOpen, openLoginPrompt, closeLoginPrompt } =
    useAuthStore();
  const showLogin = loginPromptOpen && isLocalPasswordLoginAllowed() && !isDirectIdpEnabled();
  const [username, setUsername] = useState("learner1");
  const [password, setPassword] = useState("learner123");

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) closeLoginPrompt();
  };

  const goLogin = () => {
    if (isDirectIdpEnabled()) {
      window.location.href = "/login";
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
              {t("header.logout")}
            </button>
          </>
        ) : (
          <button type="button" className="btn-ghost" onClick={goLogin}>
            {t("header.login")}
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
            aria-label={t("header.close")}
          >
            ×
          </button>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("header.username")}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("header.password")}
          />
          <button type="submit" disabled={loading}>
            {t("header.login")}
          </button>
          <a className="btn-ghost" href="/login">
            {t("header.sso")}
          </a>
          <span className="login-tip">{t("header.demoTip")}</span>
        </form>
      )}
    </header>
  );
}
