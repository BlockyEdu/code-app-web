import { useEffect, useMemo, useState } from "react";
import { useAiSettings } from "../hooks/useAiSettings";
import { encodeProviderModel, parseProviderModel } from "../lib/ai-settings";
import { type AppSchemaPatch, api } from "../lib/api";
import { applySchemaPatch } from "../lib/app-studio/app-schema";
import { useAuthStore } from "../lib/auth-store";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { PAIR_PHASE_LABEL, type PairAction } from "../lib/pair-mission";
import { requestWorkspaceRun, track } from "../lib/telemetry";
import { isAppStudioKind, useWorkspaceStore } from "../stores/workspace";

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
    templateId,
    appSchema,
    updateAppSchema,
  } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  useLocaleStore((s) => s.locale);
  const { aiOpts, ready, config, settings, selectProviderModel } = useAiSettings();
  const [input, setInput] = useState("");
  const [pendingAppPatch, setPendingAppPatch] = useState<AppSchemaPatch | null>(null);
  const blogStudio = isAppStudioKind(artifactKind, templateId);

  const goal = getCurrentGoal();
  const stepTitle = lesson?.steps[lessonStepIndex]?.title;
  const artifactCtx = {
    kind: artifactKind,
    ...(artifactId ? { artifactId } : {}),
  };
  const modelOptions = useMemo(() => {
    if (!config) return [];
    return config.providers.flatMap((provider) =>
      provider.models.map((model) => ({
        value: encodeProviderModel(provider.id, model.id),
        label: `${provider.name} / ${model.name}`,
        configured: provider.configured,
        disabled: !provider.configured,
      })),
    );
  }, [config]);
  const modelValue = settings ? encodeProviderModel(settings.provider, settings.model) : "";

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
      setAiCoachHint(t("ai.coachFailed"), e instanceof Error ? e.message : t("ai.retry"));
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
        content: t("ai.intentOk"),
      });
      setInput("");
      return;
    }
    if (!ready) return;
    if (!requireAuth()) return;
    if (blogStudio && !hubMode) {
      await proposeAppPatch();
      return;
    }
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
        content: t("ai.requestFailed", {
          error: err instanceof Error ? err.message : String(err),
        }),
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
        content: t("ai.fixSuggest", { explanation: res.explanation }),
      });
      if (res.fixedCode && res.fixedCode !== code) {
        setPendingPatch({ original: code, proposed: res.fixedCode });
      }
    } catch (err) {
      addAiMessage({
        role: "assistant",
        content: t("ai.fixFailed", { error: err instanceof Error ? err.message : String(err) }),
      });
    } finally {
      setAiLoading(false);
    }
  };

  const runPairAction = (action: PairAction) => {
    applyPairAction(action);
  };

  const onModelChange = (value: string) => {
    const parsed = parseProviderModel(value);
    if (!parsed) return;
    selectProviderModel(parsed.provider, parsed.model);
  };

  const explain = async () => {
    if (!requireAuth()) return;
    runPairAction("explain");
    setInput("");
    const prompt =
      "Explain the current code and the active mission in simple language. Do not write a patch.";
    addAiMessage({ role: "user", content: t("ai.explain") });
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
        content: t("ai.explainFailed", {
          error: err instanceof Error ? err.message : String(err),
        }),
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
      content: t("ai.testRunNote"),
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
        content: t("ai.reviewFailed", {
          error: err instanceof Error ? err.message : String(err),
        }),
      });
    } finally {
      setAiLoading(false);
    }
  };

  const proposeAppPatch = async () => {
    if (!requireAuth() || !ready) return;
    const instruction = input.trim();
    if (!instruction || !artifactId || !appSchema) {
      addAiMessage({
        role: "assistant",
        content: t("ai.needBlog"),
      });
      return;
    }
    const userMsg = { role: "user" as const, content: instruction };
    addAiMessage(userMsg);
    setInput("");
    setAiLoading(true);
    try {
      const res = await api.aiProposeAppPatch({
        artifactId,
        instruction,
        schema: appSchema,
      });
      setPendingAppPatch(res);
      addAiMessage({
        role: "assistant",
        content: `**${t("ai.pagePatchTitle")}**\n${res.summary ?? ""}\n\`\`\`json\n${JSON.stringify(res.operations, null, 2)}\n\`\`\``,
      });
    } catch (err) {
      addAiMessage({
        role: "assistant",
        content: t("ai.proposeFailed", {
          error: err instanceof Error ? err.message : String(err),
        }),
      });
    } finally {
      setAiLoading(false);
    }
  };

  const applyAppPatch = async () => {
    if (!pendingAppPatch || !appSchema) return;
    const next =
      pendingAppPatch.schema && (!pendingAppPatch.issues || pendingAppPatch.issues.length === 0)
        ? { schema: pendingAppPatch.schema, issues: [] as Array<{ message: string }> }
        : applySchemaPatch(appSchema, pendingAppPatch.operations);
    if (next.issues.length) {
      addAiMessage({
        role: "assistant",
        content: t("ai.applyFailed", {
          error: next.issues.map((i) => i.message).join("; "),
        }),
      });
      return;
    }
    updateAppSchema(next.schema);
    if (artifactId) {
      try {
        await api.putAppSchema(artifactId, next.schema);
      } catch (err) {
        addAiMessage({
          role: "assistant",
          content: t("ai.schemaLocalOnly", {
            error: err instanceof Error ? err.message : String(err),
          }),
        });
        setPendingAppPatch(null);
        return;
      }
    }
    setPendingAppPatch(null);
    addAiMessage({
      role: "assistant",
      content: t("ai.patchApplied"),
    });
  };

  return (
    <div className="ai-panel">
      {!hideHeader && (
        <div className="panel-header ai-panel-header">
          <span>{t("ai.assistant")}</span>
          <span className="ai-mode-tag">
            {blogStudio
              ? t("ai.tagStudio")
              : editorMode === "blockly"
                ? t("ai.tagBlocks")
                : t("ai.tagPro")}
          </span>
        </div>
      )}

      <div className="ai-model-picker">
        <label>
          {t("ai.mode")}
          <select value={aiMode} onChange={(e) => setAiMode(e.target.value as typeof aiMode)}>
            <option value="tutor">{t("ai.modeTutor")}</option>
            <option value="debug">{t("ai.modeDebug")}</option>
            <option value="review">{t("ai.modeReview")}</option>
            <option
              value="agent"
              disabled={teachingDepth === "beginner" || teachingDepth === "guided"}
            >
              {t("ai.modeAgent")}
            </option>
          </select>
        </label>
        <label>
          {t("ai.depth")}
          <select
            value={teachingDepth}
            onChange={(e) => setTeachingDepth(e.target.value as typeof teachingDepth)}
          >
            <option value="beginner">{t("ai.depthBeginner")}</option>
            <option value="guided">{t("ai.depthGuided")}</option>
            <option value="normal">{t("ai.depthNormal")}</option>
            <option value="expert">{t("ai.depthExpert")}</option>
          </select>
        </label>
      </div>

      <div className="ai-panel-scroll">
        {!hubMode && (
          <div className="ai-goal-card">
            <div className="ai-goal-label">
              {t("ai.missionLabel", { phase: PAIR_PHASE_LABEL[pairMission.phase] })}
            </div>
            <p>
              {pairMission.title}: {pairMission.success}
            </p>
          </div>
        )}

        {!hubMode && (
          <div className="ai-hint-card">
            <div className="ai-hint-head">
              <strong>{t("ai.hintLabel")}</strong>
              <button
                type="button"
                className="btn-sm"
                onClick={() => void hint()}
                disabled={aiLoading}
              >
                {t("ai.refresh")}
              </button>
            </div>
            {aiNextHint ? (
              <>
                <p className="ai-hint-text">{aiNextHint}</p>
                {aiNextAction && <p className="ai-next-action">👉 {aiNextAction}</p>}
              </>
            ) : (
              <p className="muted">{t("ai.signInHint")}</p>
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
              {t("ai.explain")}
            </button>
            <button
              type="button"
              className="btn-sm"
              onClick={() => void hint()}
              disabled={aiLoading}
            >
              {t("ai.hint")}
            </button>
            <button
              type="button"
              className="btn-sm"
              onClick={() => void implement()}
              disabled={aiLoading}
            >
              {t("ai.implement")}
            </button>
            <button type="button" className="btn-sm" onClick={test} disabled={aiLoading}>
              {t("ai.test")}
            </button>
            <button
              type="button"
              className="btn-sm"
              onClick={() => void review()}
              disabled={aiLoading}
            >
              {t("ai.review")}
            </button>
          </div>
        )}
        {!hubMode && blogStudio && (
          <div className="ai-quick-actions">
            <button
              type="button"
              className="btn-sm"
              onClick={() => void proposeAppPatch()}
              disabled={aiLoading || !input.trim()}
            >
              {t("ai.changePage")}
            </button>
          </div>
        )}
        {pendingAppPatch && (
          <div className="ai-hint-card">
            <strong>{t("ai.confirmPagePatch")}</strong>
            <pre className="ai-hint-text">
              {JSON.stringify(pendingAppPatch.operations, null, 2).slice(0, 800)}
            </pre>
            <div className="ai-quick-actions">
              <button type="button" className="btn-sm" onClick={() => void applyAppPatch()}>
                {t("ai.apply")}
              </button>
              <button
                type="button"
                className="btn-sm"
                onClick={() => {
                  setPendingAppPatch(null);
                  track("pair.patch.rejected");
                }}
              >
                {t("ai.reject")}
              </button>
            </div>
          </div>
        )}
        {pendingPatch && (
          <div className="ai-hint-card">
            <strong>{t("ai.patchConfirm")}</strong>
            <pre className="ai-hint-text">{pendingPatch.proposed.slice(0, 400)}</pre>
            <div className="ai-quick-actions">
              <button type="button" className="btn-sm" onClick={() => applyPendingPatch()}>
                {t("ai.apply")}
              </button>
              <button
                type="button"
                className="btn-sm"
                onClick={() => {
                  setPendingPatch(null);
                  track("pair.patch.rejected");
                }}
              >
                {t("ai.reject")}
              </button>
            </div>
          </div>
        )}

        <div className="ai-messages">
          {aiMessages.length === 0 && (
            <p className="muted">{hubMode ? t("ai.emptyHub") : t("ai.emptyAsk")}</p>
          )}
          {aiMessages.map((m) => (
            <div key={`${m.role}:${m.content}`} className={`ai-msg ai-msg--${m.role}`}>
              <strong>{m.role === "user" ? t("ai.you") : t("ai.bot")}：</strong>
              <span>{m.content}</span>
            </div>
          ))}
          {aiLoading && <p className="muted">{t("ai.thinking")}</p>}
        </div>
      </div>

      <div className="ai-composer">
        <label className="ai-composer-model">
          {t("ai.model")}
          <select
            value={modelValue}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={!ready || modelOptions.length === 0}
          >
            {modelOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.configured ? opt.label : t("ai.modelUnconfigured", { label: opt.label })}
              </option>
            ))}
          </select>
        </label>
        <div className="ai-input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send()}
            placeholder={hubMode ? t("ai.placeholderHub") : t("ai.placeholderAsk")}
            disabled={aiLoading}
          />
          <button type="button" onClick={() => void send()} disabled={aiLoading || !input.trim()}>
            {t("ai.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
