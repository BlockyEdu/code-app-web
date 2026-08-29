import { ArrowRightOutlined, ReloadOutlined } from "@ant-design/icons";
import { useCallback } from "react";
import type { WorldState } from "../lib/targets";
import { WEB_IFRAME_SANDBOX } from "../lib/web-preview";
import { useWorkspaceStore } from "../stores/workspace";
import type { ArtifactKind } from "../types/artifact";
import { KIND_DEFAULT_PREVIEW, PREVIEW_LABEL } from "../types/artifact";
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

function WebPreview({ world, onRefresh }: { world: WorldState | null; onRefresh?: () => void }) {
  const embedUrl = useWorkspaceStore((s) => s.webPreviewEmbedUrl);
  const srcDoc = useWorkspaceStore((s) => s.webPreviewSrcDoc);
  const title = world?.web.title || "我的第一个网站";
  const hasDoc = Boolean(embedUrl || srcDoc);

  return (
    <div className={styles.webFrame}>
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
              : "preview · 点击「作品预览」"}
        </div>
      </div>
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

function FirmwarePreview() {
  const sim = useWorkspaceStore((s) => s.firmwareSim);
  const lines = (sim?.serialLog || "Click Firmware sim — this is an MCU adapter, not Piston.")
    .split("\n")
    .filter(Boolean)
    .slice(-16);

  return (
    <div className={styles.homePreview}>
      <div className={styles.homeNotice}>
        Firmware lab · adapter {sim?.adapter || "idle"}
        {sim?.status ? ` · ${sim.status}` : ""} — not mass production
      </div>
      {sim?.exportHint && <div className={styles.homeNotice}>{sim.exportHint}</div>}
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

  const handleReload = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className={styles.previewPanel}>
      <div className={styles.previewHeader}>
        <span className={styles.previewTitle}>
          {label}
          {kind === "smarthome" && <span className={styles.previewBadge}>device panel</span>}
          {kind === "iot" && <span className={styles.previewBadge}>MCU adapter</span>}
          {kind === "web" && <span className={styles.previewBadge}>sandbox</span>}
        </span>
        <div className={styles.previewActions}>
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
        {kind === "miniprogram" && <MiniprogramPreview world={world} />}
        {kind === "smarthome" && <SmarthomePreview world={world} />}
        {kind === "iot" && <FirmwarePreview />}
        {kind === "toy" && <ToyPreview world={world} />}
      </div>
    </div>
  );
}
