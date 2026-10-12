import { appBrandTitle } from "../lib/deploy-profile";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { navigate } from "../lib/navigate";
import { LogoMark } from "./Logo";
import styles from "./SiteFooter.module.scss";

const LINKS = [
  { key: "site.footerAbout", path: "/about" },
  { key: "site.footerTerms", path: "/legal/terms" },
  { key: "site.footerPrivacy", path: "/legal/privacy" },
] as const;

export function SiteFooter() {
  useLocaleStore((s) => s.locale);
  const brand = appBrandTitle();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <button type="button" className={styles.brand} onClick={() => navigate("/")}>
            <LogoMark size={28} alt="" />
            <span>{brand}</span>
          </button>
          <nav className={styles.links} aria-label={t("site.footerNav")}>
            {LINKS.map((link) => (
              <button
                key={link.path}
                type="button"
                className={styles.link}
                onClick={() => navigate(link.path)}
              >
                {t(link.key)}
              </button>
            ))}
          </nav>
        </div>
        <p className={styles.copy}>
          © {year} {brand}
        </p>
      </div>
    </footer>
  );
}
