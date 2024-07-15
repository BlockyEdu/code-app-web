import { useWorkspaceStore } from '../stores/workspace';

export function BlocklyUnsupportedNotice() {
  const plugin = useWorkspaceStore((s) => s.getActiveLanguagePlugin());
  const setEditorMode = useWorkspaceStore((s) => s.setEditorMode);

  return (
    <div className="blockly-unsupported">
      <p>
        <strong>{plugin?.name ?? '当前语言'}</strong> 不支持积木模式，请使用专业模式编辑。
      </p>
      <button type="button" className="btn-primary-inline" onClick={() => setEditorMode('monaco')}>
        切换到专业模式
      </button>
    </div>
  );
}
