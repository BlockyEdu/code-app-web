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
import { rememberPostLoginPath } from "../lib/idp";
import { type AppLocale, useLocaleStore } from "../lib/locale-store";
import { navigate } from "../lib/navigate";
import { profileFeatures } from "../lib/product-profile";
import type { WorkItem } from "../lib/work-items";
import { useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind } from "../types/artifact";
import { ARTIFACT_KIND_ORDER, KIND_COLOR, KIND_LABEL } from "../types/artifact";
import { NewProjectDialog } from "../workspace/NewProjectDialog";
import styles from "./ProjectsHub.module.scss";

const HUB_COPY: Record<
  AppLocale,
  {
    heroTitle: string;
    heroSub: string;
    sectionTitle: string;
    refresh: string;
    newProject: string;
    empty: string;
    updatedAt: string;
    loadFailed: string;
    createOk: string;
    createFailed: string;
    openFailed: string;
    logout: string;
    all: string;
    navDiscover: string;
    navLearn: string;
    navBuild: string;
    navLab: string;
    navLaunch: string;
    intentLearn: string;
    intentLearnSub: string;
    intentBuild: string;
    intentBuildSub: string;
    intentShip: string;
    intentShipSub: string;
  }
> = {
  "zh-CN": {
    heroTitle: "Learn, Build, Ship",
    heroSub: "从结对学习到可验证固件，再到开放制造包。仿真不是量产；文件可带走。",
    sectionTitle: "我的作品",
    refresh: "刷新",
    newProject: "新建",
    empty: "还没有作品。从上方意图开始。",
    updatedAt: "更新于",
    loadFailed: "加载失败",
    createOk: "已创建",
    createFailed: "创建失败",
    openFailed: "打开失败",
    logout: "退出登录",
    all: "全部",
    navDiscover: "Discover",
    navLearn: "Learn",
    navBuild: "Build",
    navLab: "Lab",
    navLaunch: "Launch",
    intentLearn: "Learn a skill",
    intentLearnSub: "自由编程与 AI 结对",
    intentBuild: "Build a project",
    intentBuildSub: "软件、电子、IoT 模板",
    intentShip: "Ship a product",
    intentShipSub: "金路径硬件到制造包",
  },
  "en-US": {
    heroTitle: "Learn, Build, Ship",
    heroSub:
      "From pair-learning to verified firmware to an open manufacturing pack. Simulation is not mass production. Files leave with you.",
    sectionTitle: "Your artifacts",
    refresh: "Refresh",
    newProject: "New",
    empty: "No artifacts yet. Start from an intent above.",
    updatedAt: "Updated",
    loadFailed: "Failed to load projects",
    createOk: "Project created",
    createFailed: "Failed to create",
    openFailed: "Failed to open",
    logout: "Sign out",
    all: "All",
    navDiscover: "Discover",
    navLearn: "Learn",
    navBuild: "Build",
    navLab: "Lab",
    navLaunch: "Launch",
    intentLearn: "Learn a skill",
    intentLearnSub: "Free coding with an AI pair",
    intentBuild: "Build a project",
    intentBuildSub: "Software, electronics, IoT templates",
    intentShip: "Ship a product",
    intentShipSub: "Golden-path hardware to a manufacturing pack",
  },
};

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
  const locale = useLocaleStore((s) => s.locale);
  const t = HUB_COPY[locale];
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
      message.error(err instanceof Error ? err.message : t.loadFailed);
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

  const filterOptions = useMemo(
    () => [
      { label: `${t.all} ${items.length}`, value: "all" },
      ...ARTIFACT_KIND_ORDER.map((kind) => ({
        label: `${KIND_LABEL[kind]} ${items.filter((i) => i.kind === kind).length}`,
        value: kind,
      })),
    ],
    [items, t.all],
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
      message.success(t.createOk);
      setShowNewProjectDialog(false);
      if (id) navigate(`/workspace/${id}`);
      else navigate("/workspace");
    } catch (err) {
      message.error(err instanceof Error ? err.message : t.createFailed);
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = async (item: WorkItem) => {
    try {
      if (item.source === "artifact") {
        if (hubSection === "launch" && item.kind === "iot") {
          navigate(`/launch/${item.id}`);
          return;
        }
        await openArtifact(item.id);
        navigate(`/workspace/${item.id}`);
      } else {
        await openLegacyProject(item.id);
        navigate("/workspace");
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : t.openFailed);
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
              ["discover", t.navDiscover],
              ["learn", t.navLearn],
              ["build", t.navBuild],
              ["lab", t.navLab],
              ...(features.showLaunchNav ? ([["launch", t.navLaunch]] as const) : []),
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
          <UserAvatarMenu user={user} onLogout={logout} logoutLabel={t.logout} />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>{t.heroTitle}</h1>
          <p className={styles.heroSub}>{t.heroSub}</p>
          <div className={styles.intentGrid}>
            <button
              type="button"
              className={styles.intentCard}
              onClick={() => openCreate("free", "", "learn")}
            >
              <strong>{t.intentLearn}</strong>
              <span>{t.intentLearnSub}</span>
            </button>
            <button
              type="button"
              className={styles.intentCard}
              onClick={() => openCreate(undefined, "", "build")}
            >
              <strong>{t.intentBuild}</strong>
              <span>{t.intentBuildSub}</span>
            </button>
            {features.showLaunchNav && (
              <button
                type="button"
                className={styles.intentCard}
                onClick={() => openCreate("iot", "", "ship")}
              >
                <strong>{t.intentShip}</strong>
                <span>{t.intentShipSub}</span>
              </button>
            )}
          </div>
        </section>

        <div className={styles.toolbar}>
          <h2 className={styles.sectionTitle}>{t.sectionTitle}</h2>
          <div className={styles.toolbarActions}>
            <Button icon={<ReloadOutlined />} onClick={() => void refresh()} loading={loading}>
              {t.refresh}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openCreate()}
              loading={creating}
            >
              {t.newProject}
            </Button>
          </div>
        </div>

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
            <Empty description={t.empty}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
                {t.newProject}
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
                      {KIND_LABEL[item.kind]}
                    </span>
                    {item.language ? (
                      <span className={styles.cardLang}>{item.language}</span>
                    ) : null}
                  </div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardMeta}>
                    {t.updatedAt} {formatTime(item.updatedAt)}
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
