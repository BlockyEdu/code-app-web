import { Alert, App as AntdApp, Button, ConfigProvider, Spin } from "antd";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { siteAntdTheme } from "../lib/antd-site-theme";
import { useAuthStore } from "../lib/auth-store";
import { requireLoginOnEntry } from "../lib/deploy-profile";
import { t } from "../lib/i18n";
import { rememberPostLoginPath } from "../lib/idp";
import { useLocaleStore } from "../lib/locale-store";
import { navigate } from "../lib/navigate";
import { openOfficialSample } from "../lib/open-sample";
import { useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind } from "../types/artifact";
import { NewProjectDialog } from "../workspace/NewProjectDialog";
import styles from "./SiteShell.module.scss";

type SiteActions = {
  openCreate: (kind?: ArtifactKind, name?: string, intent?: string) => void;
  openSample: (slug: string, aiPrompt?: string) => void;
};

const SiteActionsContext = createContext<SiteActions | null>(null);

export function useSiteActions(): SiteActions {
  const actions = useContext(SiteActionsContext);
  if (!actions) {
    throw new Error("useSiteActions requires SiteShell");
  }
  return actions;
}

interface SiteShellProps {
  trial?: boolean;
  children: ReactNode;
}

export function SiteShell({ trial = false, children }: SiteShellProps) {
  const antdLocale = useLocaleStore((s) => s.antdLocale);
  return (
    <ConfigProvider locale={antdLocale} theme={siteAntdTheme}>
      <AntdApp>
        <SiteShellInner trial={trial}>{children}</SiteShellInner>
      </AntdApp>
    </ConfigProvider>
  );
}

function SiteShellInner({ trial = false, children }: SiteShellProps) {
  const { message } = AntdApp.useApp();
  const user = useAuthStore((s) => s.user);
  const authInitialized = useAuthStore((s) => s.initialized);
  useLocaleStore((s) => s.locale);
  const createNewArtifact = useWorkspaceStore((s) => s.createNewArtifact);
  const setShowNewProjectDialog = useWorkspaceStore((s) => s.setShowNewProjectDialog);
  const showNewProjectDialog = useWorkspaceStore((s) => s.showNewProjectDialog);

  const brandTitle = t("chrome.brandTitle");
  useEffect(() => {
    document.title = brandTitle;
  }, [brandTitle]);

  const [creating, setCreating] = useState(false);
  const [prefillKind, setPrefillKind] = useState<ArtifactKind | null>(null);
  const [prefillName, setPrefillName] = useState("");
  const [prefillIntent, setPrefillIntent] = useState<string | undefined>();
  const trialOpened = useRef(false);

  useEffect(() => {
    if (!authInitialized || user || !requireLoginOnEntry()) return;
    const next = `${window.location.pathname}${window.location.search}`;
    rememberPostLoginPath(next);
    navigate("/login");
  }, [authInitialized, user]);

  const openCreate = (kind?: ArtifactKind, name?: string, intent?: string) => {
    if (!user && requireLoginOnEntry()) {
      rememberPostLoginPath(`${window.location.pathname}${window.location.search}`);
      navigate("/login");
      return;
    }
    setPrefillKind(kind ?? null);
    setPrefillName(name ?? "");
    setPrefillIntent(intent);
    setShowNewProjectDialog(true);
  };

  useEffect(() => {
    if (!trial || !user || trialOpened.current) return;
    trialOpened.current = true;
    setPrefillKind("exercise");
    setPrefillName(t("hub.trialProjectName"));
    setPrefillIntent("learn");
    setShowNewProjectDialog(true);
  }, [setShowNewProjectDialog, trial, user]);

  const handleCreate = async (
    kind: ArtifactKind,
    name: string,
    language: string,
    extras: { templateId: string; intent?: string },
  ) => {
    setCreating(true);
    try {
      if (!user) {
        await createNewArtifact(kind, name, language, {
          templateId: extras.templateId,
          intent: extras.intent || prefillIntent,
          localOnly: true,
        });
        message.success(t("hub.createOk"));
        setShowNewProjectDialog(false);
        navigate("/workspace");
        return;
      }
      const id = await createNewArtifact(kind, name, language, {
        templateId: extras.templateId,
        intent: extras.intent || prefillIntent,
      });
      message.success(t("hub.createOk"));
      setShowNewProjectDialog(false);
      if (id) navigate(`/workspace/${id}`);
      else navigate("/workspace");
    } catch (err) {
      message.error(err instanceof Error ? err.message : t("hub.createFailed"));
    } finally {
      setCreating(false);
    }
  };

  const actions: SiteActions = {
    openCreate,
    openSample: (slug, aiPrompt) => {
      void openOfficialSample(slug, aiPrompt);
    },
  };

  if (!authInitialized || (requireLoginOnEntry() && !user)) {
    return (
      <div className={styles.gate}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <SiteActionsContext.Provider value={actions}>
      <div className={styles.shell}>
        <SiteHeader onNewProject={() => openCreate()} />
        {trial ? (
          <Alert
            type="info"
            showIcon
            banner
            message={t("hub.trialBanner")}
            action={
              <Button
                size="small"
                type="primary"
                loading={creating}
                onClick={() => openCreate("exercise", t("hub.trialProjectName"), "learn")}
              >
                {t("hub.trialStart")}
              </Button>
            }
          />
        ) : null}
        <main className={styles.main}>{children}</main>
        <SiteFooter />
        <NewProjectDialog
          open={showNewProjectDialog}
          initialKind={prefillKind}
          initialName={prefillName}
          initialIntent={prefillIntent}
          onConfirm={(kind, name, language, extras) =>
            void handleCreate(kind, name, language, extras)
          }
          onCancel={() => {
            setShowNewProjectDialog(false);
            setPrefillKind(null);
            setPrefillName("");
            setPrefillIntent(undefined);
          }}
        />
      </div>
    </SiteActionsContext.Provider>
  );
}
