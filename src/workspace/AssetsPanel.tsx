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
import { navigate } from "../lib/navigate";
import { PAIR_PHASE_LABEL } from "../lib/pair-mission";
import { profileFeatures } from "../lib/product-profile";
import { useWorkspaceStore } from "../stores/workspace";
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
): { id: LeftPanelTab; icon: ReactNode; label: string }[] {
  const base: { id: LeftPanelTab; icon: ReactNode; label: string }[] = [
    { id: "files", icon: <FolderOutlined />, label: "Files" },
  ];
  if (isHardwareKind(kind) || kind === "smarthome" || kind === "toy") {
    base.push({ id: "modules", icon: <AppstoreOutlined />, label: "Modules" });
  }
  if (isConsoleKind(kind)) {
    base.push({ id: "learn", icon: <ReadOutlined />, label: "Learn" });
  }
  if (isHardwareKind(kind) && profileFeatures().showLaunchNav) {
    base.push({ id: "launch", icon: <RocketOutlined />, label: "Launch" });
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

function LearnPanel() {
  const pairMission = useWorkspaceStore((s) => s.pairMission);
  const kind = useWorkspaceStore((s) => s.artifactKind);

  return (
    <div className={styles.learnStack}>
      {(kind === "free" || kind === "exercise") && (
        <div className={styles.missionCard}>
          <div className={styles.sectionTitle}>Mission</div>
          <strong>{pairMission.title}</strong>
          <p>{pairMission.success}</p>
          <span className={styles.phaseChip}>{PAIR_PHASE_LABEL[pairMission.phase]}</span>
        </div>
      )}
      <div className={styles.learnSection}>
        <LessonPanel />
      </div>
      <div className={styles.learnSection}>
        <ProjectPanel />
      </div>
    </div>
  );
}

function LaunchChecklist() {
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const features = profileFeatures();

  return (
    <div className={styles.mutedPad}>
      <div className={styles.sectionTitle}>Ship checklist</div>
      <ol className={styles.checklist}>
        <li>Firmware sim assertions pass</li>
        <li>BOM / ERC / DFM (rule engine)</li>
        <li>Export KiCad / Gerber pack</li>
        <li>Quote or vendor deeplink</li>
        <li>Launch Pack — not ready-to-sell until review</li>
      </ol>
      {artifactId && features.showLaunchNav ? (
        <button
          type="button"
          className={styles.launchLink}
          onClick={() => navigate(`/launch/${artifactId}`)}
        >
          Open Launch desk
        </button>
      ) : (
        <p>Save the project first to open manufacturing.</p>
      )}
    </div>
  );
}

function AssetsDrawerBody() {
  const kind = useWorkspaceStore((s) => s.artifactKind);
  const activeTab = useWorkspaceStore((s) => s.activeLeftTab);
  const setActiveLeftTab = useWorkspaceStore((s) => s.setActiveLeftTab);
  const tabs = getActivityTabs(kind);
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
