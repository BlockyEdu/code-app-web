import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";

export function BlocklyUnsupportedNotice() {
  useLocaleStore((s) => s.locale);
  const plugin = useWorkspaceStore((s) => s.getActiveLanguagePlugin());
  const setEditorMode = useWorkspaceStore((s) => s.setEditorMode);

  return (
    <div className="blockly-unsupported">
      <p>{t("blockly.unsupported", { name: plugin?.name ?? "" })}</p>
      <button type="button" className="btn-primary-inline" onClick={() => setEditorMode("monaco")}>
        {t("blockly.switchPro")}
      </button>
    </div>
  );
}
