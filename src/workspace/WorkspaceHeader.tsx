import {
  ApiOutlined,
  ArrowLeftOutlined,
  CaretRightOutlined,
  CheckOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  EllipsisOutlined,
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
import { type ReactNode, useEffect, useRef, useState } from "react";
import { LanguageSelector } from "../components/LanguageSelector";
import { LayoutIcon } from "../components/LayoutIcon";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { ModeSwitchModal } from "../components/ModeSwitchModal";
import { RunControls } from "../components/RunControls";
import { UserAvatarMenu } from "../components/UserAvatarMenu";
import { useAiSettings } from "../hooks/useAiSettings";
import { api } from "../lib/api";
import { usesHostedPosts } from "../lib/app-studio/app-schema";
import { useAuthStore } from "../lib/auth-store";
import { t } from "../lib/i18n";
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
  const ensureSignedIn = useAuthStore((s) => s.ensureSignedIn);
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
  const saveState = artifactId == null ? "local" : saveDirty ? "unsaved" : "saved";
  const saveStateLabel =
    saveState === "local"
      ? t("workspace.localDraft")
      : saveState === "unsaved"
        ? t("workspace.unsaved")
        : t("workspace.saved");
  const saveButtonLabel = saveDirty ? t("workspace.save") : t("workspace.saved");

  const goLogin = () => {
    openLoginPrompt();
  };

  const handleSave = async () => {
    if (!useAuthStore.getState().user) {
      message.info(t("workspace.loginToSave"));
      const signedIn = await ensureSignedIn();
      if (!signedIn) return;
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

  const showRun = isSimKind || hardware;
  const showPreview = canPublishWeb && !appStudio;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Tooltip title={t("layout.back")}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => navigate("/")}
              aria-label={t("layout.back")}
            >
              <ArrowLeftOutlined />
            </button>
          </Tooltip>
          <div className={styles.titleWrap}>
            <ArtifactTitle name={artifactName} />
          </div>
          <span className={styles.kindChip} style={{ ["--kind" as string]: color }}>
            {KIND_ICON[artifactKind]}
            <span>{kindLabel(artifactKind)}</span>
          </span>
          <span
            className={`${styles.saveStatus} ${
              saveState === "local"
                ? styles.saveLocal
                : saveState === "unsaved"
                  ? styles.saveUnsaved
                  : styles.saveSaved
            }`}
          >
            {saveStateLabel}
          </span>
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
          {showRun && (
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

          {showPreview && (
            <Button
              type="primary"
              size="small"
              icon={isRunning ? <ReloadOutlined spin /> : <CaretRightOutlined />}
              onClick={onRun}
              loading={isRunning}
            >
              {t("preview.artifact")}
            </Button>
          )}

          <Tooltip title={saveDirty ? t("workspace.saveHint") : t("workspace.saved")}>
            <Button
              type={saveDirty ? "primary" : "default"}
              size="small"
              icon={<SaveOutlined />}
              loading={saveStatus === "saving"}
              aria-label={saveButtonLabel}
              onClick={() => void handleSave()}
            >
              <span className={styles.optionalLabel}>{saveButtonLabel}</span>
            </Button>
          </Tooltip>

          <Dropdown menu={{ items: layoutItems }} trigger={["click"]} placement="bottomRight">
            <Tooltip title={t("layout.panels")}>
              <button type="button" className={styles.layoutBtn} aria-label={t("layout.panels")}>
                <LayoutIcon
                  showLeft={leftOpen}
                  showPreview={rightPreviewOpen && previewSupported}
                  showConsole={bottomOpen}
                  showAi={aiOpen}
                />
                <span className={styles.optionalLabel}>{t("layout.menu")}</span>
              </button>
            </Tooltip>
          </Dropdown>

          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            popupRender={() => (
              <div className={styles.morePanel}>
                {isConsoleKind(artifactKind) ? <LanguageSelector /> : null}
                {canPublishWeb ? (
                  <button
                    type="button"
                    className={styles.moreItem}
                    onClick={() => setPublishOpen(true)}
                  >
                    <CloudUploadOutlined />
                    {t("publish.ship")}
                  </button>
                ) : null}
                {hardware && artifactId ? (
                  <button
                    type="button"
                    className={styles.moreItem}
                    title={t("launch.hint")}
                    onClick={() => navigate(`/launch/${artifactId}`)}
                  >
                    <RocketOutlined />
                    {t("launch.desk")}
                  </button>
                ) : null}
                <div className={styles.moreLocale}>
                  <span>{t("locale.switcherTitle")}</span>
                  <LocaleSwitcher />
                </div>
              </div>
            )}
          >
            <Tooltip title={t("workspace.more")}>
              <button type="button" className={styles.moreBtn} aria-label={t("workspace.more")}>
                <EllipsisOutlined />
                <span className={styles.optionalLabel}>{t("workspace.more")}</span>
              </button>
            </Tooltip>
          </Dropdown>

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

function ArtifactTitle({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [editing, name]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    if (cancelRef.current) {
      cancelRef.current = false;
      setDraft(name);
      return;
    }
    const next = draft.trim();
    setEditing(false);
    if (!next || next === name) return;
    useWorkspaceStore.setState({
      artifactName: next,
      projectName: next,
      saveDirty: true,
    });
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={styles.titleInput}
        value={draft}
        aria-label={t("workspace.rename")}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            cancelRef.current = true;
            setEditing(false);
            event.currentTarget.blur();
          }
        }}
      />
    );
  }

  return (
    <button type="button" className={styles.titleBtn} title={name} onClick={() => setEditing(true)}>
      {name}
    </button>
  );
}
