import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown } from "antd";
import type { AuthUser } from "../lib/auth-store";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import styles from "./UserAvatarMenu.module.scss";

interface UserAvatarMenuProps {
  user: AuthUser;
  onLogout: () => void;
  logoutLabel?: string;
  /** Site header: avatar plus name, light menu. Workspace stays icon-only. */
  showName?: boolean;
  light?: boolean;
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.slice(0, 1).toUpperCase();
}

export function UserAvatarMenu({
  user,
  onLogout,
  logoutLabel,
  showName = false,
  light = false,
}: UserAvatarMenuProps) {
  useLocaleStore((s) => s.locale);
  const label = logoutLabel ?? t("hub.logout");
  const displayName = user.name || user.username;
  return (
    <Dropdown
      trigger={["hover"]}
      placement="bottomRight"
      mouseEnterDelay={0.1}
      mouseLeaveDelay={0.25}
      popupRender={() => (
        <div className={`${styles.panel} ${light ? styles.panelLight : ""}`}>
          <div className={styles.identity}>
            <Avatar
              size={40}
              style={{ background: "#2563eb", flexShrink: 0 }}
              icon={<UserOutlined />}
            >
              {initialOf(displayName)}
            </Avatar>
            <div className={styles.meta}>
              <div className={styles.name}>{displayName}</div>
              <div className={styles.username}>@{user.username}</div>
            </div>
          </div>
          <Button
            type="text"
            danger
            size="small"
            className={styles.logoutBtn}
            icon={<LogoutOutlined />}
            onClick={onLogout}
          >
            {label}
          </Button>
        </div>
      )}
    >
      <button
        type="button"
        className={showName ? styles.triggerLabeled : styles.trigger}
        aria-label={displayName}
      >
        <Avatar size={showName ? 24 : 28} style={{ background: "#2563eb" }} icon={<UserOutlined />}>
          {initialOf(displayName)}
        </Avatar>
        {showName ? <span className={styles.triggerName}>{displayName}</span> : null}
      </button>
    </Dropdown>
  );
}
