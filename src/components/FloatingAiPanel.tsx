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
  /** Hub: open create modal prefilled from NL parse. */
  onHubCreateRequest?: (kind: ArtifactKind | undefined, name?: string) => void;
}

/** Parse MVP keywords → artifact kind for hub AI create flow. */
export function parseKindFromText(text: string): ArtifactKind | null {
  const t = text.toLowerCase();
  if (/小程序|miniprogram|mini\s*program|微信/.test(t)) return "miniprogram";
  if (/智能家居|家居|smarthome|smart\s*home/.test(t)) return "smarthome";
  if (/物联网|iot|传感器网/.test(t)) return "iot";
  if (/玩具|toy|机器人/.test(t)) return "toy";
  if (/练习|课程|exercise|lesson/.test(t)) return "exercise";
  if (/自由|free\s*code|随便写/.test(t)) return "free";
  if (/网站|网页|web|落地页|博客/.test(t)) return "web";
  return null;
}

export function FloatingAiPanel({
  open,
  onOpenChange,
  onToggle,
  mode = "workspace",
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

  return (
    <>
      {!open && (
        <FloatButton
          icon={<AnthropicFilled />}
          tooltip="AI 助手"
          onClick={onToggle}
          style={{ right: 24, bottom: 24 }}
        />
      )}

      {open && (
        <aside className={styles.shell} aria-label="AI 助手面板">
          <div className={styles.header}>
            <div className={styles.title}>
              <AnthropicFilled />
              <span>AI 助手</span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="关闭"
              onClick={() => onOpenChange(false)}
            >
              <CloseOutlined />
            </button>
          </div>
          {mode === "hub" && (
            <p className={styles.hubHint}>
              试试：「帮我做一个网站」「创建小程序」「智能家居灯光场景」。识别类型后可继续告诉我项目名称。
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
      )}
    </>
  );
}
