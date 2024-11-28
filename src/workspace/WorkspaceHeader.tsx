import {
  ApiOutlined,
  CaretRightOutlined,
  CheckOutlined,
  CodeOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  HomeOutlined,
  MobileOutlined,
  ReloadOutlined,
  RobotOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Segmented, Tooltip, message, type MenuProps } from "antd";
import { type ReactNode, useState } from "react";
import { LayoutIcon } from "../components/LayoutIcon";
import { LogoMark } from "../components/Logo";
import { ModeSwitchModal } from "../components/ModeSwitchModal";
import { useAiSettings } from "../hooks/useAiSettings";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";
import { isDirectIdpEnabled } from "../lib/idp";
import { navigate } from "../lib/navigate";
import { type EditorMode, useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind } from "../types/artifact";
import {
  KIND_COLOR,
  KIND_DEFAULT_PREVIEW,
  KIND_LABEL,
  PREVIEW_LABEL,
  isConsoleKind,
  isHomeSimKind,
  isTargetBlockKind,
} from "../types/artifact";
import styles from "./WorkspaceHeader.module.scss";

const KIND_ICON: Record<ArtifactKind, ReactNode> = {
  web: <GlobalOutlined />,
  miniprogram: <MobileOutlined />,
  smarthome: <HomeOutlined />,
  iot: <ApiOutlined />,
  toy: <RobotOutlined />,
  free: <ExperimentOutlined />,
  exercise: <CodeOutlined />,
};

interface WorkspaceHeaderProps {
  isRunning: boolean;
  onRun: () => void;
}

export function WorkspaceHeader({ isRunning, onRun }: WorkspaceHeaderProps) {
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const artifactName = useWorkspaceStore((s) => s.artifactName);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const editorMode = useWorkspaceStore((s) => s.editorMode);
  const code = useWorkspaceStore((s) => s.code);
  const blockXml = useWorkspaceStore((s) => s.blockXml);
  const monacoManuallyEdited = useWorkspaceStore((s) => s.monacoManuallyEdited);
  const saveDirty = useWorkspaceStore((s) => s.saveDirty);
  const saveStatus = useWorkspaceStore((s) => s.saveStatus);
  const saveCurrentArtifact = useWorkspaceStore((s) => s.saveCurrentArtifact);
  const leftOpen = useWorkspaceStore((s) => s.leftOpen);
  const rightPreviewOpen = useWorkspaceStore((s) => s.rightPreviewOpen);
  const bottomOpen = useWorkspaceStore((s) => s.bottomOpen);
  const aiOpen = useWorkspaceStore((s) => s.aiOpen);
  const toggleLeftOpen = useWorkspaceStore((s) => s.toggleLeftOpen);
  const toggleRightPreviewOpen = useWorkspaceStore((s) => s.toggleRightPreviewOpen);
  const toggleBottomOpen = useWorkspaceStore((s) => s.toggleBottomOpen);
  const toggleAiOpen = useWorkspaceStore((s) => s.toggleAiOpen);
  const setEditorMode = useWorkspaceStore((s) => s.setEditorMode);
  const applyProUpgrade = useWorkspaceStore((s) => s.applyProUpgrade);
  const restoreBlocklyFromSnapshot = useWorkspaceStore((s) => s.restoreBlocklyFromSnapshot);
  const getCurrentGoal = useWorkspaceStore((s) => s.getCurrentGoal);
  const getActiveLanguagePlugin = useWorkspaceStore((s) => s.getActiveLanguagePlugin);
  const addAiMessage = useWorkspaceStore((s) => s.addAiMessage);
  const setAiLoading = useWorkspaceStore((s) => s.setAiLoading);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  const { aiOpts, ready } = useAiSettings();

  const [modeModal, setModeModal] = useState<"upgrade" | "restore" | null>(null);
  const [busy, setBusy] = useState(false);

  const color = KIND_COLOR[artifactKind];
  const previewSupported = !isConsoleKind(artifactKind);
  const isSimKind = isHomeSimKind(artifactKind) || artifactKind === "toy";
  const runLabel = isSimKind
    ? "仿真运行"
    : PREVIEW_LABEL[KIND_DEFAULT_PREVIEW[artifactKind]];
  const plugin = getActiveLanguagePlugin();
  const supportsBlockly = isTargetBlockKind(artifactKind) || Boolean(plugin?.blockly);

  const goLogin = () => {
    if (isDirectIdpEnabled()) {
      window.location.href = "/login";
      return;
    }
    openLoginPrompt();
  };

  const handleSave = async () => {
    if (!user) {
      goLogin();
      return;
    }
    if (!artifactId) {
      message.warning("请先新建作品（云端会自动创建）");
      return;
    }
    const ok = await saveCurrentArtifact();
    if (ok) message.success("已保存到云端");
    else message.error("保存失败，请确认已登录且有权限");
  };

  const requestModeChange = (mode: EditorMode) => {
    if (mode === editorMode) return;
    if (mode === "monaco") {
      if (isTargetBlockKind(artifactKind)) {
        setEditorMode("monaco");
        return;
      }
      setModeModal("upgrade");
      return;
    }
    // → blockly
    if (monacoManuallyEdited) {
      setModeModal("restore");
      return;
    }
    restoreBlocklyFromSnapshot();
  };

  const confirmUpgrade = async () => {
    if (!user) {
      goLogin();
      return;
    }
    if (!ready) {
      setEditorMode("monaco");
      setModeModal(null);
      return;
    }
    setBusy(true);
    setAiLoading(true);
    try {
      const res = await api.aiUpgradePro({
        ...aiOpts,
        kind: artifactKind,
        ...(artifactId ? { artifactId } : {}),
        code,
        blockXml,
        goal: getCurrentGoal(),
      });
      applyProUpgrade(res.code, blockXml);
      addAiMessage({
        role: "assistant",
        content: `**已进入专业模式**\n${res.explanation}${res.mock ? "\n\n_(Mock)_" : ""}`,
      });
      setModeModal(null);
    } catch {
      setEditorMode("monaco");
      setModeModal(null);
    } finally {
      setBusy(false);
      setAiLoading(false);
    }
  };

  const confirmRestore = () => {
    restoreBlocklyFromSnapshot();
    addAiMessage({
      role: "assistant",
      content: "已恢复积木快照。专业模式下的手改代码未保留到积木中。",
    });
    setModeModal(null);
  };

  const layoutItems: MenuProps["items"] = [
    {
      key: "assets",
      label: (
        <span className={styles.layoutItem}>
          <LayoutIcon showLeft inMenu />
          <span>资源</span>
          {leftOpen && <CheckOutlined className={styles.layoutCheck} />}
        </span>
      ),
      onClick: () => toggleLeftOpen(),
    },
    {
      key: "preview",
      disabled: !previewSupported,
      label: (
        <span className={styles.layoutItem}>
          <LayoutIcon showPreview inMenu />
          <span>预览</span>
          {rightPreviewOpen && previewSupported && (
            <CheckOutlined className={styles.layoutCheck} />
          )}
        </span>
      ),
      onClick: () => previewSupported && toggleRightPreviewOpen(),
    },
    {
      key: "console",
      label: (
        <span className={styles.layoutItem}>
          <LayoutIcon showConsole inMenu />
          <span>控制台</span>
          {bottomOpen && <CheckOutlined className={styles.layoutCheck} />}
        </span>
      ),
      onClick: () => toggleBottomOpen(),
    },
    {
      key: "ai",
      label: (
        <span className={styles.layoutItem}>
          <LayoutIcon showAi inMenu />
          <span>AI</span>
          {aiOpen && <CheckOutlined className={styles.layoutCheck} />}
        </span>
      ),
      onClick: () => toggleAiOpen(),
    },
  ];

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Tooltip title="返回项目">
            <button
              type="button"
              className={styles.hubBtn}
              onClick={() => navigate("/")}
              aria-label="返回项目"
            >
              <LogoMark size={22} />
              <span className={styles.hubLabel}>项目</span>
            </button>
          </Tooltip>
          <div className={styles.artifactInfo}>
            <span className={styles.artifactName}>
              {artifactName}
              {saveDirty ? " ·" : ""}
            </span>
            <span
              className={styles.kindChip}
              style={{ color, borderColor: `${color}40`, background: `${color}18` }}
            >
              {KIND_ICON[artifactKind]}
              <span>{KIND_LABEL[artifactKind]}</span>
            </span>
          </div>
        </div>

        <div className={styles.headerCenter}>
          {supportsBlockly && (
            <Segmented
              size="small"
              value={editorMode}
              onChange={(v) => requestModeChange(v as EditorMode)}
              options={[
                { label: "积木模式", value: "blockly" },
                { label: "专业模式", value: "monaco" },
              ]}
            />
          )}
        </div>

        <div className={styles.headerRight}>
          <Tooltip
            title={
              !user
                ? "登录后可保存到云端"
                : saveStatus === "saved" && !saveDirty
                  ? "已保存"
                  : "保存积木与代码到作品草稿"
            }
          >
            <Button
              type={saveDirty ? "primary" : "default"}
              size="small"
              icon={<SaveOutlined />}
              loading={saveStatus === "saving"}
              onClick={() => void handleSave()}
            >
              {saveDirty ? "保存" : "已保存"}
            </Button>
          </Tooltip>

          {(isSimKind || isConsoleKind(artifactKind)) && (
            <Button
              type="primary"
              size="small"
              icon={isRunning ? <ReloadOutlined spin /> : <CaretRightOutlined />}
              className={styles.runBtn}
              onClick={onRun}
              loading={isRunning}
            >
              {runLabel}
            </Button>
          )}

          {(artifactKind === "web" || artifactKind === "miniprogram") && (
            <Button
              size="small"
              icon={isRunning ? <ReloadOutlined spin /> : <CaretRightOutlined />}
              onClick={onRun}
              loading={isRunning}
            >
              作品预览
            </Button>
          )}

          <Dropdown menu={{ items: layoutItems }} trigger={["click"]} placement="bottomRight">
            <button type="button" className={styles.layoutBtn} title="面板布局">
              <LayoutIcon
                showLeft={leftOpen}
                showPreview={rightPreviewOpen && previewSupported}
                showConsole={bottomOpen}
                showAi={aiOpen}
              />
              <span>布局</span>
            </button>
          </Dropdown>

          {user ? (
            <>
              <span className={styles.authLabel}>{user.name}</span>
              <button type="button" className={styles.authBtn} onClick={logout}>
                退出
              </button>
            </>
          ) : (
            <button type="button" className={styles.authBtn} onClick={goLogin}>
              登录
            </button>
          )}
        </div>
      </header>

      {modeModal === "upgrade" && (
        <ModeSwitchModal
          title="切换到专业模式"
          tone="info"
          confirmLabel={busy ? "处理中…" : "进入专业模式"}
          disabled={busy}
          onConfirm={() => void confirmUpgrade()}
          onCancel={() => setModeModal(null)}
        >
          <p>将使用 AI 整理当前积木为可编辑代码（若 AI 不可用则直接进入代码编辑器）。</p>
        </ModeSwitchModal>
      )}

      {modeModal === "restore" && (
        <ModeSwitchModal
          title="回到积木模式？"
          tone="warn"
          confirmLabel="恢复积木"
          onConfirm={confirmRestore}
          onCancel={() => setModeModal(null)}
        >
          <p>
            专业模式下的手改代码不会同步回积木。确认后将恢复进入专业模式前的积木快照。
          </p>
        </ModeSwitchModal>
      )}
    </>
  );
}
