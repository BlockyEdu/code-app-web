import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { isAppStudioKind, useWorkspaceStore } from "../stores/workspace";

/**
 * Compact mode hint under WorkspaceHeader.
 * Mode switching lives in the header Segmented control.
 */
export function EditorToolbar() {
  useLocaleStore((s) => s.locale);
  const editorMode = useWorkspaceStore((s) => s.editorMode);
  const monacoManuallyEdited = useWorkspaceStore((s) => s.monacoManuallyEdited);
  const getActiveLanguagePlugin = useWorkspaceStore((s) => s.getActiveLanguagePlugin);
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const surfaceMode = useWorkspaceStore((s) => s.surfaceMode);
  const langPlugin = getActiveLanguagePlugin();
  const isBlockly = editorMode === "blockly";
  const blogStudio = isAppStudioKind(artifactKind, templateId);

  if (blogStudio) {
    const copy: Record<string, { badge: string; desc: string }> = {
      design: { badge: t("editor.surfaceDesign"), desc: t("editor.surfaceDesignDesc") },
      data: { badge: t("editor.surfaceData"), desc: t("editor.surfaceDataDesc") },
      logic: { badge: t("editor.surfaceLogic"), desc: t("editor.surfaceLogicDesc") },
      code: { badge: t("editor.surfaceCode"), desc: t("editor.surfaceCodeDesc") },
    };
    const cur = copy[surfaceMode] ?? copy.design;
    return (
      <div className={`editor-toolbar editor-toolbar--${surfaceMode}`}>
        <div className="editor-toolbar-mode">
          <span className={`mode-badge mode-badge--monaco`}>{cur.badge}</span>
          <span className="mode-desc">{cur.desc}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`editor-toolbar editor-toolbar--${editorMode}`}>
      <div className="editor-toolbar-mode">
        <span className={`mode-badge mode-badge--${editorMode}`}>
          {isBlockly ? t("editor.toolbarBlocks") : t("editor.toolbarPro")}
        </span>
        <span className="mode-desc">
          {langPlugin ? `${langPlugin.name} · ` : ""}
          {isBlockly
            ? t("editor.toolbarBlocksHint")
            : monacoManuallyEdited
              ? t("editor.toolbarProDirty")
              : t("editor.toolbarProHint")}
        </span>
      </div>
    </div>
  );
}
