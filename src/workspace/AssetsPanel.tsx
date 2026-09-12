import {
  AppstoreOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  FileOutlined,
  FolderOutlined,
  PlusOutlined,
  ReadOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { App as AntdApp, Tooltip } from "antd";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { LessonPanel } from "../components/LessonPanel";
import { ProjectPanel } from "../components/ProjectPanel";
import { type ArtifactVersion, api } from "../lib/api";
import {
  studioMissionDone,
  studioMissionSteps,
  studioMissionTitle,
} from "../lib/app-studio/blog-mission";
import {
  formatVersionTime,
  takeRecentArtifactVersions,
  versionHasFiles,
} from "../lib/artifact-versions";
import { type FileTreeNode, filesToTree } from "../lib/file-tree";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { navigate } from "../lib/navigate";
import { PAIR_PHASE_LABEL } from "../lib/pair-mission";
import { profileFeatures } from "../lib/product-profile";
import { isAppStudioKind, useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind, LeftPanelTab } from "../types/artifact";
import { isConsoleKind, isHardwareKind } from "../types/artifact";
import styles from "./AssetsPanel.module.scss";

function getActivityTabs(
  kind: ArtifactKind,
  blogStudio: boolean,
): { id: LeftPanelTab; icon: ReactNode; label: string }[] {
  const base: { id: LeftPanelTab; icon: ReactNode; label: string }[] = [
    { id: "files", icon: <FolderOutlined />, label: t("assets.files") },
  ];
  if (isHardwareKind(kind) || kind === "smarthome" || kind === "toy") {
    base.push({ id: "modules", icon: <AppstoreOutlined />, label: t("assets.modules") });
  }
  if (isConsoleKind(kind) || blogStudio) {
    base.push({ id: "learn", icon: <ReadOutlined />, label: t("assets.learn") });
  }
  if (isHardwareKind(kind) && profileFeatures().showLaunchNav) {
    base.push({ id: "launch", icon: <RocketOutlined />, label: t("assets.launch") });
  }
  return base;
}

function FileTree() {
  const { message } = AntdApp.useApp();
  useLocaleStore((s) => s.locale);
  const files = useWorkspaceStore((s) => s.artifactFiles);
  const activeFilePath = useWorkspaceStore((s) => s.activeFilePath);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const setActiveFile = useWorkspaceStore((s) => s.setActiveFile);
  const addArtifactFile = useWorkspaceStore((s) => s.addArtifactFile);
  const removeArtifactFile = useWorkspaceStore((s) => s.removeArtifactFile);
  const kind = useWorkspaceStore((s) => s.artifactKind);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const paths = files.map((f) => f.path);
  const tree = useMemo(
    () => filesToTree(paths.length ? paths : [activeFilePath || "main.js"]),
    [paths, activeFilePath],
  );

  const addFile = () => {
    const path = window.prompt(
      t("files.promptPath"),
      kind === "iot" ? "firmware/notes.txt" : "notes.md",
    );
    if (path) addArtifactFile(path);
  };

  const deleteFile = async (path: string) => {
    const fileCount = files.length || 1;
    if (fileCount <= 1) {
      message.warning(t("files.lastFile"));
      return;
    }
    if (!window.confirm(t("files.deleteConfirm", { path }))) return;

    if (!artifactId) {
      if (!removeArtifactFile(path)) message.warning(t("files.lastFile"));
      return;
    }

    const wasDirty = useWorkspaceStore.getState().saveDirty;
    setDeletingPath(path);
    try {
      await api.deleteArtifactFile(artifactId, path);
      if (!removeArtifactFile(path, { saveDirty: wasDirty })) {
        message.warning(t("files.lastFile"));
      }
    } catch {
      message.error(t("files.deleteFailed"));
    } finally {
      setDeletingPath(null);
    }
  };

  const renderNode = (node: FileTreeNode, depth: number) => {
    if (node.children) {
      const open = expanded[node.path] ?? depth < 2;
      return (
        <div key={node.path}>
          <button
            type="button"
            className={styles.treeFolder}
            onClick={() => setExpanded((p) => ({ ...p, [node.path]: !open }))}
          >
            <span className={styles.treeChevron}>
              {open ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
            <span className={styles.treeIcon}>
              <FolderOutlined />
            </span>
            <span className={styles.treeName}>{node.name}</span>
          </button>
          {open && node.children.map((c) => renderNode(c, depth + 1))}
        </div>
      );
    }
    return (
      <div
        key={node.path}
        className={`${styles.treeFile} ${activeFilePath === node.path ? styles.treeFileActive : ""}`}
      >
        <button
          type="button"
          className={styles.treeFileMain}
          onClick={() => setActiveFile(node.path)}
        >
          <span className={styles.treeIcon} style={{ marginLeft: 8 + depth * 8 }}>
            <FileOutlined />
          </span>
          <span className={styles.treeName}>{node.name}</span>
        </button>
        <button
          type="button"
          className={styles.treeFileDelete}
          aria-label={t("files.delete")}
          disabled={deletingPath === node.path}
          onClick={() => void deleteFile(node.path)}
        >
          <DeleteOutlined />
        </button>
      </div>
    );
  };

  return (
    <div className={styles.fileTree}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{t("files.title")}</span>
        <button
          type="button"
          className={styles.sectionAction}
          aria-label={t("files.new")}
          onClick={addFile}
        >
          <PlusOutlined />
        </button>
      </div>
      {tree.map((n) => renderNode(n, 0))}
    </div>
  );
}

function VersionsStrip() {
  const { message } = AntdApp.useApp();
  const locale = useLocaleStore((s) => s.locale);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const saveCurrentArtifact = useWorkspaceStore((s) => s.saveCurrentArtifact);
  const restoreArtifactFiles = useWorkspaceStore((s) => s.restoreArtifactFiles);
  const [items, setItems] = useState<ArtifactVersion[]>([]);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);

  const refresh = useCallback(async (id: string) => {
    try {
      const res = await api.listArtifactVersions(id);
      setItems(takeRecentArtifactVersions(res.items));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (!artifactId) {
      setItems([]);
      return;
    }
    void refresh(artifactId);
  }, [artifactId, refresh]);

  if (!artifactId) return null;

  const saveVersion = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (useWorkspaceStore.getState().saveDirty) {
        const saved = await saveCurrentArtifact();
        if (!saved) {
          message.error(t("files.versionSaveFailed"));
          return;
        }
      }
      await api.createArtifactVersion(artifactId, { label: "manual" });
      message.success(t("files.versionSaved"));
      await refresh(artifactId);
    } catch {
      message.error(t("files.versionSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const restoreVersion = async (versionNumber: number) => {
    if (restoring !== null) return;
    if (!window.confirm(t("files.restoreConfirm", { n: versionNumber }))) return;
    setRestoring(versionNumber);
    try {
      const version = await api.getArtifactVersion(artifactId, versionNumber);
      if (!versionHasFiles(version)) {
        message.error(t("files.restoreFailed"));
        return;
      }
      restoreArtifactFiles(version.files);
      message.success(t("files.restoreOk"));
    } catch {
      message.error(t("files.restoreFailed"));
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className={styles.versionsStrip}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{t("files.versions")}</span>
        <button
          type="button"
          className={styles.versionsSave}
          disabled={saving}
          onClick={() => void saveVersion()}
        >
          {t("files.saveVersion")}
        </button>
      </div>
      {items.length === 0 ? (
        <p className={styles.versionsEmpty}>{t("files.versionEmpty")}</p>
      ) : (
        <ul className={styles.versionsList}>
          {items.map((v) => (
            <li key={v.id || `${v.artifactId}-${v.versionNumber}`} className={styles.versionRow}>
              <span className={styles.versionNumber}>v{v.versionNumber}</span>
              <span className={styles.versionMessage}>{v.message?.trim() || "—"}</span>
              <span className={styles.versionTime}>{formatVersionTime(v.createdAt, locale)}</span>
              <button
                type="button"
                className={styles.versionRestore}
                disabled={restoring !== null}
                onClick={() => void restoreVersion(v.versionNumber)}
              >
                {t("files.restore")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModulesPanel({ kind }: { kind: ArtifactKind }) {
  const [items, setItems] = useState<
    Array<{ sku: string; name: string; bus: string; voltage: string }>
  >([]);
  const [compat, setCompat] = useState<string | null>(null);
  const boardSku = useWorkspaceStore((s) => s.boardSku);
  useLocaleStore((s) => s.locale);

  useEffect(() => {
    if (!isHardwareKind(kind)) return;
    void api
      .listHardwareModules(boardSku ?? undefined)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, [kind, boardSku]);

  if (!isHardwareKind(kind)) {
    return <div className={styles.mutedPad}>{t("modules.filesHint")}</div>;
  }

  const check = async (sku: string) => {
    if (!boardSku) return;
    try {
      const res = await api.checkHardwareCompat(boardSku, [sku]);
      setCompat(
        res.ok ? t("modules.compatible", { sku }) : res.issues.map((i) => i.message).join("; "),
      );
    } catch (err) {
      setCompat(err instanceof Error ? err.message : t("modules.checkFailed"));
    }
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          {t("modules.catalog")}
          {boardSku ? ` · ${boardSku}` : ""}
        </span>
      </div>
      {compat && <p className={styles.compatNote}>{compat}</p>}
      <div className={styles.modulesGrid}>
        {items.length === 0 ? (
          <p className={styles.mutedPad}>{t("modules.signIn")}</p>
        ) : (
          items.map((m) => (
            <button
              key={m.sku}
              type="button"
              className={styles.moduleCard}
              onClick={() => void check(m.sku)}
            >
              <span className={styles.moduleLabel}>{m.name}</span>
              <span className={styles.moduleDesc}>
                {m.sku} · {m.bus} · {m.voltage}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function BlogMissionCard() {
  const schema = useWorkspaceStore((s) => s.appSchema);
  const posts = useWorkspaceStore((s) => s.blogPosts);
  const blogPreviewPage = useWorkspaceStore((s) => s.blogPreviewPage);
  const blogPublish = useWorkspaceStore((s) => s.blogPublish);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const zh = useLocaleStore((s) => s.locale) === "zh-CN";
  const steps = studioMissionSteps(templateId);
  const done = studioMissionDone({
    schema,
    posts,
    detailVisited: blogPreviewPage === "post",
    publish: blogPublish,
    templateId,
  });

  return (
    <div className={styles.missionCard}>
      <div className={styles.sectionTitle}>{t("launch.mission")}</div>
      <strong>{studioMissionTitle(templateId, zh)}</strong>
      <p>{t("launch.missionBlogHint")}</p>
      {steps.map((step, index) => (
        <div key={step.id} className={styles.phaseChip} style={{ marginBottom: 6 }}>
          {done[step.id as keyof typeof done] ? "✓ " : "○ "}
          {index + 1} {zh ? step.title : step.id}
        </div>
      ))}
    </div>
  );
}

function LearnPanel() {
  const pairMission = useWorkspaceStore((s) => s.pairMission);
  const kind = useWorkspaceStore((s) => s.artifactKind);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const blogStudio = isAppStudioKind(kind, templateId);

  return (
    <div className={styles.learnStack}>
      {blogStudio && <BlogMissionCard />}
      {(kind === "free" || kind === "exercise") && (
        <div className={styles.missionCard}>
          <div className={styles.sectionTitle}>{t("launch.mission")}</div>
          <strong>{pairMission.title}</strong>
          <p>{pairMission.success}</p>
          <span className={styles.phaseChip}>{PAIR_PHASE_LABEL[pairMission.phase]}</span>
        </div>
      )}
      {!blogStudio && (
        <>
          <div className={styles.learnSection}>
            <LessonPanel />
          </div>
          <div className={styles.learnSection}>
            <ProjectPanel />
          </div>
        </>
      )}
    </div>
  );
}

function LaunchChecklist() {
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const features = profileFeatures();
  useLocaleStore((s) => s.locale);

  return (
    <div className={styles.mutedPad}>
      <div className={styles.sectionTitle}>{t("launch.checklist")}</div>
      <ol className={styles.checklist}>
        <li>{t("launch.itemAssert")}</li>
        <li>{t("launch.itemBom")}</li>
        <li>{t("launch.itemGerber")}</li>
        <li>{t("launch.itemQuote")}</li>
        <li>{t("launch.itemPack")}</li>
      </ol>
      {artifactId && features.showLaunchNav ? (
        <button
          type="button"
          className={styles.launchLink}
          onClick={() => navigate(`/launch/${artifactId}`)}
        >
          {t("launch.openDesk")}
        </button>
      ) : (
        <p>{t("launch.saveFirst")}</p>
      )}
    </div>
  );
}

function AssetsDrawerBody() {
  const kind = useWorkspaceStore((s) => s.artifactKind);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const activeTab = useWorkspaceStore((s) => s.activeLeftTab);
  const setActiveLeftTab = useWorkspaceStore((s) => s.setActiveLeftTab);
  useLocaleStore((s) => s.locale);
  const tabs = getActivityTabs(kind, isAppStudioKind(kind, templateId));
  const resolvedTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0].id;

  return (
    <aside className={styles.leftPanel}>
      <div className={styles.drawerHead}>
        <span className={styles.drawerTitle}>{t("launch.context")}</span>
      </div>
      <div className={styles.drawerBody}>
        <div className={styles.activityBar}>
          {tabs.map((tab) => (
            <Tooltip key={tab.id} title={tab.label} placement="right">
              <button
                type="button"
                className={`${styles.activityBtn} ${resolvedTab === tab.id ? styles.activityBtnActive : ""}`}
                onClick={() => setActiveLeftTab(tab.id)}
              >
                {tab.icon}
              </button>
            </Tooltip>
          ))}
        </div>
        <div className={styles.panelContent}>
          {resolvedTab === "files" && (
            <div className={styles.filesTab}>
              <FileTree />
              <VersionsStrip />
            </div>
          )}
          {resolvedTab === "modules" && <ModulesPanel kind={kind} />}
          {resolvedTab === "learn" && <LearnPanel />}
          {resolvedTab === "launch" && <LaunchChecklist />}
        </div>
      </div>
    </aside>
  );
}

/** Resident left context panel (not an overlay drawer). */
export function AssetsPanel() {
  return <AssetsDrawerBody />;
}
