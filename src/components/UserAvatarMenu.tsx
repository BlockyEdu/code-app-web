import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown } from "antd";
import type { AuthUser } from "../lib/auth-store";
import styles from "./UserAvatarMenu.module.scss";

interface UserAvatarMenuProps {
  user: AuthUser;
  onLogout: () => void;
  logoutLabel?: string;
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.slice(0, 1).toUpperCase();
}

export function UserAvatarMenu({ user, onLogout, logoutLabel = "退出登录" }: UserAvatarMenuProps) {
  return (
    <Dropdown
      trigger={["hover"]}
      placement="bottomRight"
      mouseEnterDelay={0.1}
      mouseLeaveDelay={0.25}
      popupRender={() => (
        <div className={styles.panel}>
          <div className={styles.identity}>
            <Avatar
              size={40}
              style={{ background: "#2563eb", flexShrink: 0 }}
              icon={<UserOutlined />}
            >
              {initialOf(user.name || user.username)}
            </Avatar>
            <div className={styles.meta}>
              <div className={styles.name}>{user.name || user.username}</div>
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
            {logoutLabel}
          </Button>
        </div>
      )}
    >
      <button type="button" className={styles.trigger} aria-label={user.name}>
        <Avatar size={28} style={{ background: "#2563eb" }} icon={<UserOutlined />}>
          {initialOf(user.name || user.username)}
        </Avatar>
      </button>
    </Dropdown>
  );
}
