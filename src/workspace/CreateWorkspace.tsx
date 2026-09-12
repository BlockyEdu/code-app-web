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
import { useArtifactAutosave } from "../hooks/useArtifactAutosave";
import { api } from "../lib/api";
import { type BlogPostView, usesHostedPosts } from "../lib/app-studio/app-schema";
import { renderBlogHtml } from "../lib/app-studio/blog-html";
import { filesToMap } from "../lib/artifact-files";
import { runPreview } from "../lib/execute";
import { errorCodeOf } from "../lib/http";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { parseWorkspaceArtifactId } from "../lib/navigate";
import { type RuntimeKind, runTargetProgram } from "../lib/targets";
import { track } from "../lib/telemetry";
import { buildHtmlFromWorld, composeStaticSiteClient } from "../lib/web-preview";
import { isAppStudioKind, useWorkspaceStore } from "../stores/workspace";
import { isConsoleKind, isHardwareKind, isHomeSimKind, isTargetBlockKind } from "../types/artifact";
import { AssetsPanel } from "./AssetsPanel";
import { BlogDataPanel } from "./BlogDataPanel";
import { BlogLogicPanel } from "./BlogLogicPanel";
import styles from "./CreateWorkspace.module.scss";
import { DesignStudio } from "./DesignStudio";
import { PreviewPanel } from "./PreviewPanel";
import { WorkspaceHeader } from "./WorkspaceHeader";

function EditorArea() {
  const editorMode = useWorkspaceStore((s) => s.editorMode);
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const surfaceMode = useWorkspaceStore((s) => s.surfaceMode);
  const plugin = useWorkspaceStore((s) => s.getActiveLanguagePlugin());

  if (isAppStudioKind(artifactKind, templateId)) {
    if (surfaceMode === "design") return <DesignStudio />;
    if (surfaceMode === "data") {
      return usesHostedPosts(templateId) ? <BlogDataPanel /> : <DesignStudio />;
    }
    if (surfaceMode === "logic") return <BlogLogicPanel />;
    return <MonacoEditorPanel />;
  }

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
  useLocaleStore((s) => s.locale);
  const rightPreviewOpen = useWorkspaceStore((s) => s.rightPreviewOpen);
  const bottomOpen = useWorkspaceStore((s) => s.bottomOpen);
  const leftOpen = useWorkspaceStore((s) => s.leftOpen);
  const aiOpen = useWorkspaceStore((s) => s.aiOpen);
  const setAiOpen = useWorkspaceStore((s) => s.setAiOpen);
  const toggleAiOpen = useWorkspaceStore((s) => s.toggleAiOpen);
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const languageId = useWorkspaceStore((s) => s.languageId);
  const code = useWorkspaceStore((s) => s.code);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const artifactName = useWorkspaceStore((s) => s.artifactName);
  const boardSku = useWorkspaceStore((s) => s.boardSku);
  const clearConsole = useWorkspaceStore((s) => s.clearConsole);
  const appendConsole = useWorkspaceStore((s) => s.appendConsole);
  const setBottomOpen = useWorkspaceStore((s) => s.setBottomOpen);
  const setPreviewWorld = useWorkspaceStore((s) => s.setPreviewWorld);
  const setRightPreviewOpen = useWorkspaceStore((s) => s.setRightPreviewOpen);
  const setWebPreview = useWorkspaceStore((s) => s.setWebPreview);
  const setFirmwareSim = useWorkspaceStore((s) => s.setFirmwareSim);
  const saveCurrentArtifact = useWorkspaceStore((s) => s.saveCurrentArtifact);
  const webPreviewSessionId = useWorkspaceStore((s) => s.webPreviewSessionId);
  const openArtifact = useWorkspaceStore((s) => s.openArtifact);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const appSchema = useWorkspaceStore((s) => s.appSchema);
  const blogPosts = useWorkspaceStore((s) => s.blogPosts);
  const blogPreviewPage = useWorkspaceStore((s) => s.blogPreviewPage);
  const blogPreviewSlug = useWorkspaceStore((s) => s.blogPreviewSlug);
  const blogStudio = isAppStudioKind(artifactKind, templateId);

  const createNewArtifact = useWorkspaceStore((s) => s.createNewArtifact);

  const brandTitle = t("chrome.brandTitle");
  useEffect(() => {
    document.title = artifactName ? `${artifactName} · ${brandTitle}` : brandTitle;
  }, [artifactName, brandTitle]);

  const [isRunning, setIsRunning] = useState(false);
  const showPreview = rightPreviewOpen && !isConsoleKind(artifactKind);
  useArtifactAutosave();

  // Load artifact from `/workspace/:id` on mount / path change.
  useEffect(() => {
    const id = parseWorkspaceArtifactId();
    if (!id || id === artifactId) return;
    void openArtifact(id).catch(() => {
      /* invalid id / offline */
    });
  }, [artifactId, openArtifact]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("kind");
    const template = params.get("template");
    if (kind !== "iot" || !template || parseWorkspaceArtifactId() || artifactId) return;
    void createNewArtifact("iot", template, "javascript", {
      templateId: template,
      intent: "learn",
    });
  }, [artifactId, createNewArtifact]);

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
    async (htmlDocument: string, silent = false) => {
      let usedFallback = false;
      if (artifactId) {
        try {
          if (webPreviewSessionId) {
            const updated = await api.updatePreviewHtml(webPreviewSessionId, htmlDocument);
            const url = updated.isolation?.embedUrl;
            if (url) {
              setWebPreview({ embedUrl: url, srcDoc: null, sessionId: updated.id });
              if (!silent) appendConsole(`[info] ${t("preview.sessionRefreshed")}`);
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
            if (!silent) appendConsole(`[info] ${t("preview.sessionCreated")}`);
            return;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const code = errorCodeOf(err);
          const codePart = code ? ` ${code}` : "";
          appendConsole(`[error] ${t("preview.sessionFailed", { code: codePart, message })}`);
          if (code === "PREVIEW-ERR-EXPIRED" || message.includes("PREVIEW-ERR-EXPIRED")) {
            setWebPreview({ sessionId: null });
            appendConsole(`[info] ${t("preview.expiredReset")}`);
          }
          appendConsole(`[warn] ${t("preview.fallbackSrcdoc")}`);
          usedFallback = true;
        }
      }
      setWebPreview({ embedUrl: null, srcDoc: htmlDocument, sessionId: null });
      if (!silent && !usedFallback) appendConsole(`[info] ${t("preview.srcdocLocal")}`);
    },
    [artifactId, webPreviewSessionId, setWebPreview, appendConsole],
  );

  const refreshBlogPreview = useCallback(async () => {
    const s = useWorkspaceStore.getState();
    if (!isAppStudioKind(s.artifactKind, s.templateId) || !s.appSchema) return;
    const map = filesToMap(s.artifactFiles);
    if (s.activeFilePath) map[s.activeFilePath] = s.code;
    const views: BlogPostView[] = s.blogPosts.map((p) => ({
      title: p.data.title,
      slug: p.slug,
      excerpt: p.data.excerpt,
      content: p.data.content,
      publishedAt: p.publishedAt,
    }));
    const slug = s.blogPreviewPage === "post" ? s.blogPreviewSlug || views[0]?.slug || "" : "";
    const route =
      s.blogPreviewPage === "post" && slug
        ? { page: "post" as const, slug }
        : { page: "home" as const };
    let html: string | null = null;
    if (s.artifactId) {
      try {
        html = await api.getAppPreviewHtml(
          s.artifactId,
          route.page,
          route.page === "post" ? slug : undefined,
        );
      } catch {
        html = null;
      }
    }
    if (!html) {
      html = renderBlogHtml({
        schema: s.appSchema,
        posts: views,
        route,
        extraCss: map["styles.css"] ?? "",
        extraJs: map["extensions.js"] ?? "",
        mode: "preview",
      });
    }
    await publishWebIframe(html, true);
  }, [publishWebIframe]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: getState() reads posts/route/files
  useEffect(() => {
    if (!blogStudio || !appSchema) return;
    void refreshBlogPreview();
  }, [
    blogStudio,
    appSchema,
    blogPosts,
    blogPreviewPage,
    blogPreviewSlug,
    artifactId,
    code,
    refreshBlogPreview,
  ]);

  const handleRun = useCallback(async () => {
    if (isAppStudioKind(artifactKind, useWorkspaceStore.getState().templateId)) {
      setIsRunning(true);
      setRightPreviewOpen(true);
      try {
        await refreshBlogPreview();
      } catch (err) {
        appendConsole(`[error] ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsRunning(false);
      }
      return;
    }
    if (isHardwareKind(artifactKind) && useWorkspaceStore.getState().iotRunMode === "live") {
      setIsRunning(true);
      setRightPreviewOpen(true);
      setBottomOpen(true);
      clearConsole();
      try {
        const packSlug = useWorkspaceStore.getState().iotPackSlug || "smart-window";
        appendConsole(`[info] ${t("run.liveProxy")}`);
        const result = await api.runIotLabLive({
          packSlug,
          code,
          boardSku: boardSku || "board.espressif.esp32-s3-devkitc-1",
        });
        appendConsole(`[live] ${result.decision ?? result.status} ${result.reason ?? ""}`);
        if (result.command === null || result.exportOnly) {
          appendConsole(`[warn] ${t("run.liveMissing")}`);
        }
      } catch (err) {
        appendConsole(`[error] ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsRunning(false);
      }
      return;
    }
    if (isHardwareKind(artifactKind) && useWorkspaceStore.getState().iotRunMode === "firmware") {
      setIsRunning(true);
      setRightPreviewOpen(true);
      setBottomOpen(true);
      clearConsole();
      try {
        if (!artifactId) {
          appendConsole(`[error] ${t("run.saveBeforeFirmware")}`);
          return;
        }
        await saveCurrentArtifact();
        const sku = boardSku || "board.espressif.esp32-s3-devkitc-1";
        appendConsole(`[info] ${t("run.firmwareBuild")}`);
        const toolchain =
          sku.includes("nucleo") || sku.includes(".st.") ? "stm32cube" : "arduino-esp32";
        const build = await api.createFirmwareBuild({
          artifactId,
          boardSku: sku,
          toolchain,
          firmwarePath: "firmware/main.cpp",
        });
        appendConsole(
          `[build] ${build.status} digest=${build.imageDigest} reproducible=${build.reproducible}`,
        );
        if (build.logExcerpt) appendConsole(build.logExcerpt);
        track("hardware.sim.started", { artifactId, boardSku: sku });
        const sim = await api.createHardwareSim({
          artifactId,
          boardSku: sku,
          buildId: build.id,
          adapter: "auto",
        });
        appendConsole(`[sim] adapter=${sim.adapter} ${sim.exportHint}`);
        const ran = await api.runHardwareSim(sim.id);
        appendConsole(ran.serialLog || "[sim] no serial output");
        if (ran.assertions?.length) {
          for (const a of ran.assertions) {
            appendConsole(`[assert] ${a.ok ? "pass" : "fail"} ${a.name}: ${a.detail}`);
          }
        }
        if (ran.status === "export_only") {
          appendConsole(
            "[sim] export_only — not a live pass (need wokwi-cli + firmware.bin, or qemu + firmware.elf)",
          );
        }
        setFirmwareSim({
          adapter: ran.adapter || sim.adapter,
          serialLog: ran.serialLog,
          status: ran.status,
          exportHint: ran.exportHint || sim.exportHint,
          assertions: ran.assertions,
          exportFiles: ran.exportFiles,
        });
        track("hardware.sim.completed", {
          artifactId,
          adapter: ran.adapter || sim.adapter,
          status: ran.status,
        });
      } catch (err) {
        appendConsole(`[error] ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsRunning(false);
      }
      return;
    }
    if (!isConsoleKind(artifactKind)) {
      setIsRunning(true);
      setRightPreviewOpen(true);
      try {
        const result = runTargetProgram({
          code,
          kind: artifactKind as RuntimeKind,
          packSlug: useWorkspaceStore.getState().iotPackSlug,
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

        if (artifactKind === "iot" && result.finalState.iot) {
          const passed = result.finalState.iot.assertions.filter((a) => a.ok).length;
          appendConsole(
            `[assert] ${t("run.iotAssertPass", { passed, total: result.finalState.iot.assertions.length })}`,
          );
          const params = new URLSearchParams(window.location.search);
          const courseId = params.get("courseId");
          const chapterId = params.get("chapter");
          const eduApi = import.meta.env.VITE_EDU_API_URL?.trim();
          if (courseId && chapterId && eduApi) {
            try {
              const { authHeaders } = await import("../lib/http");
              await fetch(
                `${eduApi.replace(/\/$/, "")}/edu/course/courses/${courseId}/chapters/${chapterId}/iot-lab/evidence`,
                {
                  method: "POST",
                  headers: { ...authHeaders({ "Content-Type": "application/json" }) },
                  body: JSON.stringify({
                    packSlug: result.finalState.iot.packSlug,
                    runMode: "sim",
                    boardSku,
                    artifactId,
                    assertions: result.finalState.iot.assertions,
                    passed: result.finalState.iot.assertions.every((a) => a.ok),
                  }),
                },
              );
              appendConsole(`[info] ${t("run.lessonEvidenceOk")}`);
            } catch {
              appendConsole(`[warn] ${t("run.lessonEvidenceFail")}`);
            }
          }
        }

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
              useWorkspaceStore.getState().setSmarthomeSessionId(sim.id);
              // Local Blockly already applied the program. POST /run applies
              // activeScene on the server and would overwrite that result.
            } catch {
              /* offline / unauthenticated */
            }
          })();
        }

        if (artifactKind === "toy" && artifactId) {
          void (async () => {
            try {
              const preview = await api.createPreviewSession({
                artifactId,
                kind: "toy",
              });
              const sim = await api.createToySimulation({
                artifactId,
                previewSessionId: preview.id,
              });
              useWorkspaceStore.getState().setToySessionId(sim.id);
              // Keep local Blockly twin as primary visual; server twin seeds inject/run.
            } catch {
              /* offline / unauthenticated — local twin already shown */
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
      appendConsole(`[info] ${t("run.consoleLog")}`);
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
    boardSku,
    languageId,
    code,
    clearConsole,
    appendConsole,
    setBottomOpen,
    setPreviewWorld,
    setRightPreviewOpen,
    setFirmwareSim,
    saveCurrentArtifact,
    publishWebIframe,
    refreshBlogPreview,
  ]);

  useEffect(() => {
    const onRun = () => {
      void handleRun();
    };
    window.addEventListener("workspace:run", onRun);
    return () => window.removeEventListener("workspace:run", onRun);
  }, [handleRun]);

  return (
    <AppProviders>
      <div className={styles.workspace}>
        <WorkspaceHeader isRunning={isRunning} onRun={() => void handleRun()} />
        <AuthBanner />

        <div className={styles.body}>
          <PanelGroup orientation="horizontal" className={styles.hPanelGroup}>
            {leftOpen && (
              <>
                <Panel defaultSize="18" minSize="14" maxSize="32" className={styles.panelFull}>
                  <AssetsPanel />
                </Panel>
                <PanelResizeHandle className={styles.hResizeHandle} />
              </>
            )}

            <Panel minSize="28" className={styles.panelFull}>
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
                <Panel defaultSize="26" minSize="18" maxSize="46" className={styles.panelFull}>
                  <PreviewPanel kind={artifactKind} onRefresh={() => void handleRun()} />
                </Panel>
              </>
            )}

            {aiOpen && (
              <>
                <PanelResizeHandle className={styles.hResizeHandle} />
                <Panel defaultSize="20" minSize="16" maxSize="32" className={styles.panelFull}>
                  <FloatingAiPanel
                    open={aiOpen}
                    onOpenChange={setAiOpen}
                    onToggle={toggleAiOpen}
                    mode="workspace"
                    variant="dock"
                  />
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>
    </AppProviders>
  );
}
