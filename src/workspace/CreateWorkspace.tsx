import { useCallback, useEffect, useState } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { AppProviders } from "../components/AppProviders";
import { AuthBanner } from "../components/AuthBanner";
import { BlocklyEditor } from "../components/BlocklyEditor";
import { BlocklyUnsupportedNotice } from "../components/BlocklyUnsupportedNotice";
import { ConsolePanel } from "../components/ConsolePanel";
import { EditorToolbar } from "../components/EditorToolbar";
import { FloatingAiPanel } from "../components/FloatingAiPanel";
import { MonacoEditorPanel } from "../components/MonacoEditorPanel";
import { api } from "../lib/api";
import { runPreview } from "../lib/execute";
import { parseWorkspaceArtifactId } from "../lib/navigate";
import { type RuntimeKind, runTargetProgram } from "../lib/targets";
import { buildHtmlFromWorld, composeStaticSiteClient } from "../lib/web-preview";
import { useWorkspaceStore } from "../stores/workspace";
import { isConsoleKind, isHomeSimKind, isTargetBlockKind } from "../types/artifact";
import { AssetsPanel } from "./AssetsPanel";
import styles from "./CreateWorkspace.module.scss";
import { PreviewPanel } from "./PreviewPanel";
import { WorkspaceHeader } from "./WorkspaceHeader";

function EditorArea() {
  const editorMode = useWorkspaceStore((s) => s.editorMode);
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const plugin = useWorkspaceStore((s) => s.getActiveLanguagePlugin());

  if (editorMode === "blockly") {
    // Create kinds always use Blockly + JS generators; console kinds need language plugin support.
    if (isTargetBlockKind(artifactKind) || plugin?.blockly) {
      return <BlocklyEditor key={artifactKind} />;
    }
    return <BlocklyUnsupportedNotice />;
  }
  return <MonacoEditorPanel />;
}

export function CreateWorkspace() {
  const rightPreviewOpen = useWorkspaceStore((s) => s.rightPreviewOpen);
  const bottomOpen = useWorkspaceStore((s) => s.bottomOpen);
  const aiOpen = useWorkspaceStore((s) => s.aiOpen);
  const setAiOpen = useWorkspaceStore((s) => s.setAiOpen);
  const toggleAiOpen = useWorkspaceStore((s) => s.toggleAiOpen);
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const languageId = useWorkspaceStore((s) => s.languageId);
  const code = useWorkspaceStore((s) => s.code);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const clearConsole = useWorkspaceStore((s) => s.clearConsole);
  const appendConsole = useWorkspaceStore((s) => s.appendConsole);
  const setBottomOpen = useWorkspaceStore((s) => s.setBottomOpen);
  const setPreviewWorld = useWorkspaceStore((s) => s.setPreviewWorld);
  const setRightPreviewOpen = useWorkspaceStore((s) => s.setRightPreviewOpen);
  const setWebPreview = useWorkspaceStore((s) => s.setWebPreview);
  const webPreviewSessionId = useWorkspaceStore((s) => s.webPreviewSessionId);
  const openArtifact = useWorkspaceStore((s) => s.openArtifact);

  const [isRunning, setIsRunning] = useState(false);
  const showPreview = rightPreviewOpen && !isConsoleKind(artifactKind);

  // Load artifact from `/workspace/:id` on mount / path change.
  useEffect(() => {
    const id = parseWorkspaceArtifactId();
    if (!id || id === artifactId) return;
    void openArtifact(id).catch(() => {
      /* invalid id / offline */
    });
  }, [artifactId, openArtifact]);

  useEffect(() => {
    const onPop = () => {
      const id = parseWorkspaceArtifactId();
      if (id && id !== useWorkspaceStore.getState().artifactId) {
        void openArtifact(id).catch(() => undefined);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openArtifact]);

  const publishWebIframe = useCallback(
    async (htmlDocument: string) => {
      if (artifactId) {
        try {
          if (webPreviewSessionId) {
            const updated = await api.updatePreviewHtml(webPreviewSessionId, htmlDocument);
            const url = updated.isolation?.embedUrl;
            if (url) {
              setWebPreview({ embedUrl: url, srcDoc: null, sessionId: updated.id });
              appendConsole("[info] 已刷新隔离预览会话");
              return;
            }
          }
          const session = await api.createPreviewSession({
            artifactId,
            kind: "web",
            htmlDocument,
          });
          const url = session.isolation?.embedUrl;
          if (url) {
            setWebPreview({ embedUrl: url, srcDoc: null, sessionId: session.id });
            appendConsole("[info] 已创建隔离 iframe 预览（opaque origin / sandbox）");
            return;
          }
        } catch {
          appendConsole("[warn] 预览会话不可用，回退到本地 srcdoc 沙箱");
        }
      }
      setWebPreview({ embedUrl: null, srcDoc: htmlDocument, sessionId: null });
      appendConsole("[info] 本地 srcdoc 沙箱预览（未登录或不走服务端）");
    },
    [artifactId, webPreviewSessionId, setWebPreview, appendConsole],
  );

  const handleRun = useCallback(async () => {
    if (!isConsoleKind(artifactKind)) {
      setIsRunning(true);
      setRightPreviewOpen(true);
      try {
        const result = runTargetProgram({
          code,
          kind: artifactKind as RuntimeKind,
        });
        setPreviewWorld(result.finalState);
        clearConsole();
        result.lines.forEach((line) => {
          const prefix =
            line.level === "error"
              ? "[error]"
              : line.level === "warn"
                ? "[warn]"
                : line.level === "system"
                  ? "[info]"
                  : "[sim]";
          appendConsole(`${prefix} ${line.text}`);
        });
        if (result.errorMessage) appendConsole(`[error] ${result.errorMessage}`);

        if (artifactKind === "web") {
          let html = buildHtmlFromWorld(result.finalState);
          if (artifactId && result.finalState.web.elements.length === 0) {
            try {
              const { files } = await api.getArtifactFiles(artifactId);
              const map: Record<string, string> = {};
              for (const f of files) map[f.path] = f.content;
              const composed = composeStaticSiteClient(map);
              if (composed) html = composed;
            } catch {
              /* keep world HTML */
            }
          }
          await publishWebIframe(html);
        }

        if (isHomeSimKind(artifactKind) && artifactId) {
          void (async () => {
            try {
              const preview = await api.createPreviewSession({
                artifactId,
                kind: "smarthome",
              });
              const sim = await api.createSmarthomeSession({
                artifactId,
                previewSessionId: preview.id,
              });
              await api.runSmarthomeSession(sim.id);
            } catch {
              /* offline / unauthenticated */
            }
          })();
        }
      } catch (err) {
        appendConsole(`[error] ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsRunning(false);
      }
      return;
    }
    setIsRunning(true);
    setBottomOpen(true);
    clearConsole();
    try {
      appendConsole("[info] 预览运行（浏览器）…");
      const result = await runPreview(languageId, code);
      if (result.error) appendConsole(`[error] ${result.error}`);
      result.logs.forEach(appendConsole);
    } catch (err) {
      appendConsole(`[error] ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  }, [
    artifactKind,
    artifactId,
    languageId,
    code,
    clearConsole,
    appendConsole,
    setBottomOpen,
    setPreviewWorld,
    setRightPreviewOpen,
    publishWebIframe,
  ]);

  return (
    <AppProviders>
      <div className={styles.workspace}>
        <WorkspaceHeader isRunning={isRunning} onRun={() => void handleRun()} />
        <AuthBanner />

        <div className={styles.body}>
          <PanelGroup orientation="horizontal" className={styles.hPanelGroup}>
            <Panel minSize="20" className={styles.panelFull}>
              <PanelGroup orientation="vertical" className={styles.vPanelGroup}>
                <Panel minSize="30" className={styles.panelFull}>
                  <div className={styles.editorShell}>
                    <EditorToolbar />
                    <div className={styles.editorBody}>
                      <EditorArea />
                    </div>
                  </div>
                </Panel>

                {bottomOpen && (
                  <>
                    <PanelResizeHandle className={styles.vResizeHandle} />
                    <Panel defaultSize="28" minSize="15" maxSize="60" className={styles.panelFull}>
                      <div className={styles.consoleShell}>
                        <ConsolePanel />
                      </div>
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>

            {showPreview && (
              <>
                <PanelResizeHandle className={styles.hResizeHandle} />
                <Panel defaultSize="28" minSize="18" maxSize="50" className={styles.panelFull}>
                  <PreviewPanel kind={artifactKind} onRefresh={() => void handleRun()} />
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>

        <AssetsPanel />

        <FloatingAiPanel
          open={aiOpen}
          onOpenChange={setAiOpen}
          onToggle={toggleAiOpen}
          mode="workspace"
        />
      </div>
    </AppProviders>
  );
}
