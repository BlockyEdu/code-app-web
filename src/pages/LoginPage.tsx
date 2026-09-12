import { HeadlessLoginPanel, type LuminaryAuthSession } from "@luminaryworks/auth-react";
import { useCallback, useEffect, useMemo } from "react";
import { LogoMark } from "../components/Logo";
import { useAuthStore } from "../lib/auth-store";
import { appBrandTitle } from "../lib/deploy-profile";
import { t } from "../lib/i18n";
import {
  isDirectIdpEnabled,
  isLocalPasswordLoginAllowed,
  peekPostLoginPath,
  readLuminaryIdpConfig,
  rememberPostLoginPath,
} from "../lib/idp";
import { useLocaleStore } from "../lib/locale-store";

export function LoginPage() {
  useLocaleStore((s) => s.locale);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const ssoEnabled = isDirectIdpEnabled();
  const allowLocal = isLocalPasswordLoginAllowed();
  const config = useMemo(() => readLuminaryIdpConfig(), []);
  const returnUrl = useMemo(() => peekPostLoginPath() || "/", []);

  useEffect(() => {
    rememberPostLoginPath(returnUrl);
  }, [returnUrl]);

  const onOidcSession = useCallback(
    async (session: LuminaryAuthSession, next?: string) => {
      localStorage.setItem("blockyedu_token", session.accessToken);
      await fetchMe();
      const dest = (next || returnUrl || "/").replace(/^\/?/, "/");
      window.location.replace(dest.startsWith("http") ? "/" : dest);
    },
    [fetchMe, returnUrl],
  );

  return (
    <div className="login-page">
      <div className="login-page__panel">
        <div className="login-page__brand">
          <LogoMark size={36} />
          <h1>{appBrandTitle()}</h1>
          <p className="muted">{t("login.ssoLead")}</p>
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
              title: t("login.title"),
              subtitle: t("login.subtitle"),
              identifierPlaceholder: t("login.identifier"),
              passwordPlaceholder: t("login.password"),
              submitPassword: t("login.submitPassword"),
              submitSso: t("login.submitSso"),
              hint: t("login.hint"),
              experienceUnavailable: t("login.experienceUnavailable"),
            }}
          />
        ) : (
          <p className="error">{t("login.missingClient")}</p>
        )}

        {allowLocal ? (
          <form
            className="login-page__local"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const username = String(fd.get("username") || "");
              const password = String(fd.get("password") || "");
              const ok = await login(username, password);
              if (ok) window.location.replace("/");
            }}
          >
            <p className="muted">{t("login.localLead")}</p>
            <input name="username" defaultValue="learner1" placeholder={t("login.username")} />
            <input
              name="password"
              type="password"
              defaultValue="learner123"
              placeholder={t("login.passwordPh")}
            />
            <button type="submit" disabled={loading}>
              {t("login.localSubmit")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
