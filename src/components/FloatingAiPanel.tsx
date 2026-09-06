import { AnthropicFilled, CloseOutlined } from "@ant-design/icons";
import { FloatButton } from "antd";
import { type CSSProperties, type MouseEvent as ReactMouseEvent, useEffect, useState } from "react";
import type { ArtifactKind } from "../types/artifact";
import { AiPanel } from "./AiPanel";
import styles from "./FloatingAiPanel.module.scss";
import {
  clampFloatingRect,
  type FloatingRect,
  loadFloatingRect,
  saveFloatingRect,
  viewportSize,
} from "./floatingBounds";

export interface FloatingAiPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: () => void;
  mode?: "workspace" | "hub";
  variant?: "float" | "dock";
  /** Hub: open create modal prefilled from NL parse. */
  onHubCreateRequest?: (kind: ArtifactKind | undefined, name?: string) => void;
}

/** Parse MVP keywords → artifact kind for hub AI create flow. */
export function parseKindFromText(text: string): ArtifactKind | null {
  const t = text.toLowerCase();
  if (/小程序|miniprogram|mini\s*program|微信/.test(t)) return "miniprogram";
  if (/智能家居|家居|smarthome|smart\s*home/.test(t)) return "smarthome";
  if (/esp32|stm32|firmware|pcb|hardware|beacon|rover/.test(t)) return "iot";
  if (/物联网|iot|传感器网/.test(t)) return "iot";
  if (/网站|网页|web|落地页|博客|landing/.test(t)) return "web";
  if (/learn|结对|pair programming/.test(t)) return "free";
  if (/玩具|toy|机器人/.test(t)) return "toy";
  if (/练习|课程|exercise|lesson/.test(t)) return "exercise";
  if (/自由|free\s*code|随便写/.test(t)) return "free";
  return null;
}

export function FloatingAiPanel({
  open,
  onOpenChange,
  onToggle,
  mode = "workspace",
  variant = "float",
  onHubCreateRequest,
}: FloatingAiPanelProps) {
  const [hubPendingKind, setHubPendingKind] = useState<ArtifactKind | null>(null);
  const [float, setFloatState] = useState<FloatingRect>(() => loadFloatingRect());

  useEffect(() => {
    if (variant !== "float") return;
    const onResize = () => {
      setFloatState((prev) => saveFloatingRect(clampFloatingRect(prev, viewportSize())));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [variant]);

  const setFloat = (rect: Partial<FloatingRect>) => {
    setFloatState((prev) =>
      saveFloatingRect(clampFloatingRect({ ...prev, ...rect }, viewportSize())),
    );
  };

  const handleHubUserMessage = (text: string) => {
    if (mode !== "hub" || !onHubCreateRequest) return false;
    const kind = parseKindFromText(text);
    if (kind) {
      setHubPendingKind(kind);
      onHubCreateRequest(kind);
      return true;
    }
    if (hubPendingKind) {
      // Treat follow-up as project name after kind was chosen.
      const name = text.trim();
      if (name) {
        onHubCreateRequest(hubPendingKind, name);
        setHubPendingKind(null);
        return true;
      }
    }
    return false;
  };

  const onHeaderMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (variant !== "float") return;
    const target = event.target as HTMLElement;
    if (target.closest("button, select, input, textarea")) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...float };
    const move = (moveEvent: MouseEvent) => {
      setFloat({
        x: origin.x + (moveEvent.clientX - startX),
        y: origin.y + (moveEvent.clientY - startY),
      });
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const onResizeMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...float };
    const move = (moveEvent: MouseEvent) => {
      setFloat({
        width: origin.width + (moveEvent.clientX - startX),
        height: origin.height + (moveEvent.clientY - startY),
      });
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const shellStyle: CSSProperties | undefined =
    variant === "float"
      ? {
          left: float.x,
          top: float.y,
          width: float.width,
          height: float.height,
        }
      : undefined;

  const panel = (
    <aside
      className={variant === "dock" ? styles.dock : styles.shell}
      style={shellStyle}
      aria-label="AI pair dock"
    >
      <div
        className={variant === "float" ? `${styles.header} ${styles.headerDrag}` : styles.header}
        onMouseDown={onHeaderMouseDown}
      >
        <div className={styles.title}>
          <AnthropicFilled />
          <span>AI pair</span>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close AI dock"
          onClick={() => onOpenChange(false)}
        >
          <CloseOutlined />
        </button>
      </div>
      {mode === "hub" && (
        <p className={styles.hubHint}>
          Try: “help me learn JavaScript”, “ESP32 air quality node”, “create a landing page”.
        </p>
      )}
      <div className={styles.body}>
        <AiPanel
          hideHeader
          hubMode={mode === "hub"}
          onHubIntercept={mode === "hub" ? handleHubUserMessage : undefined}
        />
      </div>
      {variant === "float" ? (
        <div className={styles.resize} onMouseDown={onResizeMouseDown} aria-hidden />
      ) : null}
    </aside>
  );

  if (variant === "dock") {
    return open ? panel : null;
  }

  return (
    <>
      {!open && (
        <FloatButton
          icon={<AnthropicFilled />}
          tooltip="AI pair"
          onClick={onToggle}
          style={{ right: 24, bottom: 24 }}
        />
      )}
      {open && panel}
    </>
  );
}
