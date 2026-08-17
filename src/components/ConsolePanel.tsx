import { useWorkspaceStore } from '../stores/workspace';

export function ConsolePanel() {
  const { consoleOutput, lastRunError, setAiOpen, setAiMode } = useWorkspaceStore((s) => ({
    consoleOutput: s.consoleOutput,
    lastRunError: s.lastRunError,
    setAiOpen: s.setAiOpen,
    setAiMode: s.setAiMode,
  }));

  return (
    <div className="console-panel">
      <div className="panel-header">
        控制台
        {lastRunError && (
          <button
            type="button"
            className="btn-sm"
            onClick={() => {
              setAiMode("debug");
              setAiOpen(true);
            }}
          >
            问 AI
          </button>
        )}
      </div>
      <pre className="console-output">
        {consoleOutput.length === 0 ? '// 运行代码后输出将显示在这里' : consoleOutput.join('\n')}
      </pre>
    </div>
  );
}
