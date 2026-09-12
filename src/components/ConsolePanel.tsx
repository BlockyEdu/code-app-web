import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";

export function ConsolePanel() {
  // Avoid object selectors: new refs each snapshot → infinite re-render (Zustand v5).
  useLocaleStore((s) => s.locale);
  const consoleOutput = useWorkspaceStore((s) => s.consoleOutput);
  const lastRunError = useWorkspaceStore((s) => s.lastRunError);
  const setAiOpen = useWorkspaceStore((s) => s.setAiOpen);
  const setAiMode = useWorkspaceStore((s) => s.setAiMode);

  return (
    <div className="console-panel">
      <div className="panel-header">
        {t("console.title")}
        {lastRunError && (
          <button
            type="button"
            className="btn-sm"
            onClick={() => {
              setAiMode("debug");
              setAiOpen(true);
            }}
          >
            {t("console.askAi")}
          </button>
        )}
      </div>
      <pre className="console-output">
        {consoleOutput.length === 0 ? t("console.empty") : consoleOutput.join("\n")}
      </pre>
    </div>
  );
}
