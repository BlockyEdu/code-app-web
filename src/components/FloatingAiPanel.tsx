import { AnthropicFilled, CloseOutlined } from "@ant-design/icons";
import { FloatButton } from "antd";
import { useState } from "react";
import type { ArtifactKind } from "../types/artifact";
import { AiPanel } from "./AiPanel";
import styles from "./FloatingAiPanel.module.scss";

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

  const panel = (
    <aside className={variant === "dock" ? styles.dock : styles.shell} aria-label="AI pair dock">
      <div className={styles.header}>
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
