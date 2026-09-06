import {
  AppstoreOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  FileOutlined,
  FolderOutlined,
  PlusOutlined,
  ReadOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { LessonPanel } from "../components/LessonPanel";
import { ProjectPanel } from "../components/ProjectPanel";
import { api } from "../lib/api";
import {
  studioMissionDone,
  studioMissionSteps,
  studioMissionTitle,
} from "../lib/app-studio/blog-mission";
import { type AppLocale, useLocaleStore } from "../lib/locale-store";
import { navigate } from "../lib/navigate";
import { PAIR_PHASE_LABEL } from "../lib/pair-mission";
import { profileFeatures } from "../lib/product-profile";
import { isAppStudioKind, useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind, LeftPanelTab } from "../types/artifact";
import { isConsoleKind, isHardwareKind } from "../types/artifact";
import styles from "./AssetsPanel.module.scss";

type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
};

function filesToTree(paths: string[]): TreeNode[] {
  type Draft = { name: string; path: string; children: Record<string, Draft>; file?: boolean };
  const root: Record<string, Draft> = {};
  for (const full of paths) {
    const parts = full.split("/").filter(Boolean);
    let cur = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      acc = acc ? `${acc}/${name}` : name;
      if (!cur[name]) cur[name] = { name, path: acc, children: {} };
      if (i === parts.length - 1) cur[name].file = true;
      cur = cur[name].children;
    }
  }
  const toList = (obj: Record<string, Draft>): TreeNode[] =>
    Object.values(obj)
      .sort(
        (a, b) => Number(Boolean(a.file)) - Number(Boolean(b.file)) || a.name.localeCompare(b.name),
      )
      .map((n) => ({
        name: n.name,
        path: n.path,
        children: n.file ? undefined : toList(n.children),
      }));
  return toList(root);
}

function getActivityTabs(
  kind: ArtifactKind,
  locale: AppLocale,
  blogStudio: boolean,
): { id: LeftPanelTab; icon: ReactNode; label: string }[] {
  const zh = locale === "zh-CN";
  const base: { id: LeftPanelTab; icon: ReactNode; label: string }[] = [
    { id: "files", icon: <FolderOutlined />, label: zh ? "文件" : "Files" },
  ];
  if (isHardwareKind(kind) || kind === "smarthome" || kind === "toy") {
    base.push({ id: "modules", icon: <AppstoreOutlined />, label: zh ? "模块" : "Modules" });
  }
  if (isConsoleKind(kind) || blogStudio) {
    base.push({ id: "learn", icon: <ReadOutlined />, label: zh ? "学习" : "Learn" });
  }
  if (isHardwareKind(kind) && profileFeatures().showLaunchNav) {
    base.push({ id: "launch", icon: <RocketOutlined />, label: zh ? "发布" : "Launch" });
  }
  return base;
}

function FileTree() {
  const files = useWorkspaceStore((s) => s.artifactFiles);
  const activeFilePath = useWorkspaceStore((s) => s.activeFilePath);
  const setActiveFile = useWorkspaceStore((s) => s.setActiveFile);
  const addArtifactFile = useWorkspaceStore((s) => s.addArtifactFile);
  const kind = useWorkspaceStore((s) => s.artifactKind);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const paths = files.map((f) => f.path);
  const tree = useMemo(
    () => filesToTree(paths.length ? paths : [activeFilePath || "main.js"]),
    [paths, activeFilePath],
  );

  const addFile = () => {
    const path = window.prompt("New file path", kind === "iot" ? "firmware/notes.txt" : "notes.md");
    if (path) addArtifactFile(path);
  };

  const renderNode = (node: TreeNode, depth: number) => {
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
      <button
        key={node.path}
        type="button"
        className={`${styles.treeFile} ${activeFilePath === node.path ? styles.treeFileActive : ""}`}
        onClick={() => setActiveFile(node.path)}
      >
        <span className={styles.treeIcon} style={{ marginLeft: 8 + depth * 8 }}>
          <FileOutlined />
        </span>
        <span className={styles.treeName}>{node.name}</span>
      </button>
    );
  };

  return (
    <div className={styles.fileTree}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Files</span>
        <button
          type="button"
          className={styles.sectionAction}
          aria-label="New file"
          onClick={addFile}
        >
          <PlusOutlined />
        </button>
      </div>
      {tree.map((n) => renderNode(n, 0))}
    </div>
  );
}

function ModulesPanel({ kind }: { kind: ArtifactKind }) {
  const [items, setItems] = useState<
    Array<{ sku: string; name: string; bus: string; voltage: string }>
  >([]);
  const [compat, setCompat] = useState<string | null>(null);
  const boardSku = useWorkspaceStore((s) => s.boardSku);

  useEffect(() => {
    if (!isHardwareKind(kind)) return;
    void api
      .listHardwareModules(boardSku ?? undefined)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, [kind, boardSku]);

  if (!isHardwareKind(kind)) {
    return (
      <div className={styles.mutedPad}>
        Modules for this kind are edited as project files. Open Files to continue.
      </div>
    );
  }

  const check = async (sku: string) => {
    if (!boardSku) return;
    try {
      const res = await api.checkHardwareCompat(boardSku, [sku]);
      setCompat(res.ok ? `${sku} compatible` : res.issues.map((i) => i.message).join("; "));
    } catch (err) {
      setCompat(err instanceof Error ? err.message : "Compatibility check failed");
    }
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Catalog {boardSku ? `· ${boardSku}` : ""}</span>
      </div>
      {compat && <p className={styles.compatNote}>{compat}</p>}
      <div className={styles.modulesGrid}>
        {items.length === 0 ? (
          <p className={styles.mutedPad}>Sign in to load ESP32 / STM32 modules.</p>
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
      <div className={styles.sectionTitle}>Mission</div>
      <strong>{studioMissionTitle(templateId, zh)}</strong>
      <p>
        {zh
          ? "改页面 → 写内容（如有）→ 上线分享给家长，或下载 zip"
          : "Edit the page, add content, then share a live link or download a zip"}
      </p>
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
          <div className={styles.sectionTitle}>Mission</div>
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
  const locale = useLocaleStore((s) => s.locale);
  const zh = locale === "zh-CN";

  return (
    <div className={styles.mutedPad}>
      <div className={styles.sectionTitle}>{zh ? "上架清单" : "Ship checklist"}</div>
      <ol className={styles.checklist}>
        <li>{zh ? "固件仿真断言通过" : "Firmware sim assertions pass"}</li>
        <li>{zh ? "BOM / ERC / DFM（规则引擎）" : "BOM / ERC / DFM (rule engine)"}</li>
        <li>{zh ? "导出 KiCad / Gerber 包" : "Export KiCad / Gerber pack"}</li>
        <li>{zh ? "报价或供应商深链" : "Quote or vendor deeplink"}</li>
        <li>
          {zh ? "上架包 — 人工审核前不可售卖" : "Launch Pack — not ready-to-sell until review"}
        </li>
      </ol>
      {artifactId && features.showLaunchNav ? (
        <button
          type="button"
          className={styles.launchLink}
          onClick={() => navigate(`/launch/${artifactId}`)}
        >
          {zh ? "打开发布台" : "Open launch desk"}
        </button>
      ) : (
        <p>
          {zh ? "请先保存作品后再进入制造流程。" : "Save the project first to open manufacturing."}
        </p>
      )}
    </div>
  );
}

function AssetsDrawerBody() {
  const kind = useWorkspaceStore((s) => s.artifactKind);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const activeTab = useWorkspaceStore((s) => s.activeLeftTab);
  const setActiveLeftTab = useWorkspaceStore((s) => s.setActiveLeftTab);
  const locale = useLocaleStore((s) => s.locale);
  const tabs = getActivityTabs(kind, locale, isAppStudioKind(kind, templateId));
  const resolvedTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0].id;

  return (
    <aside className={styles.leftPanel}>
      <div className={styles.drawerHead}>
        <span className={styles.drawerTitle}>Context</span>
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
          {resolvedTab === "files" && <FileTree />}
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
