import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../stores/workspace';

export function MonacoEditorPanel() {
  const { code, setCode, markMonacoEdited, languageId, getActiveLanguagePlugin, activeFilePath } =
    useWorkspaceStore();
  const skipEditMark = useRef(false);
  const plugin = getActiveLanguagePlugin();
  const monacoLang =
    activeFilePath?.endsWith(".cpp") || activeFilePath?.endsWith(".c") || activeFilePath?.endsWith(".h")
      ? "cpp"
      : activeFilePath?.endsWith(".json")
        ? "json"
        : activeFilePath?.endsWith(".md")
          ? "markdown"
          : (plugin?.monacoLanguageId ?? "javascript");

  useEffect(() => {
    skipEditMark.current = true;
  }, [code, languageId]);

  return (
    <div className="monaco-container">
      <Editor
        key={`${languageId}:${activeFilePath}`}
        height="100%"
        language={monacoLang}
        theme="vs-dark"
        value={code}
        onChange={(v) => {
          setCode(v ?? '');
          if (skipEditMark.current) {
            skipEditMark.current = false;
            return;
          }
          markMonacoEdited();
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12 },
          lineNumbers: 'on',
          roundedSelection: true,
        }}
      />
    </div>
  );
}
