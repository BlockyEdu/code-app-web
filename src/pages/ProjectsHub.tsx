import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { App as AntdApp, Button, Empty, Segmented, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { AppProviders } from "../components/AppProviders";
import { FloatingAiPanel } from "../components/FloatingAiPanel";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { LogoMark } from "../components/Logo";
import { UserAvatarMenu } from "../components/UserAvatarMenu";
import { useWorkItems } from "../hooks/useWorkItems";
import { useAuthStore } from "../lib/auth-store";
import { appBrandTitle } from "../lib/deploy-profile";
import { t } from "../lib/i18n";
import { rememberPostLoginPath } from "../lib/idp";
import { kindLabel } from "../lib/kind-label";
import { useLocaleStore } from "../lib/locale-store";
import { navigate } from "../lib/navigate";
import { profileFeatures } from "../lib/product-profile";
import type { WorkItem } from "../lib/work-items";
import { useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind } from "../types/artifact";
import { ARTIFACT_KIND_ORDER, KIND_COLOR } from "../types/artifact";
import { NewProjectDialog } from "../workspace/NewProjectDialog";
import styles from "./ProjectsHub.module.scss";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function ProjectsHubInner() {
  const { message } = AntdApp.useApp();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const authInitialized = useAuthStore((s) => s.initialized);
  useLocaleStore((s) => s.locale);
  const createNewArtifact = useWorkspaceStore((s) => s.createNewArtifact);
  const openArtifact = useWorkspaceStore((s) => s.openArtifact);
  const openLegacyProject = useWorkspaceStore((s) => s.openLegacyProject);
  const setShowNewProjectDialog = useWorkspaceStore((s) => s.setShowNewProjectDialog);
  const showNewProjectDialog = useWorkspaceStore((s) => s.showNewProjectDialog);
  const aiOpen = useWorkspaceStore((s) => s.aiOpen);
  const setAiOpen = useWorkspaceStore((s) => s.setAiOpen);
  const toggleAiOpen = useWorkspaceStore((s) => s.toggleAiOpen);

  const [kindFilter, setKindFilter] = useState<string>("all");
  const [hubSection, setHubSection] = useState<"discover" | "learn" | "build" | "lab" | "launch">(
    "discover",
  );
  const [creating, setCreating] = useState(false);
  const [prefillKind, setPrefillKind] = useState<ArtifactKind | null>(null);
  const [prefillName, setPrefillName] = useState("");
  const [prefillIntent, setPrefillIntent] = useState<string | undefined>();
  const features = profileFeatures();

  const { items, loading, refresh } = useWorkItems({
    enabled: Boolean(user),
    onError: (err) => {
      message.error(err instanceof Error ? err.message : t("hub.loadFailed"));
    },
  });

  useEffect(() => {
    if (!authInitialized) return;
    if (user) return;
    rememberPostLoginPath("/");
    navigate("/login");
  }, [authInitialized, user]);

  const filtered = useMemo(() => {
    let next = items;
    if (hubSection === "learn")
      next = next.filter((i) => i.kind === "free" || i.kind === "exercise");
    if (hubSection === "lab")
      next = next.filter((i) => i.kind === "iot" || i.kind === "smarthome" || i.kind === "toy");
    if (hubSection === "launch") next = next.filter((i) => i.kind === "iot");
    if (kindFilter !== "all") next = next.filter((i) => i.kind === kindFilter);
    return next;
  }, [items, kindFilter, hubSection]);

  const allLabel = t("hub.all");
  const filterOptions = useMemo(
    () => [
      { label: `${allLabel} ${items.length}`, value: "all" },
      ...ARTIFACT_KIND_ORDER.map((kind) => ({
        label: `${kindLabel(kind)} ${items.filter((i) => i.kind === kind).length}`,
        value: kind,
      })),
    ],
    [items, allLabel],
  );

  const openCreate = (kind?: ArtifactKind, name?: string, intent?: string) => {
    if (!user) {
      rememberPostLoginPath("/");
      navigate("/login");
      return;
    }
    setPrefillKind(kind ?? null);
    setPrefillName(name ?? "");
    setPrefillIntent(intent);
    setShowNewProjectDialog(true);
  };

  const handleCreate = async (
    kind: ArtifactKind,
    name: string,
    language: string,
    extras: { templateId: string; intent?: string },
  ) => {
    setCreating(true);
    try {
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

  const handleOpen = async (item: WorkItem) => {
    try {
      if (item.source === "artifact") {
        await openArtifact(item.id);
        navigate(`/workspace/${item.id}`);
      } else {
        await openLegacyProject(item.id);
        navigate("/workspace");
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : t("hub.openFailed"));
    }
  };

  if (!authInitialized || !user) {
    return (
      <div className={styles.hub}>
        <div
          className={styles.emptyWrap}
          style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}
        >
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.hub}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <LogoMark size={26} />
          <span>{appBrandTitle()}</span>
        </div>
        <nav className={styles.topNav} aria-label="Primary">
          {(
            [
              ["discover", t("hub.navDiscover")],
              ["learn", t("hub.navLearn")],
              ["build", t("hub.navBuild")],
              ["lab", t("hub.navLab")],
              ...(features.showLaunchNav ? ([["launch", t("hub.navLaunch")]] as const) : []),
            ] as Array<[typeof hubSection, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`${styles.navBtn} ${hubSection === id ? styles.navBtnActive : ""}`}
              onClick={() => setHubSection(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className={styles.topActions}>
          <LocaleSwitcher />
          <UserAvatarMenu user={user} onLogout={logout} logoutLabel={t("hub.logout")} />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>{t("hub.heroTitle")}</h1>
          <p className={styles.heroSub}>{t("hub.heroSub")}</p>
          <div className={styles.intentGrid}>
            <button
              type="button"
              className={styles.intentCard}
              onClick={() => openCreate("free", "", "learn")}
            >
              <strong>{t("hub.intentLearn")}</strong>
              <span>{t("hub.intentLearnSub")}</span>
            </button>
            <button
              type="button"
              className={styles.intentCard}
              onClick={() => openCreate(undefined, "", "build")}
            >
              <strong>{t("hub.intentBuild")}</strong>
              <span>{t("hub.intentBuildSub")}</span>
            </button>
            {features.showLaunchNav && (
              <button
                type="button"
                className={styles.intentCard}
                onClick={() => openCreate("iot", "", "ship")}
              >
                <strong>{t("hub.intentShip")}</strong>
                <span>{t("hub.intentShipSub")}</span>
              </button>
            )}
          </div>
        </section>

        <div className={styles.toolbar}>
          <h2 className={styles.sectionTitle}>{t("hub.sectionTitle")}</h2>
          <div className={styles.toolbarActions}>
            <Button icon={<ReloadOutlined />} onClick={() => void refresh()} loading={loading}>
              {t("hub.refresh")}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openCreate()}
              loading={creating}
            >
              {t("hub.newProject")}
            </Button>
          </div>
        </div>

        {hubSection === "launch" ? (
          <p className={styles.sectionHint}>{t("hub.launchHint")}</p>
        ) : null}

        <div className={styles.filterRow}>
          <Segmented
            options={filterOptions}
            value={kindFilter}
            onChange={(v) => setKindFilter(String(v))}
          />
        </div>

        {loading && items.length === 0 ? (
          <div className={styles.emptyWrap}>
            <Spin />
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyWrap}>
            <Empty description={t("hub.empty")}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
                {t("hub.newProject")}
              </Button>
            </Empty>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((item) => {
              const color = KIND_COLOR[item.kind];
              return (
                <button
                  key={item.key}
                  type="button"
                  className={styles.card}
                  onClick={() => void handleOpen(item)}
                >
                  <div className={styles.cardTop}>
                    <span
                      className={styles.kindChip}
                      style={{
                        color,
                        borderColor: `${color}40`,
                        background: `${color}18`,
                      }}
                    >
                      {kindLabel(item.kind)}
                    </span>
                    {item.language ? (
                      <span className={styles.cardLang}>{item.language}</span>
                    ) : null}
                  </div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardMeta}>
                    {t("hub.updatedAt")} {formatTime(item.updatedAt)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <FloatingAiPanel
        open={aiOpen}
        onOpenChange={setAiOpen}
        onToggle={toggleAiOpen}
        mode="hub"
        onHubCreateRequest={(kind, name) => openCreate(kind, name)}
      />

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
  );
}

export function ProjectsHub() {
  return (
    <AppProviders>
      <ProjectsHubInner />
    </AppProviders>
  );
}
