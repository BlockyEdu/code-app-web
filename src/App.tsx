import { useEffect } from 'react';
import { AiPanel } from './components/AiPanel';
import { AuthBanner } from './components/AuthBanner';
import { BlocklyEditor } from './components/BlocklyEditor';
import { BlocklyUnsupportedNotice } from './components/BlocklyUnsupportedNotice';
import { ConsolePanel } from './components/ConsolePanel';
import { EditorToolbar } from './components/EditorToolbar';
import { Header } from './components/Header';
import { LessonPanel } from './components/LessonPanel';
import { MonacoEditorPanel } from './components/MonacoEditorPanel';
import { ProjectPanel } from './components/ProjectPanel';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { setUnauthorizedHandler } from './lib/api';
import { useAuthStore } from './lib/auth-store';
import { useWorkspaceStore } from './stores/workspace';

function EditorArea() {
  const editorMode = useWorkspaceStore((s) => s.editorMode);
  const plugin = useWorkspaceStore((s) => s.getActiveLanguagePlugin());

  if (editorMode === 'blockly') {
    if (plugin?.blockly) return <BlocklyEditor />;
    return <BlocklyUnsupportedNotice />;
  }
  return <MonacoEditorPanel />;
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  const isAuthCallback = window.location.pathname === '/auth/callback';

  useEffect(() => {
    setUnauthorizedHandler(openLoginPrompt);
  }, [openLoginPrompt]);

  useEffect(() => {
    if (localStorage.getItem('blockyedu_token')) fetchMe();
  }, [fetchMe]);

  if (isAuthCallback) {
    return <AuthCallbackPage />;
  }

  return (
    <div className="app">
      <Header />
      <AuthBanner />
      <div className="app-body">
        <aside className="sidebar-left">
          <LessonPanel />
          <ProjectPanel />
        </aside>
        <main className="editor-main">
          <EditorToolbar />
          <EditorArea />
          <ConsolePanel />
        </main>
        <aside className="sidebar-right">
          <AiPanel />
        </aside>
      </div>
    </div>
  );
}
