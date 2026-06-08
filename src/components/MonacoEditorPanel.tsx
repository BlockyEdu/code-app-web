import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../stores/workspace';

export function MonacoEditorPanel() {
  const { code, setCode, markMonacoEdited, languageId, getActiveLanguagePlugin } =
    useWorkspaceStore();
  const skipEditMark = useRef(false);
  const plugin = getActiveLanguagePlugin();
  const monacoLang = plugin?.monacoLanguageId ?? 'javascript';

  useEffect(() => {
    skipEditMark.current = true;
  }, [code, languageId]);

  return (
    <div className="monaco-container">
      <Editor
        key={languageId}
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
