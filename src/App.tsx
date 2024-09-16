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
import {
  EntitlementRequiredError,
  setEntitlementRequiredHandler,
  setUnauthorizedHandler,
} from './lib/api';
import { useAuthStore } from './lib/auth-store';
import { useMembershipStore } from './lib/membership-store';
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
  const user = useAuthStore((s) => s.user);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  const ensureTrialOnEntry = useMembershipStore((s) => s.ensureTrialOnEntry);
  const isAuthCallback = window.location.pathname === '/auth/callback';

  useEffect(() => {
    setUnauthorizedHandler(openLoginPrompt);
    setEntitlementRequiredHandler((err: EntitlementRequiredError) => {
      const edu =
        import.meta.env.VITE_EDU_APP_URL?.replace(/\/$/, '') || 'http://localhost:18082';
      const go = window.confirm(`${err.message}\n\n前往套餐页升级？`);
      if (go) window.location.href = `${edu}/membership`;
    });
  }, [openLoginPrompt]);

  useEffect(() => {
    if (localStorage.getItem('blockyedu_token')) fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user) void ensureTrialOnEntry();
  }, [user, ensureTrialOnEntry]);

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
