import { LoginOutlined, PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { usePathname } from "../hooks/usePathname";
import { useAuthStore } from "../lib/auth-store";
import { appBrandTitle } from "../lib/deploy-profile";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { isProjectsPath, isSamplesListPath, navigate } from "../lib/navigate";
import { coursePlatformUrl } from "../lib/site-links";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { LogoMark } from "./Logo";
import styles from "./SiteHeader.module.scss";
import { UserAvatarMenu } from "./UserAvatarMenu";

interface SiteHeaderProps {
  onNewProject: () => void;
}

export function SiteHeader({ onNewProject }: SiteHeaderProps) {
  const path = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  useLocaleStore((s) => s.locale);

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <button type="button" className={styles.brand} onClick={() => navigate("/")}>
          <LogoMark size={28} />
          <span>{appBrandTitle()}</span>
        </button>
        <nav className={styles.nav} aria-label={t("site.navSamples")}>
          <button
            type="button"
            className={`${styles.navBtn} ${isSamplesListPath(path) ? styles.navBtnActive : ""}`}
            onClick={() => navigate("/samples")}
          >
            {t("site.navSamples")}
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${isProjectsPath(path) ? styles.navBtnActive : ""}`}
            onClick={() => navigate("/projects")}
          >
            {t("site.navProjects")}
          </button>
          <a className={styles.navBtn} href={coursePlatformUrl()} target="_blank" rel="noreferrer">
            {t("site.navCourses")}
          </a>
        </nav>
        <div className={styles.actions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onNewProject}>
            {t("site.newProject")}
          </Button>
          <LocaleSwitcher light labeled />
          {user ? (
            <UserAvatarMenu
              user={user}
              light
              showName
              onLogout={logout}
              logoutLabel={t("hub.logout")}
            />
          ) : (
            <Button icon={<LoginOutlined />} onClick={openLoginPrompt}>
              {t("site.signIn")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
