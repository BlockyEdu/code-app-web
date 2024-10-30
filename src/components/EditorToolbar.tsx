import { useWorkspaceStore } from "../stores/workspace";

/**
 * Compact mode hint under WorkspaceHeader.
 * Mode switching lives in the header Segmented control.
 */
export function EditorToolbar() {
  const editorMode = useWorkspaceStore((s) => s.editorMode);
  const monacoManuallyEdited = useWorkspaceStore((s) => s.monacoManuallyEdited);
  const getActiveLanguagePlugin = useWorkspaceStore((s) => s.getActiveLanguagePlugin);
  const langPlugin = getActiveLanguagePlugin();
  const isBlockly = editorMode === "blockly";

  return (
    <div className={`editor-toolbar editor-toolbar--${editorMode}`}>
      <div className="editor-toolbar-mode">
        <span className={`mode-badge mode-badge--${editorMode}`}>
          {isBlockly ? "积木模式" : "专业模式"}
        </span>
        <span className="mode-desc">
          {langPlugin ? `${langPlugin.name} · ` : ""}
          {isBlockly
            ? "拖拽积木编程；顶部可切换专业模式"
            : monacoManuallyEdited
              ? "已手改代码 · 回到积木将丢失未同步修改"
              : "Monaco 专业编辑 · 顶部可切回积木"}
        </span>
      </div>
    </div>
  );
}
