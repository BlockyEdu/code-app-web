import { create } from "zustand";
import { api, type ChatMessage, type Lesson, type Project } from "../lib/api";
import {
  type ArtifactFileEntry,
  buildSaveFiles,
  codePathForKind,
  extractEditorBuffers,
  filesToMap,
} from "../lib/artifact-files";
import {
  DEFAULT_PAIR_MISSION,
  nextPhaseAfterAction,
  type PairAction,
  type PairMission,
} from "../lib/pair-mission";
import type { WorldState } from "../lib/targets";
import { DEFAULT_KIND_CODE, DEFAULT_KIND_XML } from "../lib/targets";
import { track } from "../lib/telemetry";
import { boardSkuForTemplate, extraFilesForTemplate } from "../lib/templates";
import { getDefaultLanguageId, getLanguagePlugin } from "../plugins";
import type { ArtifactKind, LeftPanelTab } from "../types/artifact";
import { isConsoleKind, isHardwareKind, KIND_LABEL } from "../types/artifact";

export type EditorMode = "blockly" | "monaco";

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
  verifiedMilestone: string;
  pairMission: PairMission;
  firmwareSim: { adapter: string; serialLog: string; status: string; exportHint: string } | null;
  saveDirty: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  leftOpen: boolean;
  rightPreviewOpen: boolean;
  aiOpen: boolean;
  bottomOpen: boolean;
  activeLeftTab: LeftPanelTab;
  showNewProjectDialog: boolean;
  previewWorld: WorldState | null;
  /** kind=web: sandboxed iframe src (API embed URL) or empty when using srcdoc */
  webPreviewEmbedUrl: string | null;
  /** kind=web: srcdoc fallback when offline / unauthenticated */
  webPreviewSrcDoc: string | null;
  webPreviewSessionId: string | null;
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
  applyPairAction: (action: PairAction) => void;
  setPairMission: (mission: PairMission) => void;
  setFirmwareSim: (
    sim: { adapter: string; serialLog: string; status: string; exportHint: string } | null,
  ) => void;
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
  projectName: "未命名项目",
  lesson: null,
  lessonStepIndex: 0,
  aiMessages: [],
  aiLoading: false,
  aiNextHint: "",
  aiNextAction: "",
  artifactKind: "exercise",
  artifactName: "我的第一个练习",
  artifactId: null,
  artifactFiles: [],
  activeFilePath: "main.js",
  intent: undefined,
  templateId: null,
  boardSku: null,
  verifiedMilestone: "none",
  pairMission: DEFAULT_PAIR_MISSION,
  firmwareSim: null,
  saveDirty: false,
  saveStatus: "idle",
  leftOpen: true,
  rightPreviewOpen: false,
  aiOpen: true,
  bottomOpen: true,
  activeLeftTab: "files",
  showNewProjectDialog: false,
  previewWorld: null,
  webPreviewEmbedUrl: null,
  webPreviewSrcDoc: null,
  webPreviewSessionId: null,
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
  setLesson: (lesson) => set({ lesson, lessonStepIndex: 0 }),
  setLessonStepIndex: (lessonStepIndex) => set({ lessonStepIndex }),
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
  setPairMission: (pairMission) => set({ pairMission }),
  applyPairAction: (action) => {
    const current = get().pairMission;
    const phase = nextPhaseAfterAction(action, current.phase);
    const next = { ...current, phase };
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
    const map = filesToMap(s.artifactFiles);
    if (s.activeFilePath) map[s.activeFilePath] = s.code;
    const files = Object.entries(map).map(([p, content]) => ({
      path: p,
      contentType: "text",
      content,
    }));
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
    const files = [...s.artifactFiles, { path: trimmed, contentType: "text", content: "" }];
    set({ artifactFiles: files, saveDirty: true });
    get().setActiveFile(trimmed);
  },
  setWebPreview: (payload) =>
    set((s) => ({
      webPreviewEmbedUrl: payload.embedUrl !== undefined ? payload.embedUrl : s.webPreviewEmbedUrl,
      webPreviewSrcDoc: payload.srcDoc !== undefined ? payload.srcDoc : s.webPreviewSrcDoc,
      webPreviewSessionId:
        payload.sessionId !== undefined ? payload.sessionId : s.webPreviewSessionId,
    })),
  createNewArtifact: async (kind, name, language, opts) => {
    const consoleKind = isConsoleKind(kind);
    const hardware = isHardwareKind(kind);
    const nextName = name.trim() || `我的${KIND_LABEL[kind]}`;
    const extras = extraFilesForTemplate(kind, opts?.templateId);
    const extraMap = filesToMap(extras);
    const primaryPath = codePathForKind(kind);
    const nextXml = DEFAULT_KIND_XML[kind];
    const nextCode = extraMap[primaryPath] || DEFAULT_KIND_CODE[kind];
    const requested = language || get().languageId || "javascript";
    const lang = consoleKind ? requested : requested || "javascript";
    const plugin = getLanguagePlugin(lang);
    persistLanguage(lang);
    const templateId = opts?.templateId ?? null;
    const boardSku =
      opts?.boardSku ||
      boardSkuForTemplate(templateId) ||
      (hardware ? "board.espressif.esp32-s3-devkitc-1" : null);
    const intent = opts?.intent || (consoleKind ? "learn" : hardware ? "ship" : "build");
    const pairMission = consoleKind
      ? { ...DEFAULT_PAIR_MISSION, phase: "mission" as const }
      : get().pairMission;

    const defaultEditorMode =
      kind === "free" || hardware
        ? ("monaco" as const)
        : consoleKind
          ? plugin?.blockly
            ? ("blockly" as const)
            : ("monaco" as const)
          : ("blockly" as const);

    const seedFiles: ArtifactFileEntry[] = extras.length
      ? extras
      : [{ path: primaryPath, contentType: "text", content: nextCode }];

    set({
      artifactKind: kind,
      artifactName: nextName,
      projectName: nextName,
      artifactId: null,
      currentProject: null,
      artifactFiles: seedFiles,
      activeFilePath: primaryPath,
      templateId,
      boardSku,
      intent,
      verifiedMilestone: "none",
      pairMission,
      firmwareSim: null,
      saveDirty: true,
      saveStatus: "idle",
      leftOpen: true,
      rightPreviewOpen: !consoleKind,
      bottomOpen: consoleKind || hardware,
      aiOpen: true,
      activeLeftTab: consoleKind ? "learn" : hardware ? "modules" : "files",
      editorMode: defaultEditorMode,
      languageId: lang,
      code: nextCode,
      blockXml: nextXml,
      blockXmlSnapshot: "",
      monacoManuallyEdited: false,
      previewWorld: null,
      webPreviewEmbedUrl: null,
      webPreviewSrcDoc: null,
      webPreviewSessionId: null,
      languageBuffers: {
        ...get().languageBuffers,
        [lang]: { code: nextCode, blockXml: nextXml },
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

      const editorMode =
        meta.kind === "free" || isHardwareKind(meta.kind)
          ? ("monaco" as const)
          : consoleKind
            ? plugin?.blockly
              ? ("blockly" as const)
              : ("monaco" as const)
            : ("blockly" as const);

      const primaryPath = codePathForKind(meta.kind);

      set({
        artifactId: meta.id,
        artifactKind: meta.kind,
        artifactName: meta.title,
        projectName: meta.title,
        currentProject: project,
        artifactFiles: files,
        activeFilePath: primaryPath,
        templateId: meta.templateId ?? null,
        boardSku:
          meta.boardSku ??
          (isHardwareKind(meta.kind) ? "board.espressif.esp32-s3-devkitc-1" : null),
        intent: meta.intent,
        verifiedMilestone: meta.verifiedMilestone ?? "none",
        pairMission: consoleKind ? { ...DEFAULT_PAIR_MISSION } : get().pairMission,
        firmwareSim: null,
        saveDirty: false,
        saveStatus: "saved",
        leftOpen: true,
        rightPreviewOpen: !consoleKind,
        bottomOpen: consoleKind || isHardwareKind(meta.kind),
        aiOpen: true,
        activeLeftTab: consoleKind ? "learn" : isHardwareKind(meta.kind) ? "modules" : "files",
        editorMode,
        languageId: lang,
        code: nextCode,
        blockXml: nextXml,
        blockXmlSnapshot: "",
        monacoManuallyEdited: false,
        previewWorld: null,
        webPreviewEmbedUrl: null,
        webPreviewSrcDoc: null,
        webPreviewSessionId: null,
        languageBuffers: {
          ...get().languageBuffers,
          [lang]: { code: nextCode, blockXml: nextXml },
        },
      });
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
      artifactKind: "exercise",
      artifactName: project.name,
      projectName: project.name,
      currentProject: project,
      artifactFiles: [],
      saveDirty: false,
      saveStatus: "saved",
      leftOpen: true,
      rightPreviewOpen: false,
      aiOpen: true,
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
            name: state.artifactName || state.projectName || "未命名练习",
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
          title: state.artifactName || state.projectName || "未命名作品",
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
      if (state.activeFilePath) map[state.activeFilePath] = state.code;
      const primaryPath = codePathForKind(state.artifactKind);
      const primaryCode = map[primaryPath] ?? state.code;
      const extras: ArtifactFileEntry[] = Object.entries(map)
        .filter(([p]) => p !== primaryPath)
        .map(([path, content]) => ({ path, contentType: "text", content }));
      const files = buildSaveFiles(state.artifactKind, primaryCode, state.blockXml, extras);
      const res = await api.putArtifactFiles(artifactId, { files });
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
