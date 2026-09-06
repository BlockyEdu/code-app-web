import { ArrowRightOutlined, ReloadOutlined } from "@ant-design/icons";
import { Segmented, Select } from "antd";
import { useCallback, useEffect } from "react";
import { hasDetailPage, usesHostedPosts } from "../lib/app-studio/app-schema";
import { useLocaleStore } from "../lib/locale-store";
import type { WorldState } from "../lib/targets";
import { WEB_IFRAME_SANDBOX } from "../lib/web-preview";
import { isAppStudioKind, useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind } from "../types/artifact";
import { KIND_DEFAULT_PREVIEW, PREVIEW_LABEL } from "../types/artifact";
import studio from "./BlogStudio.module.scss";
import styles from "./PreviewPanel.module.scss";

interface PreviewPanelProps {
  kind: ArtifactKind;
}

const LED_COLORS: Record<string, string> = {
  red: "#ef4444",
  green: "#22c55e",
  blue: "#2563eb",
  yellow: "#f59e0b",
  off: "#334155",
};

const ROOM_LABELS: Record<string, string> = {
  living: "客厅",
  bedroom: "卧室",
  kitchen: "厨房",
};

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
  const embedUrl = useWorkspaceStore((s) => s.webPreviewEmbedUrl);
  const srcDoc = useWorkspaceStore((s) => s.webPreviewSrcDoc);
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const setBlogPreview = useWorkspaceStore((s) => s.setBlogPreview);
  const blogStudio = isAppStudioKind(artifactKind, templateId);
  const title = world?.web.title || (blogStudio ? "Site preview" : "我的第一个网站");
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
              ? "sandbox://preview (opaque origin)"
              : srcDoc
                ? "srcdoc://sandbox"
                : blogStudio
                  ? "preview · schema"
                  : "preview · 点击「作品预览」"}
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
            <div className={styles.webHeroTag}>隔离 iframe</div>
            <div className={styles.webHeroTitle}>{title}</div>
            <div className={styles.webHeroSub}>
              点击「作品预览」在沙箱中渲染（不执行于主站页面）
            </div>
            {onRefresh && (
              <button type="button" className={styles.webHeroBtn} onClick={onRefresh}>
                作品预览
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniprogramPreview({ world }: { world: WorldState | null }) {
  const pages = world?.miniapp.pages ?? [];
  const activeId = world?.miniapp.activePage || pages[0]?.id || "";
  const page = pages.find((p) => p.id === activeId) || pages[0];
  const data = world?.miniapp.data ?? {};
  const toast = world?.miniapp.toasts.at(-1);

  return (
    <div className={styles.phoneFrame}>
      <div className={styles.phoneScreen}>
        <div className={styles.mpHeader}>
          <span className={styles.mpTitle}>{page?.title || "我的小程序"}</span>
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
          {(pages.length ? pages : [{ id: "home", title: "首页" }]).slice(0, 3).map((p, i) => (
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

function ToyPreview({ world }: { world: WorldState | null }) {
  const toy = world?.toy;
  const led = toy?.led || "off";
  const ledColor = LED_COLORS[led] || LED_COLORS.off;
  const log = toy?.timeline?.length ? toy.timeline.slice(-6) : ["[孪生] 点击「仿真运行」执行积木"];

  return (
    <div className={styles.toyPreview}>
      <div className={styles.toyDevice}>
        <div className={styles.toyBoard}>
          <div className={styles.toyChip}>CPU</div>
          <div
            className={styles.toyLed}
            style={{ background: ledColor, boxShadow: `0 0 12px ${ledColor}` }}
          />
          <div className={styles.toyMotorLabel}>
            {toy ? `${toy.moving} @${toy.speed}` : "MOTOR"}
          </div>
        </div>
        {toy?.speech && <div className={styles.webHeroSub}>「{toy.speech}」</div>}
        <div className={styles.toyControls}>
          <span className={styles.toyBtn}>
            位姿 ({Math.round(toy?.x ?? 50)}, {Math.round(toy?.y ?? 70)}) °{toy?.heading ?? 0}
          </span>
          {toy?.sound && (
            <span className={`${styles.toyBtn} ${styles.toyBtnActive}`}>♪ {toy.sound}</span>
          )}
        </div>
      </div>
      <div className={styles.toyLog}>
        {log.map((line) => (
          <div key={line} className={styles.toyLogLine}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function SmarthomePreview({ world }: { world: WorldState | null }) {
  const home = world?.home;
  const rooms = Object.keys(home?.lights ?? { living: 1, bedroom: 1, kitchen: 1 });
  const timeline = home?.timeline?.length
    ? home.timeline.slice(-8)
    : ["[仿真] 虚拟设备面板就绪", "[仿真] 点击「仿真运行」执行积木"];

  return (
    <div className={styles.homePreview}>
      <div className={styles.homeNotice}>
        虚拟仿真 · {home?.scene ? `当前场景：${home.scene}` : "非真机控制"}
        {home ? ` · 空调 ${home.temperature}℃` : ""}
      </div>
      <div className={styles.deviceGrid}>
        {rooms.map((room) => {
          const light = home?.lights[room];
          return (
            <div
              key={room}
              className={`${styles.deviceCard} ${light?.on ? styles.deviceCardOn : ""}`}
            >
              <span className={styles.deviceName}>{ROOM_LABELS[room] || room}灯</span>
              <span className={styles.deviceMeta}>灯光</span>
              <span className={styles.deviceStatus}>
                {light?.on ? "ON" : "OFF"} · {light?.brightness ?? 0}%
              </span>
            </div>
          );
        })}
        {Object.entries(home?.devices ?? {}).map(([key, on]) => (
          <div key={key} className={`${styles.deviceCard} ${on ? styles.deviceCardOn : ""}`}>
            <span className={styles.deviceName}>{key}</span>
            <span className={styles.deviceMeta}>设备</span>
            <span className={styles.deviceStatus}>{on ? "ON" : "OFF"}</span>
          </div>
        ))}
      </div>
      <div className={styles.homeLog}>
        {timeline.map((line) => (
          <div key={line} className={styles.homeLogLine}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function IotLabPreview({ world }: { world: WorldState | null }) {
  const packSlug = useWorkspaceStore((s) => s.iotPackSlug);
  const runMode = useWorkspaceStore((s) => s.iotRunMode);
  const setIotRunMode = useWorkspaceStore((s) => s.setIotRunMode);
  const boardSku = useWorkspaceStore((s) => s.boardSku);
  const setBoardSku = useWorkspaceStore((s) => s.setBoardSku);
  const iot = world?.iot;
  const channels = iot?.channels ?? {};
  const timeline = iot?.timeline?.length
    ? iot.timeline.slice(-8).map((e) => e.text)
    : ["[仿真] 选择通道与命令后点击运行", "[仿真] 真机需教师短时会话"];
  const modeLabel = runMode === "live" ? "真机会话" : runMode === "firmware" ? "仅导出" : "仿真";

  return (
    <div className={styles.homePreview}>
      <div className={styles.homeNotice}>
        {modeLabel} · {packSlug || "iot"} · {boardSku || "未选板卡"}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <Select
          size="small"
          value={runMode}
          style={{ minWidth: 120 }}
          onChange={(v) => setIotRunMode(v as "sim" | "live" | "firmware")}
          options={[
            { value: "sim", label: "仿真运行" },
            { value: "live", label: "真机会话" },
            { value: "firmware", label: "仅导出" },
          ]}
        />
        <Select
          size="small"
          value={boardSku || "board.espressif.esp32-s3-devkitc-1"}
          style={{ minWidth: 220 }}
          onChange={(v) => setBoardSku(v)}
          options={[
            { value: "board.espressif.esp32-s3-devkitc-1", label: "ESP32-S3 DevKitC-1" },
            { value: "board.espressif.esp32-c3-devkitm-1", label: "ESP32-C3 DevKit" },
          ]}
        />
      </div>
      <div className={styles.deviceGrid}>
        {Object.entries(channels).map(([key, value]) => (
          <div key={key} className={styles.deviceCard}>
            <span className={styles.deviceName}>{key}</span>
            <span className={styles.deviceMeta}>通道</span>
            <span className={styles.deviceStatus}>{String(value)}</span>
          </div>
        ))}
      </div>
      {iot?.assertions?.length ? (
        <div className={styles.homeNotice}>
          断言 {iot.assertions.filter((a) => a.ok).length}/{iot.assertions.length} 通过
        </div>
      ) : null}
      <div className={styles.homeLog}>
        {timeline.map((line) => (
          <div key={line} className={styles.homeLogLine}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function FirmwarePreview() {
  const sim = useWorkspaceStore((s) => s.firmwareSim);
  const lines = (sim?.serialLog || "Click Firmware sim — this is an MCU adapter, not Piston.")
    .split("\n")
    .filter(Boolean)
    .slice(-16);

  const download = (path: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() || path;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.homePreview}>
      <div className={styles.homeNotice}>
        Firmware lab · adapter {sim?.adapter || "idle"}
        {sim?.status ? ` · ${sim.status}` : ""} — not mass production
      </div>
      {sim?.exportHint && <div className={styles.homeNotice}>{sim.exportHint}</div>}
      {sim?.assertions && sim.assertions.length > 0 && (
        <div className={styles.homeNotice}>
          {sim.assertions.map((a) => (
            <div key={a.id}>
              {a.ok ? "✓" : "○"} {a.name}: {a.detail}
            </div>
          ))}
        </div>
      )}
      {(sim?.exportFiles ?? []).slice(0, 4).map((f) => (
        <button
          key={f.path}
          type="button"
          className={styles.homeNotice}
          onClick={() => download(f.path, f.content)}
        >
          Download {f.path}
        </button>
      ))}
      <div className={styles.homeLog}>
        {lines.map((line) => (
          <div key={line} className={styles.homeLogLine}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PreviewPanel({ kind, onRefresh }: PreviewPanelProps & { onRefresh?: () => void }) {
  const previewType = KIND_DEFAULT_PREVIEW[kind];
  const label = PREVIEW_LABEL[previewType];
  const world = useWorkspaceStore((s) => s.previewWorld);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const iotRunMode = useWorkspaceStore((s) => s.iotRunMode);
  const blogStudio = isAppStudioKind(kind, templateId);
  const blogPosts = useWorkspaceStore((s) => s.blogPosts);
  const appSchema = useWorkspaceStore((s) => s.appSchema);
  const showDetailSwitch =
    blogStudio && usesHostedPosts(templateId) && (!appSchema || hasDetailPage(appSchema));
  const blogPreviewPage = useWorkspaceStore((s) => s.blogPreviewPage);
  const blogPreviewSlug = useWorkspaceStore((s) => s.blogPreviewSlug);
  const setBlogPreview = useWorkspaceStore((s) => s.setBlogPreview);
  const zh = useLocaleStore((s) => s.locale) === "zh-CN";

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
          {kind === "smarthome" && <span className={styles.previewBadge}>device panel</span>}
          {kind === "iot" && <span className={styles.previewBadge}>IoT lab</span>}
          {kind === "web" && (
            <span className={styles.previewBadge}>{blogStudio ? "site" : "sandbox"}</span>
          )}
          {kind === "miniprogram" && blogStudio && (
            <span className={styles.previewBadge}>mini · h5</span>
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
                  { label: zh ? "首页" : "Home", value: "home" },
                  {
                    label: zh ? "文章" : "Post",
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
                  placeholder={zh ? "选择文章" : "Select post"}
                  onChange={(slug) => setBlogPreview("post", slug)}
                  options={blogPosts.map((p) => ({
                    value: p.slug,
                    label: `${p.data.title || p.slug}${p.status === "draft" ? " (draft)" : ""}`,
                  }))}
                />
              )}
            </div>
          )}
          <button
            type="button"
            className={styles.previewBtn}
            aria-label="Refresh preview"
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
        {kind === "iot" && iotRunMode === "firmware" && !world?.iot && <FirmwarePreview />}
        {kind === "iot" && (iotRunMode !== "firmware" || Boolean(world?.iot)) && (
          <IotLabPreview world={world} />
        )}
        {kind === "toy" && <ToyPreview world={world} />}
      </div>
    </div>
  );
}
