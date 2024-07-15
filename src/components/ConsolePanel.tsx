import { useWorkspaceStore } from '../stores/workspace';

export function ConsolePanel() {
  const { consoleOutput } = useWorkspaceStore();

  return (
    <div className="console-panel">
      <div className="panel-header">控制台</div>
      <pre className="console-output">
        {consoleOutput.length === 0 ? '// 运行代码后输出将显示在这里' : consoleOutput.join('\n')}
      </pre>
    </div>
  );
}
