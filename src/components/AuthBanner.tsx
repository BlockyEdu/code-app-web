import { useAuthStore } from "../lib/auth-store";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";

export function AuthBanner() {
  useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);

  if (user) return null;

  return (
    <div className="auth-banner">
      <span>{t("auth.banner")}</span>
      <button type="button" className="btn-ghost" onClick={openLoginPrompt}>
        {t("auth.loginNow")}
      </button>
    </div>
  );
}
