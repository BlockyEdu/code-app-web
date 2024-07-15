import { create } from 'zustand';
import type { ChatMessage, Lesson, Project } from '../lib/api';
import { getDefaultLanguageId, getLanguagePlugin } from '../plugins';

export type EditorMode = 'blockly' | 'monaco';

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
  currentProject: Project | null;
  projectName: string;
  lesson: Lesson | null;
  lessonStepIndex: number;
  aiMessages: ChatMessage[];
  aiLoading: boolean;
  aiNextHint: string;
  aiNextAction: string;
  setEditorMode: (mode: EditorMode) => void;
  setLanguage: (languageId: string) => void;
  setCode: (code: string) => void;
  setBlockXml: (xml: string) => void;
  appendConsole: (line: string) => void;
  clearConsole: () => void;
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
}

function persistLanguage(id: string) {
  try {
    localStorage.setItem('blockyedu_language', id);
  } catch {
    /* ignore */
  }
}

const initialLanguage = getDefaultLanguageId();
const initialPlugin = getLanguagePlugin(initialLanguage);

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  editorMode: initialPlugin?.blockly ? 'blockly' : 'monaco',
  languageId: initialLanguage,
  languageBuffers: {},
  code: initialPlugin?.defaultStarter ?? '',
  blockXml: '',
  blockXmlSnapshot: '',
  monacoManuallyEdited: false,
  consoleOutput: [],
  currentProject: null,
  projectName: '未命名项目',
  lesson: null,
  lessonStepIndex: 0,
  aiMessages: [],
  aiLoading: false,
  aiNextHint: '',
  aiNextAction: '',
  setEditorMode: (editorMode) => {
    const plugin = get().getActiveLanguagePlugin();
    if (editorMode === 'blockly' && !plugin?.blockly) {
      set({ editorMode: 'monaco' });
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
    const nextXml = saved?.blockXml ?? '';

    persistLanguage(languageId);
    set({
      languageId,
      languageBuffers: buffers,
      code: nextCode,
      blockXml: nextXml,
      blockXmlSnapshot: '',
      monacoManuallyEdited: false,
      editorMode: plugin.blockly ? state.editorMode : 'monaco',
      aiNextHint: '',
      aiNextAction: '',
    });
  },
  setCode: (code) => set({ code }),
  setBlockXml: (blockXml) => set({ blockXml }),
  appendConsole: (line) => set((s) => ({ consoleOutput: [...s.consoleOutput, line] })),
  clearConsole: () => set({ consoleOutput: [] }),
  setCurrentProject: (currentProject) => {
    if (!currentProject) {
      set({ currentProject: null });
      return;
    }
    const lang = currentProject.language || 'javascript';
    const plugin = getLanguagePlugin(lang);
    persistLanguage(lang);
    set({
      currentProject,
      projectName: currentProject.name,
      languageId: lang,
      code: currentProject.code || plugin?.defaultStarter || '',
      blockXml: currentProject.blockXml ?? '',
      blockXmlSnapshot: '',
      monacoManuallyEdited: false,
      editorMode: plugin?.blockly ? 'blockly' : 'monaco',
      languageBuffers: {
        [lang]: {
          code: currentProject.code,
          blockXml: currentProject.blockXml ?? '',
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
      editorMode: 'monaco',
      monacoManuallyEdited: false,
    }),
  restoreBlocklyFromSnapshot: () => {
    const { blockXmlSnapshot, blockXml } = get();
    set({
      editorMode: 'blockly',
      blockXml: blockXmlSnapshot || blockXml,
      monacoManuallyEdited: false,
    });
  },
  getCurrentGoal: () => {
    const { lesson, lessonStepIndex } = get();
    if (!lesson) return '';
    const step = lesson.steps[lessonStepIndex];
    if (step) return `${step.title}：${step.instruction}`;
    return lesson.title;
  },
  getActiveLanguagePlugin: () => getLanguagePlugin(get().languageId),
}));
