import { create } from "zustand";
import {
  type ArtifactLearnLink,
  api,
  type BlogPostRecord,
  type ChatMessage,
  type Lesson,
  type Project,
  type WebPublishStatus,
} from "../lib/api";
import { type AppSchema, isAppStudioTemplate, parseAppSchema } from "../lib/app-studio/app-schema";
import {
  type ArtifactFileEntry,
  buildBinaryRefEntry,
  buildSaveFiles,
  codePathForKind,
  contentTypeForPath,
  extractEditorBuffers,
  filesToMap,
  isBinaryRefFile,
  mergeTextMapWithBinaryRefs,
} from "../lib/artifact-files";
import { t } from "../lib/i18n";
import { untitledArtifactName } from "../lib/kind-label";
import {
  defaultPairMission,
  nextPhaseAfterAction,
  type PairAction,
  type PairMission,
  withPairPhase,
} from "../lib/pair-mission";
import type { WorldState } from "../lib/targets";
import { DEFAULT_KIND_CODE, DEFAULT_KIND_XML } from "../lib/targets";
import { type IotRunMode, starterIotCode, starterIotXml } from "../lib/targets/iot-lab";
import { track } from "../lib/telemetry";
import {
  boardSkuForTemplate,
  extraFilesForTemplate,
  packSlugFromTemplate,
  parsePackSlugFromFiles,
} from "../lib/templates";
import { getDefaultLanguageId, getLanguagePlugin } from "../plugins";
import type { ArtifactKind, LeftPanelTab } from "../types/artifact";
import { isConsoleKind, isHardwareKind } from "../types/artifact";

export type EditorMode = "blockly" | "monaco";

export type FirmwareSimState = {
  adapter: string;
  serialLog: string;
  status: string;
  exportHint: string;
  assertions?: Array<{ id: string; name: string; ok: boolean; detail: string }>;
  exportFiles?: Array<{ path: string; content: string }>;
};
export type SurfaceMode = "design" | "data" | "logic" | "code";

const APP_SCHEMA_PATH = "app.schema.json";

export function isAppStudioKind(
  kind: ArtifactKind,
  templateId: string | null | undefined,
): boolean {
  return (kind === "web" || kind === "miniprogram") && isAppStudioTemplate(templateId);
}

/** @deprecated use isAppStudioKind */
export const isBlogStudioKind = isAppStudioKind;

function parseSchemaFromFiles(files: ArtifactFileEntry[]): AppSchema | null {
  const entry = files.find(
    (f) => f.path === APP_SCHEMA_PATH || f.path.endsWith(`/${APP_SCHEMA_PATH}`),
  );
  if (!entry?.content?.trim()) return null;
  try {
    const { schema } = parseAppSchema(JSON.parse(entry.content) as unknown);
    return schema;
  } catch {
    return null;
  }
}

function upsertSchemaFile(files: ArtifactFileEntry[], schema: AppSchema): ArtifactFileEntry[] {
  const content = `${JSON.stringify(schema, null, 2)}\n`;
  const next = files.filter(
    (f) => f.path !== APP_SCHEMA_PATH && !f.path.endsWith(`/${APP_SCHEMA_PATH}`),
  );
  next.push({ path: APP_SCHEMA_PATH, contentType: contentTypeForPath(APP_SCHEMA_PATH), content });
  return next;
}

interface LanguageBuffer {
  code: string;
  blockXml: string;
}

interface WorkspaceState {
  editorMode: EditorMode;
  languageId: string;
  languageBuffers: Record<string, LanguageBuffer>;
  code: string;
  blockXml: string;
  blockXmlSnapshot: string;
  monacoManuallyEdited: boolean;
  consoleOutput: string[];
  lastRunError: { message: string; stderr: string; exitCode: number } | null;
  teachingDepth: "beginner" | "guided" | "normal" | "expert";
  aiMode: "tutor" | "debug" | "review" | "agent";
  pendingPatch: { original: string; proposed: string } | null;
  currentProject: Project | null;
  projectName: string;
  lesson: Lesson | null;
  lessonStepIndex: number;
  /** Persisted Learn link from artifact meta (course/assignment + submission). */
  learnLink: ArtifactLearnLink | null;
  aiMessages: ChatMessage[];
  aiLoading: boolean;
  aiNextHint: string;
  aiNextAction: string;
  artifactKind: ArtifactKind;
  artifactName: string;
  /** Server-persisted create Artifact id (Phase 4); null when local-only */
  artifactId: string | null;
  /** Cached draft file list for merge-on-save */
  artifactFiles: ArtifactFileEntry[];
  activeFilePath: string;
  intent?: string;
  templateId: string | null;
  boardSku: string | null;
  iotPackSlug: string | null;
  iotRunMode: IotRunMode;
  verifiedMilestone: string;
  pairMission: PairMission;
  firmwareSim: FirmwareSimState | null;
  saveDirty: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  leftOpen: boolean;
  rightPreviewOpen: boolean;
  aiOpen: boolean;
  bottomOpen: boolean;
  activeLeftTab: LeftPanelTab;
  showNewProjectDialog: boolean;
  previewWorld: WorldState | null;
  /** kind=web: sandboxed iframe src (absolute PREVIEW_PUBLIC_ORIGIN or relative API path) */
  webPreviewEmbedUrl: string | null;
  /** kind=web: srcdoc fallback when offline / unauthenticated */
  webPreviewSrcDoc: string | null;
  webPreviewSessionId: string | null;
  /** kind=smarthome: server sim session for event inject (TTL, in-memory). */
  smarthomeSessionId: string | null;
  /** kind=toy: server `/api/v1/toy` simulation session (TTL, in-memory). */
  toySessionId: string | null;
  /** Blog App Studio surfaces (ignored for other kinds). */
  surfaceMode: SurfaceMode;
  appSchema: AppSchema | null;
  selectedNodeId: string | null;
  blogPosts: BlogPostRecord[];
  blogPreviewPage: "home" | "post";
  blogPreviewSlug: string;
  blogPublish: WebPublishStatus | null;
  blogDetailVisited: boolean;
  isBlogStudio: () => boolean;
  setSurfaceMode: (mode: SurfaceMode) => void;
  updateAppSchema: (schema: AppSchema) => void;
  setSelectedNodeId: (id: string | null) => void;
  setBlogPreview: (page: "home" | "post", slug?: string) => void;
  setBlogPosts: (posts: BlogPostRecord[]) => void;
  setBlogPublish: (status: WebPublishStatus | null) => void;
  refreshBlogRecords: () => Promise<void>;
  setEditorMode: (mode: EditorMode) => void;
  setLanguage: (languageId: string) => void;
  setCode: (code: string) => void;
  setBlockXml: (xml: string) => void;
  appendConsole: (line: string) => void;
  clearConsole: () => void;
  setLastRunError: (err: { message: string; stderr: string; exitCode: number } | null) => void;
  setTeachingDepth: (d: "beginner" | "guided" | "normal" | "expert") => void;
  setAiMode: (m: "tutor" | "debug" | "review" | "agent") => void;
  setPendingPatch: (p: { original: string; proposed: string } | null) => void;
  applyPendingPatch: () => void;
  setCurrentProject: (p: Project | null) => void;
  setProjectName: (name: string) => void;
  setLesson: (lesson: Lesson | null) => void;
  setLessonStepIndex: (index: number) => void;
  setLearnLink: (learnLink: ArtifactLearnLink | null) => void;
  addAiMessage: (msg: ChatMessage) => void;
  setAiLoading: (loading: boolean) => void;
  resetAiMessages: () => void;
  setAiCoachHint: (hint: string, nextAction: string) => void;
  markMonacoEdited: () => void;
  applyProUpgrade: (code: string, snapshotXml: string) => void;
  restoreBlocklyFromSnapshot: () => void;
  getCurrentGoal: () => string;
  getActiveLanguagePlugin: () => ReturnType<typeof getLanguagePlugin>;
  setArtifactKind: (kind: ArtifactKind) => void;
  setArtifactName: (name: string) => void;
  setLeftOpen: (open: boolean) => void;
  setRightPreviewOpen: (open: boolean) => void;
  setAiOpen: (open: boolean) => void;
  setBottomOpen: (open: boolean) => void;
  toggleLeftOpen: () => void;
  toggleRightPreviewOpen: () => void;
  toggleAiOpen: () => void;
  toggleBottomOpen: () => void;
  setActiveLeftTab: (tab: LeftPanelTab) => void;
  setShowNewProjectDialog: (open: boolean) => void;
  setPreviewWorld: (world: WorldState | null) => void;
  setWebPreview: (payload: {
    embedUrl?: string | null;
    srcDoc?: string | null;
    sessionId?: string | null;
  }) => void;
  setSmarthomeSessionId: (id: string | null) => void;
  setToySessionId: (id: string | null) => void;
  createNewArtifact: (
    kind: ArtifactKind,
    name: string,
    language?: string,
    opts?: { templateId?: string; intent?: string; boardSku?: string },
  ) => Promise<string | null>;
  openArtifact: (id: string) => Promise<void>;
  /** Open legacy code-workspace Project as exercise (may promote to Artifact on save). */
  openLegacyProject: (projectId: string) => Promise<void>;
  saveCurrentArtifact: () => Promise<boolean>;
  markDirty: () => void;
  setActiveFile: (path: string) => void;
  addArtifactFile: (path: string) => void;
  /** Register a server-persisted binary_ref asset in the local draft tree. */
  upsertBinaryAssetFile: (file: ArtifactFileEntry) => void;
  /** Drop one file. Returns false if the path is missing or it would leave zero files. */
  removeArtifactFile: (path: string, opts?: { saveDirty?: boolean }) => boolean;
  /** Replace the draft file tree from a version snapshot. Does not persist or delete. */
  restoreArtifactFiles: (files: readonly ArtifactFileEntry[]) => void;
  applyPairAction: (action: PairAction) => void;
  setPairMission: (mission: PairMission) => void;
  setFirmwareSim: (sim: FirmwareSimState | null) => void;
  setIotRunMode: (mode: IotRunMode) => void;
  setBoardSku: (sku: string | null) => void;
}

function persistLanguage(id: string) {
  try {
    localStorage.setItem("blockyedu_language", id);
  } catch {
    /* ignore */
  }
}

const initialLanguage = getDefaultLanguageId();
const initialPlugin = getLanguagePlugin(initialLanguage);

/** Deduplicate Strict Mode double-open of the same artifact. */
const openArtifactInflight = new Map<string, Promise<void>>();

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  editorMode: initialPlugin?.blockly ? "blockly" : "monaco",
  languageId: initialLanguage,
  languageBuffers: {},
  code: initialPlugin?.defaultStarter ?? "",
  blockXml: "",
  blockXmlSnapshot: "",
  monacoManuallyEdited: false,
  consoleOutput: [],
  lastRunError: null,
  teachingDepth: "guided",
  aiMode: "tutor",
  pendingPatch: null,
  currentProject: null,
  projectName: t("workspace.untitledProject"),
  lesson: null,
  lessonStepIndex: 0,
  learnLink: null,
  aiMessages: [],
  aiLoading: false,
  aiNextHint: "",
  aiNextAction: "",
  artifactKind: "exercise",
  artifactName: t("workspace.firstExercise"),
  artifactId: null,
  artifactFiles: [],
  activeFilePath: "main.js",
  intent: undefined,
  templateId: null,
  boardSku: null,
  iotPackSlug: null,
  iotRunMode: "sim",
  verifiedMilestone: "none",
  pairMission: defaultPairMission(),
  firmwareSim: null,
  saveDirty: false,
  saveStatus: "idle",
  leftOpen: true,
  rightPreviewOpen: false,
  aiOpen: false,
  bottomOpen: true,
  activeLeftTab: "files",
  showNewProjectDialog: false,
  previewWorld: null,
  webPreviewEmbedUrl: null,
  webPreviewSrcDoc: null,
  webPreviewSessionId: null,
  smarthomeSessionId: null,
  toySessionId: null,
  surfaceMode: "code",
  appSchema: null,
  selectedNodeId: null,
  blogPosts: [],
  blogPreviewPage: "home",
  blogPreviewSlug: "",
  blogPublish: null,
  blogDetailVisited: false,
  isBlogStudio: () => isBlogStudioKind(get().artifactKind, get().templateId),
  setSurfaceMode: (surfaceMode) => {
    const s = get();
    if (surfaceMode === "code") {
      const map = filesToMap(s.artifactFiles);
      if (s.activeFilePath) map[s.activeFilePath] = s.code;
      const path = map["styles.css"] !== undefined ? "styles.css" : s.activeFilePath;
      set({
        surfaceMode,
        editorMode: "monaco",
        artifactFiles: Object.entries(map).map(([p, content]) => ({
          path: p,
          contentType: contentTypeForPath(p),
          content,
        })),
        activeFilePath: path,
        code: map[path] ?? s.code,
      });
      return;
    }
    set({ surfaceMode });
  },
  updateAppSchema: (schema) => {
    const s = get();
    set({
      appSchema: schema,
      artifactFiles: upsertSchemaFile(s.artifactFiles, schema),
      saveDirty: true,
      saveStatus: "idle",
    });
  },
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setBlogPreview: (blogPreviewPage, slug) =>
    set({
      blogPreviewPage,
      blogPreviewSlug: slug !== undefined ? slug : get().blogPreviewSlug,
      blogDetailVisited: blogPreviewPage === "post" ? true : get().blogDetailVisited,
    }),
  setBlogPosts: (blogPosts) => set({ blogPosts }),
  setBlogPublish: (blogPublish) => set({ blogPublish }),
  refreshBlogRecords: async () => {
    const { artifactId, artifactKind, templateId } = get();
    if (!artifactId || !isBlogStudioKind(artifactKind, templateId)) return;
    try {
      const { items } = await api.listPosts(artifactId);
      set({ blogPosts: items });
    } catch {
      /* backend may not be ready */
    }
    try {
      const status = await api.getWebPublish(artifactId);
      set({ blogPublish: status });
    } catch {
      /* never published / API missing */
    }
  },
  setEditorMode: (editorMode) => {
    const plugin = get().getActiveLanguagePlugin();
    if (editorMode === "blockly" && !plugin?.blockly) {
      set({ editorMode: "monaco" });
      return;
    }
    set({ editorMode });
  },
  setLanguage: (languageId) => {
    const state = get();
    if (state.languageId === languageId) return;
    const plugin = getLanguagePlugin(languageId);
    if (!plugin) return;

    const buffers: Record<string, LanguageBuffer> = {
      ...state.languageBuffers,
      [state.languageId]: { code: state.code, blockXml: state.blockXml },
    };
    const saved = buffers[languageId];
    const nextCode = saved?.code ?? plugin.defaultStarter;
    const nextXml = saved?.blockXml ?? "";

    persistLanguage(languageId);
    set({
      languageId,
      languageBuffers: buffers,
      code: nextCode,
      blockXml: nextXml,
      blockXmlSnapshot: "",
      monacoManuallyEdited: false,
      editorMode: plugin.blockly ? state.editorMode : "monaco",
      aiNextHint: "",
      aiNextAction: "",
    });
  },
  setCode: (code) => {
    const s = get();
    if (s.code === code) return;
    set({ code, saveDirty: true, saveStatus: "idle" });
  },
  setBlockXml: (blockXml) => {
    const s = get();
    if (s.blockXml === blockXml) return;
    set({ blockXml, saveDirty: true, saveStatus: "idle" });
  },
  markDirty: () => set({ saveDirty: true, saveStatus: "idle" }),
  appendConsole: (line) =>
    set((s) => {
      const isErr =
        line.includes("[error]") || line.includes("[stderr]") || line.startsWith("[exit]");
      return {
        consoleOutput: [...s.consoleOutput, line],
        lastRunError: isErr
          ? {
              message: line,
              stderr: s.consoleOutput
                .filter((l) => l.includes("stderr") || l.includes("error"))
                .concat(line)
                .join("\n"),
              exitCode: line.includes("[exit]") ? Number(line.replace(/\D/g, "") || 1) : 1,
            }
          : s.lastRunError,
      };
    }),
  clearConsole: () => set({ consoleOutput: [], lastRunError: null }),
  setLastRunError: (lastRunError) => set({ lastRunError }),
  setTeachingDepth: (teachingDepth) => set({ teachingDepth }),
  setAiMode: (aiMode) => set({ aiMode }),
  setPendingPatch: (pendingPatch) => set({ pendingPatch }),
  applyPendingPatch: () => {
    const { pendingPatch } = get();
    if (!pendingPatch) return;
    set({
      code: pendingPatch.proposed,
      pendingPatch: null,
      monacoManuallyEdited: true,
      saveDirty: true,
    });
    track("pair.patch.accepted");
  },
  setCurrentProject: (currentProject) => {
    if (!currentProject) {
      set({ currentProject: null });
      return;
    }
    const lang = currentProject.language || "javascript";
    const plugin = getLanguagePlugin(lang);
    persistLanguage(lang);
    set({
      currentProject,
      projectName: currentProject.name,
      languageId: lang,
      code: currentProject.code || plugin?.defaultStarter || "",
      blockXml: currentProject.blockXml ?? "",
      blockXmlSnapshot: "",
      monacoManuallyEdited: false,
      editorMode: plugin?.blockly ? "blockly" : "monaco",
      languageBuffers: {
        [lang]: {
          code: currentProject.code,
          blockXml: currentProject.blockXml ?? "",
        },
      },
    });
  },
  setProjectName: (projectName) => set({ projectName }),
  setLesson: (lesson) => set({ lesson }),
  setLessonStepIndex: (lessonStepIndex) => set({ lessonStepIndex }),
  setLearnLink: (learnLink) => set({ learnLink }),
  addAiMessage: (msg) => set((s) => ({ aiMessages: [...s.aiMessages, msg] })),
  setAiLoading: (aiLoading) => set({ aiLoading }),
  resetAiMessages: () => set({ aiMessages: [] }),
  setAiCoachHint: (aiNextHint, aiNextAction) => set({ aiNextHint, aiNextAction }),
  markMonacoEdited: () => set({ monacoManuallyEdited: true }),
  applyProUpgrade: (code, snapshotXml) =>
    set({
      code,
      blockXmlSnapshot: snapshotXml,
      editorMode: "monaco",
      monacoManuallyEdited: false,
    }),
  restoreBlocklyFromSnapshot: () => {
    const { blockXmlSnapshot, blockXml } = get();
    set({
      editorMode: "blockly",
      blockXml: blockXmlSnapshot || blockXml,
      monacoManuallyEdited: false,
    });
  },
  getCurrentGoal: () => {
    const { lesson, lessonStepIndex, pairMission, artifactKind } = get();
    if (lesson) {
      const step = lesson.steps[lessonStepIndex];
      if (step) return `${step.title}：${step.instruction}`;
      return lesson.title;
    }
    if (artifactKind === "free" || artifactKind === "exercise") {
      return `${pairMission.title} — ${pairMission.success}`;
    }
    if (isBlogStudioKind(artifactKind, get().templateId)) {
      return t("workspace.shipGoal");
    }
    return "";
  },
  getActiveLanguagePlugin: () => getLanguagePlugin(get().languageId),
  setArtifactKind: (artifactKind) => set({ artifactKind }),
  setArtifactName: (artifactName) => set({ artifactName, projectName: artifactName }),
  setLeftOpen: (leftOpen) => set({ leftOpen }),
  setRightPreviewOpen: (rightPreviewOpen) => set({ rightPreviewOpen }),
  setAiOpen: (aiOpen) => set({ aiOpen }),
  setBottomOpen: (bottomOpen) => set({ bottomOpen }),
  toggleLeftOpen: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRightPreviewOpen: () => set((s) => ({ rightPreviewOpen: !s.rightPreviewOpen })),
  toggleAiOpen: () => set((s) => ({ aiOpen: !s.aiOpen })),
  toggleBottomOpen: () => set((s) => ({ bottomOpen: !s.bottomOpen })),
  setActiveLeftTab: (activeLeftTab) => set({ activeLeftTab }),
  setShowNewProjectDialog: (showNewProjectDialog) => set({ showNewProjectDialog }),
  setPreviewWorld: (previewWorld) => set({ previewWorld }),
  setFirmwareSim: (firmwareSim) => set({ firmwareSim }),
  setIotRunMode: (iotRunMode) => set({ iotRunMode }),
  setBoardSku: (boardSku) => set({ boardSku }),
  setPairMission: (pairMission) => set({ pairMission }),
  applyPairAction: (action) => {
    const current = get().pairMission;
    const phase = nextPhaseAfterAction(action, current.phase);
    const next = withPairPhase(current, phase);
    set({ pairMission: next });
    if (phase === "mission" && current.phase === "diagnose") {
      track("pair.mission.started", { id: current.id });
    }
    if (phase === "complete" && current.phase !== "complete") {
      track("pair.mission.completed", { id: current.id });
    }
  },
  setActiveFile: (path) => {
    const s = get();
    if (!path || s.activeFilePath === path) return;
    const file = s.artifactFiles.find((f) => f.path === path);
    if (file && isBinaryRefFile(file)) {
      set({ activeFilePath: path });
      return;
    }
    const map = filesToMap(s.artifactFiles);
    const activeMeta = s.artifactFiles.find((f) => f.path === s.activeFilePath);
    if (s.activeFilePath && (!activeMeta || !isBinaryRefFile(activeMeta))) {
      map[s.activeFilePath] = s.code;
    }
    const files = mergeTextMapWithBinaryRefs(s.artifactFiles, map);
    set({
      artifactFiles: files,
      activeFilePath: path,
      code: map[path] ?? "",
      saveDirty: true,
    });
  },
  addArtifactFile: (path) => {
    const trimmed = path.trim().replace(/^\/+/, "");
    if (!trimmed) return;
    const s = get();
    if (s.artifactFiles.some((f) => f.path === trimmed)) {
      get().setActiveFile(trimmed);
      return;
    }
    const files = [
      ...s.artifactFiles,
      { path: trimmed, contentType: contentTypeForPath(trimmed), content: "" },
    ];
    set({ artifactFiles: files, saveDirty: true });
    get().setActiveFile(trimmed);
  },
  upsertBinaryAssetFile: (file) => {
    if (!file.path || !file.storageRef) return;
    const entry = buildBinaryRefEntry({
      path: file.path,
      storageRef: file.storageRef,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      url: file.url,
    });
    const s = get();
    const others = s.artifactFiles.filter((f) => f.path !== entry.path);
    set({
      artifactFiles: [...others, entry],
      activeFilePath: entry.path,
      saveDirty: false,
      saveStatus: "saved",
    });
  },
  removeArtifactFile: (path, opts) => {
    const trimmed = path.trim().replace(/^\/+/, "");
    if (!trimmed) return false;
    const s = get();
    const map = filesToMap(s.artifactFiles);
    const activeMeta = s.artifactFiles.find((f) => f.path === s.activeFilePath);
    if (s.activeFilePath && activeMeta && !isBinaryRefFile(activeMeta)) {
      map[s.activeFilePath] = s.code;
    }

    const ordered = s.artifactFiles.length
      ? s.artifactFiles.map((f) => f.path)
      : s.activeFilePath
        ? [s.activeFilePath]
        : [];
    const idx = ordered.indexOf(trimmed);
    if (idx < 0) return false;

    const remainingPaths = ordered.filter((p) => p !== trimmed);
    if (remainingPaths.length === 0) return false;

    const remaining = s.artifactFiles.filter((f) => f.path !== trimmed);
    const files = mergeTextMapWithBinaryRefs(remaining, map).filter((f) =>
      remainingPaths.includes(f.path),
    );
    // Preserve path order from remainingPaths
    const byPath = new Map(files.map((f) => [f.path, f]));
    const orderedFiles = remainingPaths.map(
      (p) =>
        byPath.get(p) ?? {
          path: p,
          contentType: contentTypeForPath(p),
          content: map[p] ?? "",
        },
    );

    const deletingActive = s.activeFilePath === trimmed;
    const nextPath = deletingActive
      ? remainingPaths[Math.min(idx, remainingPaths.length - 1)]
      : s.activeFilePath;
    const nextMeta = orderedFiles.find((f) => f.path === nextPath);
    const nextCode =
      deletingActive && nextMeta && !isBinaryRefFile(nextMeta) ? (map[nextPath] ?? "") : s.code;
    const nextDirty = opts?.saveDirty ?? true;

    set({
      artifactFiles: orderedFiles,
      activeFilePath: nextPath,
      code: deletingActive ? nextCode : s.code,
      languageBuffers: deletingActive
        ? {
            ...s.languageBuffers,
            [s.languageId]: { code: nextCode, blockXml: s.blockXml },
          }
        : s.languageBuffers,
      saveDirty: nextDirty,
      saveStatus: nextDirty ? "idle" : "saved",
    });
    return true;
  },
  restoreArtifactFiles: (files) => {
    const s = get();
    const next = [...files];
    const map = filesToMap(next);
    const keepActive = Boolean(s.activeFilePath && map[s.activeFilePath] !== undefined);
    const activeFilePath = keepActive ? s.activeFilePath : (next[0]?.path ?? s.activeFilePath);
    const code = map[activeFilePath] ?? "";
    const { blockXml } = extractEditorBuffers(s.artifactKind, next);
    const appSchema = parseSchemaFromFiles(next);
    set({
      artifactFiles: next,
      activeFilePath,
      code,
      blockXml,
      appSchema,
      selectedNodeId:
        appSchema?.pages[0]?.nodes.find((n) => n.type === "hero")?.id ??
        (appSchema ? (appSchema.pages[0]?.nodes[0]?.id ?? null) : s.selectedNodeId),
      languageBuffers: {
        ...s.languageBuffers,
        [s.languageId]: { code, blockXml },
      },
      saveDirty: true,
      saveStatus: "idle",
    });
  },
  setWebPreview: (payload) =>
    set((s) => ({
      webPreviewEmbedUrl: payload.embedUrl !== undefined ? payload.embedUrl : s.webPreviewEmbedUrl,
      webPreviewSrcDoc: payload.srcDoc !== undefined ? payload.srcDoc : s.webPreviewSrcDoc,
      webPreviewSessionId:
        payload.sessionId !== undefined ? payload.sessionId : s.webPreviewSessionId,
    })),
  setSmarthomeSessionId: (smarthomeSessionId) => set({ smarthomeSessionId }),
  setToySessionId: (toySessionId) => set({ toySessionId }),
  createNewArtifact: async (kind, name, language, opts) => {
    const consoleKind = isConsoleKind(kind);
    const hardware = isHardwareKind(kind);
    const nextName = name.trim() || untitledArtifactName(kind);
    const extras = extraFilesForTemplate(kind, opts?.templateId);
    const extraMap = filesToMap(extras);
    const templateId = opts?.templateId ?? null;
    const iotPack = kind === "iot" ? packSlugFromTemplate(templateId) : null;
    const iotLab = Boolean(iotPack);
    const primaryPath = codePathForKind(kind);
    const nextXml = iotPack ? starterIotXml(iotPack) : DEFAULT_KIND_XML[kind];
    const nextCode =
      extraMap[primaryPath] || (iotPack ? starterIotCode(iotPack) : DEFAULT_KIND_CODE[kind]);
    const requested = language || get().languageId || "javascript";
    const lang = consoleKind ? requested : requested || "javascript";
    const plugin = getLanguagePlugin(lang);
    persistLanguage(lang);
    const boardSku =
      opts?.boardSku ||
      boardSkuForTemplate(templateId) ||
      (hardware ? "board.espressif.esp32-s3-devkitc-1" : null);
    const intent = opts?.intent || (consoleKind ? "learn" : hardware && !iotLab ? "ship" : "build");
    const pairMission = consoleKind ? defaultPairMission() : get().pairMission;

    const blog = isBlogStudioKind(kind, templateId);
    const defaultEditorMode = blog
      ? ("monaco" as const)
      : kind === "free" || (hardware && !iotLab)
        ? ("monaco" as const)
        : consoleKind
          ? plugin?.blockly
            ? ("blockly" as const)
            : ("monaco" as const)
          : ("blockly" as const);

    const seedFiles: ArtifactFileEntry[] = extras.length
      ? extras
      : [{ path: primaryPath, contentType: contentTypeForPath(primaryPath), content: nextCode }];
    const seedSchema = blog ? parseSchemaFromFiles(seedFiles) : null;
    const blogCode = blog ? (extraMap["styles.css"] ?? "") : nextCode;
    const blogPath = blog ? "styles.css" : primaryPath;

    set({
      artifactKind: kind,
      artifactName: nextName,
      projectName: nextName,
      artifactId: null,
      learnLink: null,
      lesson: null,
      lessonStepIndex: 0,
      currentProject: null,
      artifactFiles: seedFiles,
      activeFilePath: blogPath,
      templateId,
      boardSku,
      iotPackSlug: iotPack,
      iotRunMode: iotLab ? "sim" : hardware ? "firmware" : "sim",
      intent,
      verifiedMilestone: "none",
      pairMission,
      firmwareSim: null,
      saveDirty: true,
      saveStatus: "idle",
      leftOpen: true,
      rightPreviewOpen: !consoleKind,
      bottomOpen: consoleKind || (hardware && !iotLab),
      aiOpen: false,
      activeLeftTab: blog || consoleKind ? "learn" : hardware && !iotLab ? "modules" : "files",
      editorMode: defaultEditorMode,
      languageId: lang,
      code: blogCode,
      blockXml: blog ? "" : nextXml,
      blockXmlSnapshot: "",
      monacoManuallyEdited: false,
      previewWorld: null,
      webPreviewEmbedUrl: null,
      webPreviewSrcDoc: null,
      webPreviewSessionId: null,
      smarthomeSessionId: null,
      toySessionId: null,
      surfaceMode: blog ? "design" : "code",
      appSchema: seedSchema,
      selectedNodeId: seedSchema?.pages[0]?.nodes.find((n) => n.type === "hero")?.id ?? null,
      blogPosts: [],
      blogPreviewPage: "home",
      blogPreviewSlug: "",
      blogPublish: null,
      blogDetailVisited: false,
      languageBuffers: {
        ...get().languageBuffers,
        [lang]: { code: blogCode, blockXml: blog ? "" : nextXml },
      },
      showNewProjectDialog: false,
    });

    if (consoleKind) track("pair.mission.started", { id: pairMission.id, kind });

    try {
      let workspaceProjectId: string | undefined;
      let project: Project | null = null;
      if (kind === "exercise") {
        project = await api.createProject({
          name: nextName,
          code: nextCode,
          blockXml: nextXml,
          language: lang,
        });
        workspaceProjectId = project.id;
      }
      const created = await api.createArtifact({
        title: nextName,
        kind,
        language: lang,
        intent,
        templateId: templateId ?? undefined,
        boardSku: boardSku ?? undefined,
        ...(kind === "exercise"
          ? {
              exerciseType: "script" as const,
              workspaceProjectId,
            }
          : {}),
      });
      set({
        artifactId: created.id,
        artifactName: created.title,
        currentProject: project,
      });
      if (kind === "web" || isAppStudioKind(kind, templateId)) {
        await get().openArtifact(created.id);
        const s = get();
        if (isAppStudioKind(s.artifactKind, s.templateId) && !s.appSchema && extras.length) {
          const merged = [...s.artifactFiles];
          for (const extra of extras) {
            if (!merged.some((f) => f.path === extra.path)) merged.push(extra);
          }
          const schema = parseSchemaFromFiles(merged);
          set({
            artifactFiles: schema ? upsertSchemaFile(merged, schema) : merged,
            appSchema: schema,
            selectedNodeId: schema?.pages[0]?.nodes.find((n) => n.type === "hero")?.id ?? null,
            surfaceMode: "design",
            editorMode: "monaco",
            activeFilePath: "styles.css",
            code: filesToMap(merged)["styles.css"] ?? "",
          });
        }
        void get().refreshBlogRecords();
        return created.id;
      }
      await get().saveCurrentArtifact();
      return created.id;
    } catch {
      return null;
    }
  },

  openArtifact: async (id) => {
    const existing = openArtifactInflight.get(id);
    if (existing) return existing;

    const run = (async () => {
      const meta = await api.getArtifact(id);
      const { files } = await api.getArtifactFiles(id);
      const { code, blockXml } = extractEditorBuffers(meta.kind, files);
      const consoleKind = isConsoleKind(meta.kind);
      let lang = meta.language || (consoleKind ? get().languageId || "javascript" : "javascript");
      let nextCode = code || DEFAULT_KIND_CODE[meta.kind];
      let nextXml = blockXml || DEFAULT_KIND_XML[meta.kind];
      let project: Project | null = null;

      if (meta.kind === "exercise" && meta.workspaceProjectId) {
        try {
          project = await api.getProject(meta.workspaceProjectId);
          lang = project.language || lang;
          // Prefer Project buffers if artifact files are empty starters.
          if (!code.trim() && project.code) nextCode = project.code;
          if (!blockXml.trim() && project.blockXml) nextXml = project.blockXml;
        } catch {
          project = null;
        }
      }

      const plugin = getLanguagePlugin(lang);
      persistLanguage(lang);

      const templateId =
        meta.templateId ?? parseSchemaFromFiles(files)?.templateId ?? get().templateId;
      const iotPack =
        meta.kind === "iot"
          ? (parsePackSlugFromFiles(files) ?? packSlugFromTemplate(templateId))
          : null;
      const iotLab = Boolean(iotPack);
      const blog = isBlogStudioKind(meta.kind, templateId);
      const editorMode = blog
        ? ("monaco" as const)
        : meta.kind === "free" || (isHardwareKind(meta.kind) && !iotLab)
          ? ("monaco" as const)
          : consoleKind
            ? plugin?.blockly
              ? ("blockly" as const)
              : ("monaco" as const)
            : ("blockly" as const);

      const fileMap = filesToMap(files);
      const appSchema = parseSchemaFromFiles(files);
      const activePath = blog ? "styles.css" : codePathForKind(meta.kind);
      const activeCode = blog ? (fileMap["styles.css"] ?? "") : nextCode;
      const learnLink = meta.learnLink ?? null;
      let restoredLesson: Lesson | null = null;
      if (learnLink?.workspaceLessonId) {
        try {
          restoredLesson = await api.getLesson(learnLink.workspaceLessonId);
        } catch {
          restoredLesson = null;
        }
      }

      set({
        artifactId: meta.id,
        artifactKind: meta.kind,
        artifactName: meta.title,
        projectName: meta.title,
        currentProject: project,
        artifactFiles: files,
        activeFilePath: activePath,
        templateId: templateId ?? null,
        boardSku:
          meta.boardSku ??
          (isHardwareKind(meta.kind) ? "board.espressif.esp32-s3-devkitc-1" : null),
        iotPackSlug: iotPack,
        iotRunMode: iotLab ? "sim" : isHardwareKind(meta.kind) ? "firmware" : "sim",
        intent: meta.intent,
        verifiedMilestone: meta.verifiedMilestone ?? "none",
        pairMission: consoleKind ? defaultPairMission() : get().pairMission,
        firmwareSim: null,
        saveDirty: false,
        saveStatus: "saved",
        leftOpen: true,
        rightPreviewOpen: !consoleKind,
        bottomOpen: consoleKind || (isHardwareKind(meta.kind) && !iotLab),
        aiOpen: false,
        activeLeftTab:
          blog || consoleKind
            ? "learn"
            : isHardwareKind(meta.kind) && !iotLab
              ? "modules"
              : "files",
        editorMode,
        languageId: lang,
        code: activeCode,
        blockXml: blog ? "" : nextXml,
        blockXmlSnapshot: "",
        monacoManuallyEdited: false,
        previewWorld: null,
        webPreviewEmbedUrl: null,
        webPreviewSrcDoc: null,
        webPreviewSessionId: null,
        smarthomeSessionId: null,
        toySessionId: null,
        surfaceMode: blog ? "design" : "code",
        appSchema,
        selectedNodeId: appSchema?.pages[0]?.nodes.find((n) => n.type === "hero")?.id ?? null,
        blogPosts: blog ? get().blogPosts : [],
        blogPreviewPage: blog ? "home" : get().blogPreviewPage,
        blogPreviewSlug: blog ? get().blogPreviewSlug : "",
        blogPublish: blog ? get().blogPublish : null,
        blogDetailVisited: blog ? false : get().blogDetailVisited,
        languageBuffers: {
          ...get().languageBuffers,
          [lang]: { code: activeCode, blockXml: blog ? "" : nextXml },
        },
        learnLink,
        lesson: restoredLesson,
        lessonStepIndex: 0,
      });
      if (blog) void get().refreshBlogRecords();
    })().finally(() => {
      openArtifactInflight.delete(id);
    });

    openArtifactInflight.set(id, run);
    return run;
  },

  openLegacyProject: async (projectId) => {
    const project = await api.getProject(projectId);
    const lang = project.language || "javascript";
    const plugin = getLanguagePlugin(lang);
    persistLanguage(lang);

    set({
      artifactId: null,
      learnLink: null,
      artifactKind: "exercise",
      artifactName: project.name,
      projectName: project.name,
      currentProject: project,
      artifactFiles: [],
      saveDirty: false,
      saveStatus: "saved",
      leftOpen: true,
      rightPreviewOpen: false,
      aiOpen: false,
      bottomOpen: true,
      activeLeftTab: "learn",
      editorMode: plugin?.blockly ? "blockly" : "monaco",
      languageId: lang,
      code: project.code || "",
      blockXml: project.blockXml || "",
      blockXmlSnapshot: "",
      monacoManuallyEdited: false,
      previewWorld: null,
      webPreviewEmbedUrl: null,
      webPreviewSrcDoc: null,
      webPreviewSessionId: null,
      smarthomeSessionId: null,
      toySessionId: null,
      surfaceMode: "code",
      appSchema: null,
      selectedNodeId: null,
      blogPosts: [],
      blogPreviewPage: "home",
      blogPreviewSlug: "",
      blogPublish: null,
      languageBuffers: {
        ...get().languageBuffers,
        [lang]: { code: project.code || "", blockXml: project.blockXml || "" },
      },
    });
  },

  saveCurrentArtifact: async () => {
    const state = get();
    set({ saveStatus: "saving" });
    try {
      // 1) Sync legacy Project for exercise (existing or create).
      let project = state.currentProject;
      if (state.artifactKind === "exercise") {
        if (project) {
          project = await api.updateProject(project.id, {
            name: state.artifactName || state.projectName,
            code: state.code,
            blockXml: state.blockXml,
            language: state.languageId,
          });
        } else {
          project = await api.createProject({
            name: state.artifactName || state.projectName || t("workspace.unnamedExercise"),
            code: state.code,
            blockXml: state.blockXml,
            language: state.languageId,
          });
        }
      }

      // 2) Ensure Artifact exists and files are written.
      let artifactId = state.artifactId;
      if (!artifactId) {
        const created = await api.createArtifact({
          title: state.artifactName || state.projectName || t("workspace.unnamedArtifact"),
          kind: state.artifactKind,
          language: state.languageId,
          intent: state.intent,
          templateId: state.templateId ?? undefined,
          boardSku: state.boardSku ?? undefined,
          ...(state.artifactKind === "exercise"
            ? {
                exerciseType: "script" as const,
                workspaceProjectId: project?.id,
              }
            : {}),
        });
        artifactId = created.id;
        set({
          artifactId: created.id,
          artifactName: created.title,
          currentProject: project,
        });
      } else {
        await api.updateArtifact(artifactId, {
          title: state.artifactName,
          language: state.languageId,
          intent: state.intent,
          templateId: state.templateId ?? undefined,
          boardSku: state.boardSku ?? undefined,
          ...(state.artifactKind === "exercise"
            ? {
                workspaceProjectId: project?.id,
              }
            : {}),
        });
      }

      const map = filesToMap(state.artifactFiles);
      if (state.activeFilePath) {
        const activeMeta = state.artifactFiles.find((f) => f.path === state.activeFilePath);
        if (!activeMeta || !isBinaryRefFile(activeMeta)) {
          map[state.activeFilePath] = state.code;
        }
      }
      if (state.appSchema) {
        map[APP_SCHEMA_PATH] = `${JSON.stringify(state.appSchema, null, 2)}\n`;
      }
      const blog = isBlogStudioKind(state.artifactKind, state.templateId);
      const binaryFiles = state.artifactFiles.filter(isBinaryRefFile);
      const files: ArtifactFileEntry[] = blog
        ? mergeTextMapWithBinaryRefs(state.artifactFiles, map)
        : [
            ...buildSaveFiles(
              state.artifactKind,
              map[codePathForKind(state.artifactKind)] ?? state.code,
              state.blockXml,
              Object.entries(map)
                .filter(([p]) => p !== codePathForKind(state.artifactKind))
                .map(([path, content]) => ({
                  path,
                  contentType: contentTypeForPath(path),
                  content,
                })),
            ),
            ...binaryFiles,
          ];
      const res = await api.putArtifactFiles(artifactId, {
        files: files.map((f) =>
          isBinaryRefFile(f)
            ? {
                path: f.path,
                contentType: "binary_ref",
                storageRef: f.storageRef,
                mimeType: f.mimeType,
              }
            : {
                path: f.path,
                contentType: f.contentType,
                content: f.content ?? "",
              },
        ),
      });
      set({
        artifactFiles: res.files,
        currentProject: project,
        projectName: state.artifactName || state.projectName,
        saveDirty: false,
        saveStatus: "saved",
      });
      return true;
    } catch {
      set({ saveStatus: "error" });
      return false;
    }
  },
}));
