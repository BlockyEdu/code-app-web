import { isAppStudioKind, useWorkspaceStore } from "../stores/workspace";

/**
 * Compact mode hint under WorkspaceHeader.
 * Mode switching lives in the header Segmented control.
 */
export function EditorToolbar() {
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
      design: { badge: "Design", desc: "页面树与组件属性 · 写回 app.schema.json" },
      data: { badge: "Data", desc: "文章 CRUD · draft / published" },
      logic: { badge: "Logic", desc: "事件链路只读 · 点击卡片打开详情" },
      code: { badge: "Code", desc: "编辑 styles.css / extensions.js" },
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
