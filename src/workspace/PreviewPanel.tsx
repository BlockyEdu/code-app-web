import { ArrowRightOutlined, ReloadOutlined } from "@ant-design/icons";
import { Segmented, Select } from "antd";
import { useCallback, useEffect } from "react";
import { hasDetailPage, usesHostedPosts } from "../lib/app-studio/app-schema";
import { staticBoard } from "../lib/hardware-catalog-static";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { previewLabel } from "../lib/preview-label";
import type { WorldState } from "../lib/targets";
import {
  previewEmbedChromeLabel,
  resolvePreviewEmbedSrc,
  WEB_IFRAME_SANDBOX,
} from "../lib/web-preview";
import { isAppStudioKind, useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind } from "../types/artifact";
import { KIND_DEFAULT_PREVIEW } from "../types/artifact";
import studio from "./BlogStudio.module.scss";
import styles from "./PreviewPanel.module.scss";
import { SmarthomePreview } from "./SmarthomePreview";
import { DeviceStage } from "./stage/DeviceStage";
import { ToyPreview } from "./ToyPreview";

interface PreviewPanelProps {
  kind: ArtifactKind;
}

function parseBlogNavHref(href: string): { page: "home" } | { page: "post"; slug: string } {
  const match = href.match(/\/posts\/([^/?#]+)/);
  if (match?.[1]) return { page: "post", slug: decodeURIComponent(match[1]) };
  return { page: "home" };
}

function WebPreview({
  world,
  onRefresh,
  chrome = "browser",
}: {
  world: WorldState | null;
  onRefresh?: () => void;
  chrome?: "browser" | "none";
}) {
  useLocaleStore((s) => s.locale);
  const embedUrlRaw = useWorkspaceStore((s) => s.webPreviewEmbedUrl);
  const embedUrl = resolvePreviewEmbedSrc(embedUrlRaw);
  const srcDoc = useWorkspaceStore((s) => s.webPreviewSrcDoc);
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const setBlogPreview = useWorkspaceStore((s) => s.setBlogPreview);
  const blogStudio = isAppStudioKind(artifactKind, templateId);
  const title =
    world?.web.title || (blogStudio ? t("preview.sitePreview") : t("preview.siteFallback"));
  const hasDoc = Boolean(embedUrl || srcDoc);

  useEffect(() => {
    if (!blogStudio) return;
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data as { type?: string; href?: string };
      if (data?.type !== "blockyedu-blog-nav" || typeof data.href !== "string") return;
      const route = parseBlogNavHref(data.href);
      if (route.page === "post") setBlogPreview("post", route.slug);
      else setBlogPreview("home");
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [blogStudio, setBlogPreview]);

  return (
    <div className={styles.webFrame}>
      {chrome === "browser" && (
        <div className={styles.browserBar}>
          <div className={styles.browserDots}>
            <span style={{ background: "#ef4444" }} />
            <span style={{ background: "#f59e0b" }} />
            <span style={{ background: "#22c55e" }} />
          </div>
          <div className={styles.browserUrl}>
            {embedUrl
              ? previewEmbedChromeLabel(embedUrl)
              : srcDoc
                ? "srcdoc://sandbox"
                : blogStudio
                  ? "preview · schema"
                  : t("preview.waiting")}
          </div>
        </div>
      )}
      {hasDoc ? (
        <iframe
          key={embedUrl || "srcdoc"}
          className={styles.webIframe}
          title={`Web preview: ${title}`}
          sandbox={WEB_IFRAME_SANDBOX}
          referrerPolicy="no-referrer"
          src={embedUrl || undefined}
          srcDoc={embedUrl ? undefined : srcDoc || undefined}
        />
      ) : (
        <div className={styles.webContent}>
          <div className={styles.webHero}>
            <div className={styles.webHeroTag}>{t("preview.isolated")}</div>
            <div className={styles.webHeroTitle}>{title}</div>
            <div className={styles.webHeroSub}>{t("preview.clickSandbox")}</div>
            {onRefresh && (
              <button type="button" className={styles.webHeroBtn} onClick={onRefresh}>
                {t("preview.run")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniprogramPreview({ world }: { world: WorldState | null }) {
  useLocaleStore((s) => s.locale);
  const pages = world?.miniapp.pages ?? [];
  const activeId = world?.miniapp.activePage || pages[0]?.id || "";
  const page = pages.find((p) => p.id === activeId) || pages[0];
  const data = world?.miniapp.data ?? {};
  const toast = world?.miniapp.toasts.at(-1);

  return (
    <div className={styles.phoneFrame}>
      <div className={styles.phoneScreen}>
        <div className={styles.mpHeader}>
          <span className={styles.mpTitle}>{page?.title || t("preview.miniFallback")}</span>
        </div>
        <div className={styles.mpContent}>
          {!page ? (
            <div className={styles.mpBanner} />
          ) : (
            page.components.map((c) => {
              const key = `${c.kind}:${c.content}:${c.dataKey ?? ""}:${c.targetPage ?? ""}`;
              if (c.kind === "bind") {
                const value = data[c.dataKey || ""] ?? "";
                return (
                  <div key={key} className={styles.mpItem}>
                    <div className={styles.mpItemText}>
                      <div className={styles.mpItemTitle}>
                        {c.content}
                        {String(value)}
                      </div>
                    </div>
                  </div>
                );
              }
              if (c.kind === "nav") {
                return (
                  <div key={key} className={styles.mpItem}>
                    <div className={styles.mpItemText}>
                      <div className={styles.mpItemTitle}>{c.content}</div>
                      <div className={styles.mpItemSub}>→ {c.targetPage}</div>
                    </div>
                    <ArrowRightOutlined style={{ fontSize: 10, color: "#4f5d72" }} />
                  </div>
                );
              }
              return (
                <div key={key} className={styles.mpItem}>
                  <div className={styles.mpItemIcon} />
                  <div className={styles.mpItemText}>
                    <div className={styles.mpItemTitle}>{c.content || c.kind}</div>
                    <div className={styles.mpItemSub}>{c.kind}</div>
                  </div>
                </div>
              );
            })
          )}
          {toast && (
            <div className={styles.mpItem}>
              <div className={styles.mpItemText}>
                <div className={styles.mpItemTitle}>Toast</div>
                <div className={styles.mpItemSub}>{toast}</div>
              </div>
            </div>
          )}
        </div>
        <div className={styles.mpTabBar}>
          {(pages.length ? pages : [{ id: "home", title: t("preview.pageHome") }])
            .slice(0, 3)
            .map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.mpTab} ${p.id === activeId || (!activeId && i === 0) ? styles.mpTabActive : ""}`}
              >
                <span className={styles.mpTabIcon}>{["⊞", "◎", "♡"][i] || "○"}</span>
                <span>{p.title || p.id}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

const PACK_TITLE: Record<string, string> = {
  "smart-window": "stage.sceneTitle.window",
  "agri-irrigation": "stage.sceneTitle.irrigation",
  "agri-pond": "stage.sceneTitle.pond",
  "air-beacon": "stage.sceneTitle.beacon",
  "room-node": "stage.sceneTitle.room",
  "desk-rover": "stage.sceneTitle.rover",
};

function packTitle(slug: string | null): string {
  const key = slug ? PACK_TITLE[slug] : undefined;
  return key ? t(key) : t("stage.device");
}

function IotLabPreview() {
  useLocaleStore((s) => s.locale);
  const packSlug = useWorkspaceStore((s) => s.iotPackSlug);
  const runMode = useWorkspaceStore((s) => s.iotRunMode);
  const setIotRunMode = useWorkspaceStore((s) => s.setIotRunMode);
  const boardSku = useWorkspaceStore((s) => s.boardSku);
  const setBoardSku = useWorkspaceStore((s) => s.setBoardSku);
  const sim = useWorkspaceStore((s) => s.firmwareSim);
  const modeLabel =
    runMode === "live"
      ? t("stage.run.live")
      : runMode === "firmware"
        ? t("stage.run.firmware")
        : t("stage.run.sim");
  const packLabel = packTitle(packSlug);
  const boardLabel = t(staticBoard(boardSku).nameKey);

  const download = (path: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = path.split("/").pop() || path;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.deviceHost}>
      <DeviceStage kind="iot">
        <div className={styles.stageControls}>
          <div className={styles.homeNotice}>
            {modeLabel} · {packLabel} · {boardLabel}
          </div>
          <div className={styles.stageControlRow}>
            <Select
              size="small"
              style={{ width: "100%" }}
              value={runMode}
              onChange={(value) => setIotRunMode(value as "sim" | "live" | "firmware")}
              options={[
                { value: "sim", label: t("stage.run.sim") },
                { value: "live", label: t("stage.run.live") },
                { value: "firmware", label: t("stage.run.firmware") },
              ]}
            />
            <Select
              size="small"
              style={{ width: "100%" }}
              value={boardSku || "board.espressif.esp32-s3-devkitc-1"}
              onChange={(value) => setBoardSku(value)}
              options={[
                { value: "board.espressif.esp32-s3-devkitc-1", label: t("stage.board.esp32s3") },
                { value: "board.espressif.esp32-c3-devkitm-1", label: t("stage.board.esp32c3") },
                { value: "board.st.nucleo-f401re", label: t("stage.board.nucleo") },
              ]}
            />
          </div>
          {(runMode === "firmware" ? (sim?.exportFiles ?? []) : []).slice(0, 4).map((file) => (
            <button
              key={file.path}
              type="button"
              className={styles.homeNotice}
              title={sim?.exportHint || t("stage.simNotHardware")}
              onClick={() => download(file.path, file.content)}
            >
              {t("preview.downloadFile", { path: file.path })}
            </button>
          ))}
        </div>
      </DeviceStage>
    </div>
  );
}

export function PreviewPanel({ kind, onRefresh }: PreviewPanelProps & { onRefresh?: () => void }) {
  const previewType = KIND_DEFAULT_PREVIEW[kind];
  const label = previewLabel(previewType);
  const world = useWorkspaceStore((s) => s.previewWorld);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const blogStudio = isAppStudioKind(kind, templateId);
  const blogPosts = useWorkspaceStore((s) => s.blogPosts);
  const appSchema = useWorkspaceStore((s) => s.appSchema);
  const showDetailSwitch =
    blogStudio && usesHostedPosts(templateId) && (!appSchema || hasDetailPage(appSchema));
  const blogPreviewPage = useWorkspaceStore((s) => s.blogPreviewPage);
  const blogPreviewSlug = useWorkspaceStore((s) => s.blogPreviewSlug);
  const setBlogPreview = useWorkspaceStore((s) => s.setBlogPreview);
  useLocaleStore((s) => s.locale);

  useEffect(() => {
    if (!blogStudio || blogPreviewPage !== "post") return;
    if (blogPreviewSlug || blogPosts.length === 0) return;
    setBlogPreview("post", blogPosts[0].slug);
  }, [blogStudio, blogPreviewPage, blogPreviewSlug, blogPosts, setBlogPreview]);

  const handleReload = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className={styles.previewPanel}>
      <div className={styles.previewHeader}>
        <span className={styles.previewTitle}>
          {label}
          {kind === "smarthome" && (
            <span className={styles.previewBadge}>{t("preview.badgeDevice")}</span>
          )}
          {kind === "iot" && <span className={styles.previewBadge}>{t("preview.badgeIot")}</span>}
          {kind === "web" && (
            <span className={styles.previewBadge}>
              {blogStudio ? t("preview.badgeSite") : t("preview.badgeSandbox")}
            </span>
          )}
          {kind === "miniprogram" && blogStudio && (
            <span className={styles.previewBadge}>{t("preview.badgeMini")}</span>
          )}
        </span>
        <div className={styles.previewActions}>
          {showDetailSwitch && (
            <div className={studio.previewSwitch}>
              <Segmented
                size="small"
                value={blogPreviewPage}
                onChange={(v) => {
                  const page = v as "home" | "post";
                  if (page === "post") {
                    setBlogPreview("post", blogPreviewSlug || blogPosts[0]?.slug || "");
                  } else {
                    setBlogPreview("home");
                  }
                }}
                options={[
                  { label: t("preview.home"), value: "home" },
                  {
                    label: t("preview.post"),
                    value: "post",
                    disabled: blogPosts.length === 0,
                  },
                ]}
              />
              {blogPreviewPage === "post" && (
                <Select
                  size="small"
                  style={{ minWidth: 120 }}
                  value={blogPreviewSlug || undefined}
                  placeholder={t("preview.selectPost")}
                  onChange={(slug) => setBlogPreview("post", slug)}
                  options={blogPosts.map((p) => ({
                    value: p.slug,
                    label: `${p.data.title || p.slug}${p.status === "draft" ? t("preview.postDraft") : ""}`,
                  }))}
                />
              )}
            </div>
          )}
          <button
            type="button"
            className={styles.previewBtn}
            aria-label={t("preview.refreshAria")}
            onClick={handleReload}
          >
            <ReloadOutlined />
          </button>
        </div>
      </div>
      <div className={styles.previewContent}>
        {kind === "web" && <WebPreview world={world} onRefresh={onRefresh} />}
        {kind === "miniprogram" && blogStudio && (
          <div className={styles.phoneFrame}>
            <div className={styles.phoneScreenStudio}>
              <WebPreview world={world} chrome="none" onRefresh={onRefresh} />
            </div>
          </div>
        )}
        {kind === "miniprogram" && !blogStudio && <MiniprogramPreview world={world} />}
        {kind === "smarthome" && <SmarthomePreview world={world} />}
        {kind === "iot" && <IotLabPreview />}
        {kind === "toy" && <ToyPreview world={world} />}
      </div>
    </div>
  );
}
