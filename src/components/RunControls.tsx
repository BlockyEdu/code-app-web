import { useCallback, useEffect, useState } from "react";
import type { CodeRuntimeConfig } from "../lib/api";
import { UnauthorizedError } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";
import {
  fetchRuntimeConfig,
  formatExecuteResult,
  isElectronHost,
  type RunTier,
  runCloudPro,
  runLocalPro,
  runPreview,
} from "../lib/execute";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";
import { ProRunModal } from "./ProRunModal";

export function RunControls() {
  useLocaleStore((s) => s.locale);
  const { code, languageId, clearConsole, appendConsole } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const openLogin = useAuthStore((s) => s.openLoginPrompt);
  const [runtime, setRuntime] = useState<CodeRuntimeConfig | null>(null);
  const [busy, setBusy] = useState<RunTier | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  const refreshRuntime = useCallback(() => {
    fetchRuntimeConfig()
      .then(setRuntime)
      .catch(() =>
        setRuntime({
          preview: { engines: [] },
          pro: { enabled: true, canExecute: false },
          piston: { reachable: false, url: "" },
          supportedLanguages: [],
        }),
      );
  }, []);

  // Re-fetch after login; `user` is the signal, not a value used inside.
  // biome-ignore lint/correctness/useExhaustiveDependencies: user identity change
  useEffect(() => {
    refreshRuntime();
  }, [refreshRuntime, user]);

  const canPro =
    runtime?.pro.canExecute &&
    runtime?.pro.enabled &&
    (runtime?.piston.reachable || isElectronHost());

  const runTier = async (tier: RunTier) => {
    clearConsole();
    setBusy(tier);
    try {
      if (tier === "preview") {
        appendConsole(`[info] ${t("run.consoleLog")}`);
        const result = await runPreview(languageId, code);
        if (result.error) appendConsole(`[error] ${result.error}`);
        result.logs.forEach(appendConsole);
        return;
      }
      if (tier === "local") {
        appendConsole(`[info] ${t("run.localProLog")}`);
        const result = await runLocalPro(languageId, code);
        if (result.error) appendConsole(`[error] ${result.error}`);
        result.logs.forEach(appendConsole);
        return;
      }
      if (!user) {
        openLogin();
        appendConsole(`[info] ${t("run.needLogin")}`);
        return;
      }
      if (!runtime?.pro.canExecute) {
        setShowProModal(true);
        appendConsole(`[info] ${t("run.needPro")}`);
        return;
      }
      if (!runtime?.piston.reachable) {
        appendConsole(`[error] ${t("run.pistonDown")}`);
        return;
      }
      appendConsole(`[info] ${t("run.cloudProLog")}`);
      const result = await runCloudPro(languageId, code);
      formatExecuteResult(result).forEach(appendConsole);
    } catch (err) {
      if (err instanceof UnauthorizedError) openLogin();
      appendConsole(`[error] ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="run-controls">
        <button
          type="button"
          className="btn-run btn-run--preview"
          disabled={busy !== null}
          onClick={() => runTier("preview")}
          title={t("run.consoleTitle")}
        >
          {busy === "preview" ? "…" : "▶"} {t("run.console")}
        </button>
        {isElectronHost() ? (
          <button
            type="button"
            className="btn-run btn-run--local"
            disabled={busy !== null}
            onClick={() => runTier("local")}
            title={t("run.localProTitle")}
          >
            {busy === "local" ? "…" : "▶"} {t("run.localPro")}
          </button>
        ) : (
          <button
            type="button"
            className={`btn-run btn-run--pro ${canPro ? "" : "btn-run--locked"}`}
            disabled={busy !== null}
            onClick={() => runTier("cloud")}
            title={
              canPro
                ? t("run.cloudProTitle")
                : t("run.lockedTitle", {
                    status: runtime?.piston.reachable
                      ? t("run.sandboxOnline")
                      : t("run.sandboxOffline"),
                  })
            }
          >
            {busy === "cloud" ? "…" : "▶"} Pro
            {!canPro && <span className="run-pro-badge">Pro</span>}
          </button>
        )}
        {runtime && (
          <span className="run-status" title={runtime.piston.url}>
            {runtime.piston.reachable ? t("run.sandboxUp") : t("run.sandboxDown")}
            {runtime.pro.canExecute ? t("run.proActive") : ""}
          </span>
        )}
      </div>
      {showProModal && <ProRunModal onClose={() => setShowProModal(false)} />}
    </>
  );
}
