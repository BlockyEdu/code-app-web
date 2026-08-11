import { useEffect, useState } from "react";
import { useAiSettings } from "../hooks/useAiSettings";
import type { AiProviderId } from "../lib/ai-settings";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";
import { useWorkspaceStore } from "../stores/workspace";

interface AiPanelProps {
  hideHeader?: boolean;
  hubMode?: boolean;
  /** Return true if the message was handled (skip normal AI chat). */
  onHubIntercept?: (text: string) => boolean;
}

export function AiPanel({ hideHeader = false, hubMode = false, onHubIntercept }: AiPanelProps) {
  const {
    code,
    blockXml,
    editorMode,
    aiMessages,
    aiLoading,
    aiNextHint,
    aiNextAction,
    consoleOutput,
    artifactKind,
    artifactId,
    addAiMessage,
    setAiLoading,
    setAiCoachHint,
    getCurrentGoal,
    lesson,
    lessonStepIndex,
  } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  const { config, settings, aiOpts, setProvider, setModel, currentProvider, ready } =
    useAiSettings();
  const [input, setInput] = useState("");

  const goal = getCurrentGoal();
  const stepTitle = lesson?.steps[lessonStepIndex]?.title;
  const artifactCtx = {
    kind: artifactKind,
    ...(artifactId ? { artifactId } : {}),
  };

  const requireAuth = () => {
    if (user) return true;
    openLoginPrompt();
    return false;
  };

  const fetchHint = async () => {
    if (hubMode) return;
    if (!requireAuth() || !ready) return;
    setAiLoading(true);
    try {
      const res = await api.aiCoachHint({
        ...aiOpts,
        ...artifactCtx,
        code,
        blockXml: editorMode === "blockly" ? blockXml : undefined,
        editorMode,
        goal,
        lessonStep: stepTitle,
        consoleOutput,
      });
      setAiCoachHint(res.hint, res.nextAction);
    } catch (e) {
      setAiCoachHint(
        "无法获取提示，请检查登录与网络",
        e instanceof Error ? e.message : "重试",
      );
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (hubMode) return;
    if (goal && user && ready && !aiNextHint) {
      void fetchHint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch when goal/session ready
  }, [goal, stepTitle, editorMode, user, ready, settings?.provider, settings?.model, hubMode]);

  const send = async () => {
    if (!input.trim() || aiLoading) return;
    const text = input.trim();
    if (hubMode && onHubIntercept?.(text)) {
      const userMsg = { role: "user" as const, content: text };
      addAiMessage(userMsg);
      addAiMessage({
        role: "assistant",
        content:
          "已识别创作意图。请在弹出的新建项目对话框中确认名称与语言，或继续告诉我项目名称。",
      });
      setInput("");
      return;
    }
    if (!ready) return;
    if (!requireAuth()) return;
    const userMsg = { role: "user" as const, content: text };
    addAiMessage(userMsg);
    setInput("");
    setAiLoading(true);
    try {
      const res = await api.aiChat([...aiMessages, userMsg], {
        ...aiOpts,
        ...artifactCtx,
        code,
        editorMode,
      });
      addAiMessage({ role: "assistant", content: res.content });
    } catch (err) {
      addAiMessage({
        role: "assistant",
        content: `请求失败：${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const fixCode = async () => {
    if (!requireAuth() || !ready) return;
    setAiLoading(true);
    try {
      const res = await api.aiFixCode(code, undefined, { ...aiOpts, ...artifactCtx });
      addAiMessage({
        role: "assistant",
        content: `**代码修复**\n${res.explanation}${res.mock ? "\n\n_(降级/Mock)_" : ""}`,
      });
      if (res.fixedCode && res.fixedCode !== code) {
        useWorkspaceStore.getState().setCode(res.fixedCode);
        if (editorMode === "monaco") {
          useWorkspaceStore.getState().markMonacoEdited();
        }
      }
    } catch (err) {
      addAiMessage({
        role: "assistant",
        content: `修复失败：${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const explain = () => {
    if (!requireAuth()) return;
    setInput("请用简单中文解释我当前的代码在做什么");
  };

  return (
    <div className="ai-panel">
      {!hideHeader && (
        <div className="panel-header ai-panel-header">
          <span>AI 编程助手</span>
          <span className="ai-mode-tag">{editorMode === "blockly" ? "积木" : "专业"}</span>
        </div>
      )}

      {ready && settings && config && (
        <div className="ai-model-picker">
          <label>
            模型
            <select
              value={settings.provider}
              onChange={(e) => setProvider(e.target.value as AiProviderId)}
            >
              {config.providers.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.configured}>
                  {p.name}
                  {!p.configured ? " (未配置)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            版本
            <select
              value={settings.model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!currentProvider?.configured}
            >
              {currentProvider?.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!hubMode && goal && (
        <div className="ai-goal-card">
          <div className="ai-goal-label">当前目标</div>
          <p>{goal}</p>
        </div>
      )}

      {!hubMode && (
        <div className="ai-hint-card">
          <div className="ai-hint-head">
            <strong>下一步提示</strong>
            <button type="button" className="btn-sm" onClick={() => void fetchHint()} disabled={aiLoading}>
              刷新
            </button>
          </div>
          {aiNextHint ? (
            <>
              <p className="ai-hint-text">{aiNextHint}</p>
              {aiNextAction && <p className="ai-next-action">👉 {aiNextAction}</p>}
            </>
          ) : (
            <p className="muted">登录后获取 AI 提示</p>
          )}
        </div>
      )}

      {!hubMode && (
        <div className="ai-quick-actions">
          <button type="button" className="btn-sm" onClick={() => void fetchHint()} disabled={aiLoading}>
            下一步
          </button>
          <button type="button" className="btn-sm" onClick={explain} disabled={aiLoading}>
            解释代码
          </button>
          <button type="button" className="btn-sm" onClick={() => void fixCode()} disabled={aiLoading}>
            修复
          </button>
        </div>
      )}

      <div className="ai-messages">
        {aiMessages.length === 0 && (
          <p className="muted">
            {hubMode
              ? "用自然语言描述想创建的项目类型…"
              : "问我编程问题，或使用上方快捷按钮"}
          </p>
        )}
        {aiMessages.map((m, i) => (
          <div key={i} className={`ai-msg ai-msg--${m.role}`}>
            <strong>{m.role === "user" ? "你" : "AI"}：</strong>
            <span>{m.content}</span>
          </div>
        ))}
        {aiLoading && <p className="muted">思考中…</p>}
      </div>

      <div className="ai-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void send()}
          placeholder={hubMode ? "例如：帮我做一个网站…" : "输入问题…"}
          disabled={aiLoading}
        />
        <button type="button" onClick={() => void send()} disabled={aiLoading || !input.trim()}>
          发送
        </button>
      </div>
    </div>
  );
}
