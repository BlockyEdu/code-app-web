import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../lib/auth-store";
import { t } from "../lib/i18n";
import {
  consumePostLoginPath,
  idpHandleCallback,
  idpHandlePopupCallback,
  isDirectIdpEnabled,
  isOidcPopupWindow,
} from "../lib/idp";
import { useLocaleStore } from "../lib/locale-store";
import { clearAuthHash, readTokenFromHash } from "../lib/sso";

export function AuthCallbackPage() {
  useLocaleStore((s) => s.locale);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [error, setError] = useState("");
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
          localStorage.setItem("blockyedu_token", accessToken);
          await fetchMe();
          const dest = consumePostLoginPath((returnUrl || "/").replace(/^\/?/, "/") || "/");
          window.location.replace(dest.startsWith("http") ? "/" : dest);
          return;
        } catch (e) {
          setError(e instanceof Error ? e.message : t("authCallback.ssoFailed"));
          return;
        }
      }

      const token = readTokenFromHash();
      if (!token) {
        setError(t("authCallback.noToken"));
        return;
      }
      localStorage.setItem("blockyedu_token", token);
      clearAuthHash();
      try {
        await fetchMe();
        window.location.replace("/");
      } catch {
        setError(t("authCallback.invalid"));
      }
    };
    void run();
  }, [fetchMe]);

  if (error) {
    return (
      <div className="auth-callback-page">
        <p className="error">{error}</p>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => window.location.replace("/login")}
        >
          {t("authCallback.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-callback-page">
      <p className="muted">{t("authCallback.completing")}</p>
    </div>
  );
}
