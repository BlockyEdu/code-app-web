import { App as AntdApp, Button, Spin } from "antd";
import { useMemo, useState } from "react";
import { FloatingAiPanel } from "../components/FloatingAiPanel";
import { paletteForKind, SampleCover } from "../components/SampleCover";
import { useWorkItems } from "../hooks/useWorkItems";
import { useAuthStore } from "../lib/auth-store";
import { readGuestDraft } from "../lib/guest-draft";
import { t } from "../lib/i18n";
import { kindLabel } from "../lib/kind-label";
import { navigate } from "../lib/navigate";
import type { WorkItem } from "../lib/work-items";
import { useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind } from "../types/artifact";
import { ARTIFACT_KIND_ORDER, KIND_COLOR } from "../types/artifact";
import styles from "./ProjectsPage.module.scss";
import { SiteShell, useSiteActions } from "./SiteShell";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export function ProjectsPage() {
  return (
    <SiteShell>
      <ProjectsMain />
    </SiteShell>
  );
}

function ProjectsMain() {
  const { message } = AntdApp.useApp();
  const { openCreate } = useSiteActions();
  const user = useAuthStore((s) => s.user);
  const openArtifact = useWorkspaceStore((s) => s.openArtifact);
  const openLegacyProject = useWorkspaceStore((s) => s.openLegacyProject);
  const aiOpen = useWorkspaceStore((s) => s.aiOpen);
  const setAiOpen = useWorkspaceStore((s) => s.setAiOpen);
  const toggleAiOpen = useWorkspaceStore((s) => s.toggleAiOpen);
  const [kindFilter, setKindFilter] = useState<string>("all");

  const { items, loading } = useWorkItems({
    enabled: Boolean(user),
    onError: (err) => {
      message.error(err instanceof Error ? err.message : t("hub.loadFailed"));
    },
  });

  const filtered = useMemo(() => {
    if (kindFilter === "all") return items;
    return items.filter((item) => item.kind === kindFilter);
  }, [items, kindFilter]);

  const guestDraft = user ? null : readGuestDraft();

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

  return (
    <div className={styles.page}>
      <h1 className={styles.srOnly}>{t("projects.title")}</h1>

      {user ? (
        <div className={styles.chips}>
          <button
            type="button"
            className={`${styles.chip} ${kindFilter === "all" ? styles.chipOn : ""}`}
            onClick={() => setKindFilter("all")}
          >
            {t("projects.filterAll")}
          </button>
          {ARTIFACT_KIND_ORDER.map((kind) => (
            <button
              key={kind}
              type="button"
              className={`${styles.chip} ${kindFilter === kind ? styles.chipOn : ""}`}
              onClick={() => setKindFilter(kind)}
            >
              {kindLabel(kind)}
            </button>
          ))}
        </div>
      ) : null}

      {user && loading && items.length === 0 ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : user && filtered.length === 0 ? (
        <EmptyProjects />
      ) : user ? (
        <div className={styles.grid}>
          {filtered.map((item) => (
            <ProjectCard key={item.key} item={item} onOpen={() => void handleOpen(item)} />
          ))}
        </div>
      ) : guestDraft ? (
        <div className={styles.grid}>
          <button
            type="button"
            className={styles.card}
            onClick={() =>
              navigate(guestDraft.sampleSlug ? `/sample/${guestDraft.sampleSlug}` : "/workspace")
            }
          >
            <SampleCover
              kind={guestDraft.kind}
              palette={paletteForKind(guestDraft.kind)}
              label={guestDraft.name}
            />
            <span className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{guestDraft.name || t("projects.draftTitle")}</h2>
              <p className={styles.cardMeta}>{t("projects.draftTitle")}</p>
              <KindTag kind={guestDraft.kind} />
            </span>
          </button>
        </div>
      ) : (
        <EmptyProjects />
      )}

      <FloatingAiPanel
        open={aiOpen}
        onOpenChange={setAiOpen}
        onToggle={toggleAiOpen}
        mode="hub"
        onHubCreateRequest={(kind, name) => openCreate(kind, name)}
      />
    </div>
  );
}

function EmptyProjects() {
  return (
    <div className={styles.empty}>
      <EmptyArt />
      <h2 className={styles.emptyTitle}>{t("projects.emptyTitle")}</h2>
      <Button type="primary" onClick={() => navigate("/samples")}>
        {t("projects.startFromSample")}
      </Button>
    </div>
  );
}

function ProjectCard({ item, onOpen }: { item: WorkItem; onOpen: () => void }) {
  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      <SampleCover kind={item.kind} palette={paletteForKind(item.kind)} label={item.title} />
      <span className={styles.cardBody}>
        <h2 className={styles.cardTitle}>{item.title}</h2>
        <p className={styles.cardMeta}>
          {t("projects.updatedAt", { time: formatTime(item.updatedAt) })}
        </p>
        <KindTag kind={item.kind} />
      </span>
    </button>
  );
}

function KindTag({ kind }: { kind: ArtifactKind }) {
  return (
    <span className={styles.kind} style={{ ["--kind" as string]: KIND_COLOR[kind] }}>
      {kindLabel(kind)}
    </span>
  );
}

function EmptyArt() {
  return (
    <svg className={styles.emptyArt} viewBox="0 0 160 120" aria-hidden="true">
      <rect x="18" y="28" width="124" height="72" rx="12" fill="#EFF6FF" />
      <rect x="36" y="44" width="88" height="8" rx="4" fill="#93C5FD" />
      <rect x="36" y="60" width="64" height="8" rx="4" fill="#BFDBFE" />
      <rect x="36" y="76" width="40" height="8" rx="4" fill="#DBEAFE" />
    </svg>
  );
}
