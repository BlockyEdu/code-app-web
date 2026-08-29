import { useEffect, useState } from "react";
import { useAiSettings } from "../hooks/useAiSettings";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";
import { PAIR_PHASE_LABEL, type PairAction } from "../lib/pair-mission";
import { requestWorkspaceRun, track } from "../lib/telemetry";
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
    lastRunError,
    teachingDepth,
    aiMode,
    pendingPatch,
    artifactKind,
    artifactId,
    addAiMessage,
    setAiLoading,
    setAiCoachHint,
    setTeachingDepth,
    setAiMode,
    setPendingPatch,
    applyPendingPatch,
    pairMission,
    applyPairAction,
    getCurrentGoal,
    lesson,
    lessonStepIndex,
  } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  const { aiOpts, ready } = useAiSettings();
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
      setAiCoachHint("无法获取提示，请检查登录与网络", e instanceof Error ? e.message : "重试");
    } finally {
      setAiLoading(false);
    }
  };

  // Fetch once when the session/goal is ready; avoid refetch loops on hint text.
  // biome-ignore lint/correctness/useExhaustiveDependencies: session bootstrap only
  useEffect(() => {
    if (hubMode) return;
    if (goal && user && ready && !aiNextHint) {
      void fetchHint();
    }
  }, [goal, user, ready, hubMode]);

  const send = async () => {
    if (!input.trim() || aiLoading) return;
    const text = input.trim();
    if (hubMode && onHubIntercept?.(text)) {
      const userMsg = { role: "user" as const, content: text };
      addAiMessage(userMsg);
      addAiMessage({
        role: "assistant",
        content: "已识别创作意图。请在弹出的新建项目对话框中确认名称与语言，或继续告诉我项目名称。",
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
        teachingDepth,
        lastError: lastRunError ?? undefined,
        consoleOutput,
        blockXml: editorMode === "blockly" ? blockXml : undefined,
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
      const res = await api.aiFixCode(code, lastRunError?.message, {
        ...aiOpts,
        ...artifactCtx,
        lastError: lastRunError ?? undefined,
        teachingDepth,
      });
      addAiMessage({
        role: "assistant",
        content: `**代码修复建议**\n${res.explanation}\n请确认 diff 后再应用。`,
      });
      if (res.fixedCode && res.fixedCode !== code) {
        setPendingPatch({ original: code, proposed: res.fixedCode });
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

  const runPairAction = (action: PairAction) => {
    applyPairAction(action);
  };

  const explain = async () => {
    if (!requireAuth()) return;
    runPairAction("explain");
    setInput("");
    const prompt =
      "Explain the current code and the active mission in simple language. Do not write a patch.";
    addAiMessage({ role: "user", content: "Explain" });
    if (!ready) return;
    setAiLoading(true);
    try {
      const res = await api.aiChat([...aiMessages, { role: "user", content: prompt }], {
        ...aiOpts,
        ...artifactCtx,
        code,
        editorMode,
        teachingDepth,
        lastError: lastRunError ?? undefined,
        consoleOutput,
        blockXml: editorMode === "blockly" ? blockXml : undefined,
      });
      addAiMessage({ role: "assistant", content: res.content });
    } catch (err) {
      addAiMessage({
        role: "assistant",
        content: `Explain failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const hint = async () => {
    runPairAction("hint");
    await fetchHint();
  };

  const implement = async () => {
    runPairAction("implement");
    await fixCode();
  };

  const test = () => {
    runPairAction("test");
    addAiMessage({
      role: "assistant",
      content: "Running tests/preview. Publish, flash, and factory order are not in this action.",
    });
    requestWorkspaceRun();
  };

  const review = async () => {
    if (!requireAuth() || !ready) return;
    runPairAction("review");
    setAiLoading(true);
    try {
      const res = await api.aiReview({
        ...aiOpts,
        ...artifactCtx,
        code,
        blockXml,
        teachingDepth,
      });
      addAiMessage({
        role: "assistant",
        content: res.summary || JSON.stringify(res.dimensions ?? []),
      });
    } catch (err) {
      addAiMessage({
        role: "assistant",
        content: `Review failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      {!hideHeader && (
        <div className="panel-header ai-panel-header">
          <span>AI 编程助手</span>
          <span className="ai-mode-tag">{editorMode === "blockly" ? "积木" : "专业"}</span>
        </div>
      )}

      <div className="ai-model-picker">
        <label>
          模式
          <select value={aiMode} onChange={(e) => setAiMode(e.target.value as typeof aiMode)}>
            <option value="tutor">Tutor</option>
            <option value="debug">Debug</option>
            <option value="review">Review</option>
            <option
              value="agent"
              disabled={teachingDepth === "beginner" || teachingDepth === "guided"}
            >
              Agent
            </option>
          </select>
        </label>
        <label>
          教学深度
          <select
            value={teachingDepth}
            onChange={(e) => setTeachingDepth(e.target.value as typeof teachingDepth)}
          >
            <option value="beginner">入门</option>
            <option value="guided">引导</option>
            <option value="normal">常规</option>
            <option value="expert">专家</option>
          </select>
        </label>
      </div>

      {!hubMode && (
        <div className="ai-goal-card">
          <div className="ai-goal-label">Mission · {PAIR_PHASE_LABEL[pairMission.phase]}</div>
          <p>
            {pairMission.title}: {pairMission.success}
          </p>
        </div>
      )}

      {!hubMode && (
        <div className="ai-hint-card">
          <div className="ai-hint-head">
            <strong>Hint</strong>
            <button
              type="button"
              className="btn-sm"
              onClick={() => void hint()}
              disabled={aiLoading}
            >
              Refresh
            </button>
          </div>
          {aiNextHint ? (
            <>
              <p className="ai-hint-text">{aiNextHint}</p>
              {aiNextAction && <p className="ai-next-action">👉 {aiNextAction}</p>}
            </>
          ) : (
            <p className="muted">Sign in to get a Socratic hint</p>
          )}
        </div>
      )}

      {!hubMode && (
        <div className="ai-quick-actions">
          <button
            type="button"
            className="btn-sm"
            onClick={() => void explain()}
            disabled={aiLoading}
          >
            Explain
          </button>
          <button type="button" className="btn-sm" onClick={() => void hint()} disabled={aiLoading}>
            Hint
          </button>
          <button
            type="button"
            className="btn-sm"
            onClick={() => void implement()}
            disabled={aiLoading}
          >
            Implement
          </button>
          <button type="button" className="btn-sm" onClick={test} disabled={aiLoading}>
            Test
          </button>
          <button
            type="button"
            className="btn-sm"
            onClick={() => void review()}
            disabled={aiLoading}
          >
            Review
          </button>
        </div>
      )}
      {pendingPatch && (
        <div className="ai-hint-card">
          <strong>Confirm patch — will not publish, flash, or order</strong>
          <pre className="ai-hint-text">{pendingPatch.proposed.slice(0, 400)}</pre>
          <div className="ai-quick-actions">
            <button type="button" className="btn-sm" onClick={() => applyPendingPatch()}>
              Apply
            </button>
            <button
              type="button"
              className="btn-sm"
              onClick={() => {
                setPendingPatch(null);
                track("pair.patch.rejected");
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      <div className="ai-messages">
        {aiMessages.length === 0 && (
          <p className="muted">
            {hubMode ? "用自然语言描述想创建的项目类型…" : "问我编程问题，或使用上方快捷按钮"}
          </p>
        )}
        {aiMessages.map((m) => (
          <div key={`${m.role}:${m.content}`} className={`ai-msg ai-msg--${m.role}`}>
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
