import {
  ApiOutlined,
  CaretRightOutlined,
  CheckOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  HomeOutlined,
  MobileOutlined,
  ReloadOutlined,
  RobotOutlined,
  RocketOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, type MenuProps, message, Segmented, Tooltip } from "antd";
import { type ReactNode, useState } from "react";
import { LanguageSelector } from "../components/LanguageSelector";
import { LayoutIcon } from "../components/LayoutIcon";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { LogoMark } from "../components/Logo";
import { ModeSwitchModal } from "../components/ModeSwitchModal";
import { RunControls } from "../components/RunControls";
import { UserAvatarMenu } from "../components/UserAvatarMenu";
import { useAiSettings } from "../hooks/useAiSettings";
import { api } from "../lib/api";
import { usesHostedPosts } from "../lib/app-studio/app-schema";
import { useAuthStore } from "../lib/auth-store";
import { t } from "../lib/i18n";
import { isDirectIdpEnabled } from "../lib/idp";
import { kindLabel } from "../lib/kind-label";
import { useLocaleStore } from "../lib/locale-store";
import { navigate } from "../lib/navigate";
import {
  type EditorMode,
  isAppStudioKind,
  type SurfaceMode,
  useWorkspaceStore,
} from "../stores/workspace";
import type { ArtifactKind } from "../types/artifact";
import {
  isConsoleKind,
  isHardwareKind,
  isHomeSimKind,
  isTargetBlockKind,
  KIND_COLOR,
} from "../types/artifact";
import { PublishWebDialog } from "./PublishWebDialog";
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
  const templateId = useWorkspaceStore((s) => s.templateId);
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
  const surfaceMode = useWorkspaceStore((s) => s.surfaceMode);
  const setSurfaceMode = useWorkspaceStore((s) => s.setSurfaceMode);
  const applyProUpgrade = useWorkspaceStore((s) => s.applyProUpgrade);
  const restoreBlocklyFromSnapshot = useWorkspaceStore((s) => s.restoreBlocklyFromSnapshot);
  const getCurrentGoal = useWorkspaceStore((s) => s.getCurrentGoal);
  const getActiveLanguagePlugin = useWorkspaceStore((s) => s.getActiveLanguagePlugin);
  const addAiMessage = useWorkspaceStore((s) => s.addAiMessage);
  const setAiLoading = useWorkspaceStore((s) => s.setAiLoading);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  useLocaleStore((s) => s.locale);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  const { aiOpts, ready } = useAiSettings();

  const [modeModal, setModeModal] = useState<"upgrade" | "restore" | "backDesign" | null>(null);
  const [pendingSurface, setPendingSurface] = useState<SurfaceMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const appStudio = isAppStudioKind(artifactKind, templateId);
  const showDataTab = usesHostedPosts(templateId);
  const canPublishWeb = artifactKind === "web" || artifactKind === "miniprogram";

  const color = KIND_COLOR[artifactKind];
  const previewSupported = !isConsoleKind(artifactKind);
  const hardware = isHardwareKind(artifactKind);
  const isSimKind = isHomeSimKind(artifactKind) || artifactKind === "toy";
  const runLabel = hardware ? t("run.firmware") : isSimKind ? t("run.sim") : t("preview.artifact");
  const plugin = getActiveLanguagePlugin();
  const supportsBlockly =
    !appStudio &&
    !isHardwareKind(artifactKind) &&
    (isTargetBlockKind(artifactKind) || Boolean(plugin?.blockly));

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
      message.warning(t("workspace.saveNeedArtifact"));
      return;
    }
    const ok = await saveCurrentArtifact();
    if (ok) message.success(t("workspace.saveOk"));
    else message.error(t("workspace.saveFailed"));
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

  const requestSurfaceChange = (next: SurfaceMode) => {
    if (next === surfaceMode) return;
    if (surfaceMode === "code" && next !== "code") {
      setPendingSurface(next);
      setModeModal("backDesign");
      return;
    }
    setSurfaceMode(next);
  };

  const confirmBackDesign = () => {
    if (pendingSurface) setSurfaceMode(pendingSurface);
    setPendingSurface(null);
    setModeModal(null);
  };

  const cancelModeModal = () => {
    setPendingSurface(null);
    setModeModal(null);
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
        content: t("ai.upgraded", {
          explanation: `${res.explanation}${res.mock ? "\n\n_(Mock)_" : ""}`,
        }),
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
      content: t("ai.restored"),
    });
    setModeModal(null);
  };

  const layoutItems: MenuProps["items"] = [
    {
      key: "assets",
      label: (
        <span className={styles.layoutItem}>
          <LayoutIcon showLeft inMenu />
          <span>{t("layout.assets")}</span>
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
          <span>{t("layout.preview")}</span>
          {rightPreviewOpen && previewSupported && <CheckOutlined className={styles.layoutCheck} />}
        </span>
      ),
      onClick: () => previewSupported && toggleRightPreviewOpen(),
    },
    {
      key: "console",
      label: (
        <span className={styles.layoutItem}>
          <LayoutIcon showConsole inMenu />
          <span>{t("layout.console")}</span>
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
          <span>{t("layout.ai")}</span>
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
          <Tooltip title={t("layout.back")}>
            <button
              type="button"
              className={styles.hubBtn}
              onClick={() => navigate("/")}
              aria-label={t("layout.back")}
            >
              <LogoMark size={22} />
              <span className={styles.hubLabel}>{t("layout.hub")}</span>
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
              <span>{kindLabel(artifactKind)}</span>
            </span>
          </div>
        </div>

        <div className={styles.headerCenter}>
          {appStudio && (
            <Segmented
              size="small"
              value={surfaceMode}
              onChange={(v) => requestSurfaceChange(v as SurfaceMode)}
              options={[
                { label: "Design", value: "design" },
                ...(showDataTab ? [{ label: "Data", value: "data" }] : []),
                { label: "Logic", value: "logic" },
                { label: "Code", value: "code" },
              ]}
            />
          )}
          {supportsBlockly && (
            <Segmented
              size="small"
              value={editorMode}
              onChange={(v) => requestModeChange(v as EditorMode)}
              options={[
                { label: t("editor.blockly"), value: "blockly" },
                { label: t("editor.monaco"), value: "monaco" },
              ]}
            />
          )}
        </div>

        <div className={styles.headerRight}>
          <Tooltip
            title={
              !user
                ? t("workspace.saveHintLogin")
                : saveStatus === "saved" && !saveDirty
                  ? t("workspace.saved")
                  : t("workspace.saveHint")
            }
          >
            <Button
              type={saveDirty ? "primary" : "default"}
              size="small"
              icon={<SaveOutlined />}
              loading={saveStatus === "saving"}
              onClick={() => void handleSave()}
            >
              {saveDirty ? t("workspace.save") : t("workspace.saved")}
            </Button>
          </Tooltip>

          {(isSimKind || hardware) && (
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

          {isConsoleKind(artifactKind) && <RunControls />}
          {isConsoleKind(artifactKind) && <LanguageSelector />}

          {hardware && artifactId && (
            <Tooltip title={t("launch.hint")}>
              <Button
                size="small"
                icon={<RocketOutlined />}
                onClick={() => navigate(`/launch/${artifactId}`)}
              >
                {t("launch.desk")}
              </Button>
            </Tooltip>
          )}

          {canPublishWeb && (
            <Button
              type="primary"
              size="small"
              icon={<CloudUploadOutlined />}
              onClick={() => setPublishOpen(true)}
            >
              {t("publish.ship")}
            </Button>
          )}

          {canPublishWeb && !appStudio && (
            <Button
              size="small"
              icon={isRunning ? <ReloadOutlined spin /> : <CaretRightOutlined />}
              onClick={onRun}
              loading={isRunning}
            >
              {t("preview.artifact")}
            </Button>
          )}

          <Dropdown menu={{ items: layoutItems }} trigger={["click"]} placement="bottomRight">
            <button type="button" className={styles.layoutBtn} title={t("layout.panels")}>
              <LayoutIcon
                showLeft={leftOpen}
                showPreview={rightPreviewOpen && previewSupported}
                showConsole={bottomOpen}
                showAi={aiOpen}
              />
              <span>{t("layout.menu")}</span>
            </button>
          </Dropdown>

          <LocaleSwitcher />
          {user ? (
            <UserAvatarMenu user={user} onLogout={logout} />
          ) : (
            <button type="button" className={styles.authBtn} onClick={goLogin}>
              {t("auth.signIn")}
            </button>
          )}
        </div>
      </header>

      {modeModal === "upgrade" && (
        <ModeSwitchModal
          title={t("editor.upgradeTitle")}
          tone="info"
          confirmLabel={busy ? t("editor.upgradeBusy") : t("editor.upgradeConfirm")}
          disabled={busy}
          onConfirm={() => void confirmUpgrade()}
          onCancel={cancelModeModal}
        >
          <p>{t("editor.upgradeBody")}</p>
        </ModeSwitchModal>
      )}

      {modeModal === "restore" && (
        <ModeSwitchModal
          title={t("editor.restoreTitle")}
          tone="warn"
          confirmLabel={t("editor.restoreConfirm")}
          onConfirm={confirmRestore}
          onCancel={cancelModeModal}
        >
          <p>{t("editor.restoreBody")}</p>
        </ModeSwitchModal>
      )}

      {modeModal === "backDesign" && (
        <ModeSwitchModal
          title={t("surface.backDesignTitle")}
          tone="warn"
          confirmLabel={t("surface.backDesignConfirm")}
          onConfirm={confirmBackDesign}
          onCancel={cancelModeModal}
        >
          <p>{t("surface.backDesignBody")}</p>
        </ModeSwitchModal>
      )}
      {canPublishWeb && (
        <PublishWebDialog open={publishOpen} onClose={() => setPublishOpen(false)} />
      )}
    </>
  );
}
