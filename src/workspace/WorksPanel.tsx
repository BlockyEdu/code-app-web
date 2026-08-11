import { ReloadOutlined } from "@ant-design/icons";
import { Button, Empty, message, Spin } from "antd";
import { useWorkItems } from "../hooks/useWorkItems";
import { useAuthStore } from "../lib/auth-store";
import type { WorkItem } from "../lib/work-items";
import { useWorkspaceStore } from "../stores/workspace";
import { KIND_COLOR, KIND_LABEL } from "../types/artifact";
import styles from "./WorksPanel.module.scss";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export function WorksPanel() {
  const user = useAuthStore((s) => s.user);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const currentProject = useWorkspaceStore((s) => s.currentProject);
  const openArtifact = useWorkspaceStore((s) => s.openArtifact);
  const openLegacyProject = useWorkspaceStore((s) => s.openLegacyProject);
  const setShowNewProjectDialog = useWorkspaceStore((s) => s.setShowNewProjectDialog);

  const { items, loading, refresh } = useWorkItems({
    enabled: Boolean(user),
    onError: (err) => {
      message.error(err instanceof Error ? err.message : "加载作品失败");
    },
  });

  const handleOpen = async (item: WorkItem) => {
    try {
      if (item.source === "artifact") {
        await openArtifact(item.id);
      } else {
        await openLegacyProject(item.id);
      }
      message.success("已打开作品");
      void refresh();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "打开失败");
    }
  };

  const isActive = (item: WorkItem) => {
    if (item.source === "artifact") return item.id === artifactId;
    return currentProject?.id === item.id && !artifactId;
  };

  return (
    <div className={styles.worksPanel}>
      <div className={styles.header}>
        <span className={styles.title}>我的作品</span>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => void refresh()}
          title="刷新"
          aria-label="刷新"
        >
          <ReloadOutlined spin={loading} />
        </button>
      </div>

      {!user ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="登录后同步云端作品与练习"
          className={styles.empty}
        />
      ) : loading && items.length === 0 ? (
        <div className={styles.loading}>
          <Spin size="small" />
        </div>
      ) : items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="还没有作品"
          className={styles.empty}
        >
          <Button type="primary" size="small" onClick={() => setShowNewProjectDialog(true)}>
            新建作品
          </Button>
        </Empty>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => {
            const color = KIND_COLOR[item.kind];
            const active = isActive(item);
            const legacy = item.source === "project";
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`${styles.item} ${active ? styles.itemActive : ""}`}
                  onClick={() => void handleOpen(item)}
                >
                  <span
                    className={styles.kindDot}
                    style={{ background: color }}
                    title={KIND_LABEL[item.kind]}
                  />
                  <span className={styles.itemBody}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemMeta}>
                      {KIND_LABEL[item.kind]}
                      {legacy ? " · 旧项目" : ""}
                      {item.language ? ` · ${item.language}` : ""}
                      {" · "}
                      {formatTime(item.updatedAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
