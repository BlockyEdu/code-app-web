import type { AiPublicConfig, AiUserSettings } from './ai-settings';

export type { AiPublicConfig, AiUserSettings };

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export class UnauthorizedError extends Error {
  readonly status = 401;

  constructor(message = '请先登录') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler;
}

function headers(): HeadersInit {
  const token = localStorage.getItem('blockyedu_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...headers(), ...init?.headers },
    ...init,
  });
  if (res.status === 401) {
    onUnauthorized?.();
    throw new UnauthorizedError('请先登录后再使用云端功能');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  blockXml: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonSummary {
  id: string;
  title: string;
  description: string;
  stepCount: number;
}

export interface LessonStep {
  id: string;
  title: string;
  instruction: string;
  hint?: string;
  check: { type: string; value: string };
}

export interface Lesson extends LessonSummary {
  steps: LessonStep[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CodeRuntimeConfig {
  preview: { engines: string[] };
  pro: { enabled: boolean; canExecute: boolean };
  piston: { reachable: boolean; url: string };
  supportedLanguages: string[];
}

export interface ExecuteCodeResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtime: string;
  language: string;
  version: string;
  compile?: { stdout: string; stderr: string; exitCode: number };
}

export type EditorMode = 'blockly' | 'monaco';

type AiOpts = { provider?: string; model?: string };

export const api = {
  health: () => request<{ status: string }>('/health'),
  aiConfig: () => request<AiPublicConfig>('/ai/config'),
  listProjects: () => request<Project[]>('/code/projects'),
  getProject: (id: string) => request<Project>(`/code/projects/${id}`),
  createProject: (data: Partial<Project>) =>
    request<Project>('/code/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/code/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<{ deleted: boolean }>(`/code/projects/${id}`, {
      method: 'DELETE',
    }),
  listLessons: () => request<LessonSummary[]>('/code/lessons'),
  getLesson: (id: string) => request<Lesson>(`/code/lessons/${id}`),
  codeRuntime: () => request<CodeRuntimeConfig>('/code/runtime'),
  executeCode: (body: { languageId: string; code: string; stdin?: string }) =>
    request<ExecuteCodeResult>('/code/execute', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  aiChat: (
    messages: ChatMessage[],
    opts?: AiOpts & { code?: string; editorMode?: EditorMode },
  ) =>
    request<{ role: string; content: string; mock?: boolean; provider?: string; model?: string }>(
      '/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify({
          messages,
          code: opts?.code,
          editorMode: opts?.editorMode,
          provider: opts?.provider,
          model: opts?.model,
        }),
      },
    ),
  aiCoachHint: (
    body: AiOpts & {
      code?: string;
      blockXml?: string;
      editorMode?: EditorMode;
      goal?: string;
      lessonStep?: string;
      consoleOutput?: string[];
    },
  ) =>
    request<{ hint: string; nextAction: string; mock?: boolean }>('/ai/coach/hint', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  aiUpgradePro: (
    body: AiOpts & { code: string; blockXml?: string; goal?: string },
  ) =>
    request<{ code: string; explanation: string; mock?: boolean }>(
      '/ai/coach/upgrade-pro',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    ),
  aiFixCode: (code: string, error?: string, opts?: AiOpts) =>
    request<{ explanation: string; fixedCode: string; mock?: boolean }>('/ai/code/fix', {
      method: 'POST',
      body: JSON.stringify({
        code,
        error,
        language: 'javascript',
        provider: opts?.provider,
        model: opts?.model,
      }),
    }),
};
