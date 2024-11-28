import {
  AppstoreOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CloseOutlined,
  FileOutlined,
  FileTextOutlined,
  FolderOutlined,
  Html5Outlined,
  PictureOutlined,
  PlusOutlined,
  ReadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { FloatButton, Tooltip } from "antd";
import { type ReactNode, useState } from "react";
import { LessonPanel } from "../components/LessonPanel";
import { ProjectPanel } from "../components/ProjectPanel";
import { useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind, LeftPanelTab } from "../types/artifact";
import { isConsoleKind } from "../types/artifact";
import styles from "./AssetsPanel.module.scss";

type TreeNode = {
  name: string;
  icon: ReactNode;
  children?: { name: string; icon: ReactNode }[];
};

const FILE_TREES: Record<ArtifactKind, TreeNode[]> = {
  web: [
    {
      name: "src",
      icon: <FolderOutlined />,
      children: [
        { name: "index.html", icon: <Html5Outlined style={{ color: "#e44d26" }} /> },
        { name: "styles.css", icon: <FileOutlined style={{ color: "#2965f1" }} /> },
        { name: "app.js", icon: <FileOutlined style={{ color: "#f7df1e" }} /> },
      ],
    },
    {
      name: "assets",
      icon: <FolderOutlined />,
      children: [{ name: "logo.png", icon: <PictureOutlined style={{ color: "#8b5cf6" }} /> }],
    },
    { name: "README.md", icon: <FileTextOutlined style={{ color: "#6b7280" }} /> },
  ],
  miniprogram: [
    {
      name: "pages",
      icon: <FolderOutlined />,
      children: [
        { name: "index.js", icon: <FileOutlined style={{ color: "#f7df1e" }} /> },
        { name: "index.wxml", icon: <Html5Outlined style={{ color: "#07c160" }} /> },
        { name: "index.wxss", icon: <FileOutlined style={{ color: "#07c160" }} /> },
      ],
    },
    { name: "app.json", icon: <FileOutlined style={{ color: "#94a3b8" }} /> },
    { name: "app.js", icon: <FileOutlined style={{ color: "#f7df1e" }} /> },
  ],
  smarthome: [
    { name: "home.json", icon: <SettingOutlined style={{ color: "#0ea5e9" }} /> },
    {
      name: "rooms",
      icon: <FolderOutlined />,
      children: [
        { name: "livingroom.json", icon: <FileOutlined style={{ color: "#0ea5e9" }} /> },
        { name: "bedroom.json", icon: <FileOutlined style={{ color: "#0ea5e9" }} /> },
      ],
    },
    { name: "scenes.json", icon: <FileOutlined style={{ color: "#38bdf8" }} /> },
    { name: "behavior.blocks", icon: <FileOutlined style={{ color: "#6366f1" }} /> },
  ],
  iot: [
    { name: "home.json", icon: <SettingOutlined style={{ color: "#14b8a6" }} /> },
    { name: "devices.json", icon: <FileOutlined style={{ color: "#14b8a6" }} /> },
    { name: "behavior.blocks", icon: <FileOutlined style={{ color: "#6366f1" }} /> },
  ],
  toy: [
    { name: "toy.json", icon: <SettingOutlined style={{ color: "#d97706" }} /> },
    { name: "ui.dsl.json", icon: <FileOutlined style={{ color: "#d97706" }} /> },
    { name: "behavior.blocks", icon: <FileOutlined style={{ color: "#6366f1" }} /> },
  ],
  free: [
    { name: "main.js", icon: <FileOutlined style={{ color: "#f7df1e" }} /> },
    { name: "helpers.js", icon: <FileOutlined style={{ color: "#94a3b8" }} /> },
  ],
  exercise: [
    { name: "main.js", icon: <FileOutlined style={{ color: "#f7df1e" }} /> },
    { name: "helpers.js", icon: <FileOutlined style={{ color: "#94a3b8" }} /> },
  ],
};

const MODULES: Record<ArtifactKind, { label: string; desc: string; color: string }[]> = {
  web: [
    { label: "导航栏", desc: "Navigation bar", color: "#2563eb" },
    { label: "页面布局", desc: "Page layout grid", color: "#2563eb" },
    { label: "表单", desc: "Form inputs", color: "#7c3aed" },
    { label: "用户登录", desc: "Auth & session", color: "#16a34a" },
  ],
  miniprogram: [
    { label: "页面", desc: "Page component", color: "#07c160" },
    { label: "导航", desc: "Tab bar", color: "#07c160" },
    { label: "弹窗", desc: "Modal & toast", color: "#fa541c" },
  ],
  smarthome: [
    { label: "灯光", desc: "home.setLight", color: "#0ea5e9" },
    { label: "温控", desc: "home.setTemperature", color: "#38bdf8" },
    { label: "传感器", desc: "home.readSensor", color: "#06b6d4" },
    { label: "场景", desc: "home.runScene", color: "#0284c7" },
  ],
  iot: [
    { label: "传感器", desc: "home.readSensor", color: "#14b8a6" },
    { label: "执行器", desc: "home.setDevice", color: "#0d9488" },
    { label: "场景", desc: "home.runScene", color: "#0f766e" },
  ],
  toy: [
    { label: "主控板", desc: "Controller SKU", color: "#d97706" },
    { label: "传感器", desc: "Sensor modules", color: "#d97706" },
    { label: "执行器", desc: "Actuator modules", color: "#f59e0b" },
  ],
  free: [
    { label: "逻辑", desc: "If / loops", color: "#64748b" },
    { label: "数据", desc: "Variables", color: "#94a3b8" },
  ],
  exercise: [
    { label: "逻辑", desc: "If / loops", color: "#d97706" },
    { label: "界面", desc: "DOM", color: "#2563eb" },
    { label: "数据", desc: "Variables", color: "#7c3aed" },
  ],
};

const TEMPLATES: Record<ArtifactKind, string[]> = {
  web: ["落地页", "作品集", "博客", "管理后台"],
  miniprogram: ["资讯小程序", "活动报名", "商城"],
  smarthome: ["灯光场景", "温控联动", "安防演示"],
  iot: ["温湿度监测", "设备联动"],
  toy: ["互动玩具", "传感器演示"],
  free: ["空白项目", "脚本草稿"],
  exercise: ["空白练习", "Hello World", "排序算法"],
};

function getActivityTabs(
  kind: ArtifactKind,
): { id: LeftPanelTab; icon: ReactNode; label: string }[] {
  const base: { id: LeftPanelTab; icon: ReactNode; label: string }[] = [
    { id: "files", icon: <FolderOutlined />, label: "文件" },
    { id: "modules", icon: <AppstoreOutlined />, label: "模组" },
    { id: "templates", icon: <FileTextOutlined />, label: "模板" },
  ];
  if (isConsoleKind(kind)) {
    base.push({ id: "learn", icon: <ReadOutlined />, label: "课程" });
  }
  return base;
}

function FileTree({ kind }: { kind: ArtifactKind }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    src: true,
    pages: true,
    rooms: true,
    assets: true,
  });
  const tree = FILE_TREES[kind];

  return (
    <div className={styles.fileTree}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>文件</span>
        <button type="button" className={styles.sectionAction} aria-label="新建文件">
          <PlusOutlined />
        </button>
      </div>
      {tree.map((node) =>
        node.children ? (
          <div key={node.name}>
            <button
              type="button"
              className={styles.treeFolder}
              onClick={() => setExpanded((p) => ({ ...p, [node.name]: !p[node.name] }))}
            >
              <span className={styles.treeChevron}>
                {expanded[node.name] ? <CaretDownOutlined /> : <CaretRightOutlined />}
              </span>
              <span className={styles.treeIcon}>{node.icon}</span>
              <span className={styles.treeName}>{node.name}</span>
            </button>
            {expanded[node.name] &&
              node.children.map((child) => (
                <button key={child.name} type="button" className={styles.treeFile}>
                  <span className={styles.treeIcon} style={{ marginLeft: 16 }}>
                    {child.icon}
                  </span>
                  <span className={styles.treeName}>{child.name}</span>
                </button>
              ))}
          </div>
        ) : (
          <button key={node.name} type="button" className={styles.treeFile}>
            <span className={styles.treeIcon} style={{ marginLeft: 16 }}>
              {node.icon}
            </span>
            <span className={styles.treeName}>{node.name}</span>
          </button>
        ),
      )}
    </div>
  );
}

function ModulesPanel({ kind }: { kind: ArtifactKind }) {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>可用模组</span>
      </div>
      <div className={styles.modulesGrid}>
        {MODULES[kind].map((m) => (
          <button
            key={m.label}
            type="button"
            className={styles.moduleCard}
            style={{ borderLeftColor: m.color }}
          >
            <span className={styles.moduleLabel}>{m.label}</span>
            <span className={styles.moduleDesc}>{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TemplatesPanel({ kind }: { kind: ArtifactKind }) {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>模板</span>
      </div>
      <div className={styles.templateList}>
        {TEMPLATES[kind].map((t) => (
          <button key={t} type="button" className={styles.templateItem}>
            <FileTextOutlined />
            <span>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LearnPanel() {
  return (
    <div className={styles.learnStack}>
      <div className={styles.learnSection}>
        <LessonPanel />
      </div>
      <div className={styles.learnSection}>
        <ProjectPanel />
      </div>
    </div>
  );
}

function AssetsDrawerBody() {
  const kind = useWorkspaceStore((s) => s.artifactKind);
  const activeTab = useWorkspaceStore((s) => s.activeLeftTab);
  const setActiveLeftTab = useWorkspaceStore((s) => s.setActiveLeftTab);
  const setLeftOpen = useWorkspaceStore((s) => s.setLeftOpen);
  const tabs = getActivityTabs(kind);
  const resolvedTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0].id;

  return (
    <aside className={styles.leftPanel}>
      <div className={styles.drawerHead}>
        <span className={styles.drawerTitle}>资源</span>
        <button
          type="button"
          className={styles.drawerClose}
          aria-label="关闭资源面板"
          onClick={() => setLeftOpen(false)}
        >
          <CloseOutlined />
        </button>
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
          {resolvedTab === "files" && <FileTree kind={kind} />}
          {resolvedTab === "modules" && <ModulesPanel kind={kind} />}
          {resolvedTab === "templates" && <TemplatesPanel kind={kind} />}
          {resolvedTab === "learn" && <LearnPanel />}
        </div>
      </div>
    </aside>
  );
}

/** Floating assets entry: collapsed = FloatButton; expanded = overlay drawer. */
export function AssetsPanel() {
  const leftOpen = useWorkspaceStore((s) => s.leftOpen);
  const setLeftOpen = useWorkspaceStore((s) => s.setLeftOpen);

  return (
    <>
      {!leftOpen && (
        <FloatButton
          icon={<FolderOutlined />}
          tooltip="资源面板"
          onClick={() => setLeftOpen(true)}
          style={{ left: 24, bottom: 24 }}
        />
      )}
      {leftOpen && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="关闭资源面板"
            onClick={() => setLeftOpen(false)}
          />
          <div className={styles.overlay}>
            <AssetsDrawerBody />
          </div>
        </>
      )}
    </>
  );
}
