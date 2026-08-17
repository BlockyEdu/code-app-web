import type { AiPublicConfig, AiUserSettings } from "./ai-settings";
import {
  EntitlementRequiredError,
  httpRequest,
  setEntitlementRequiredHandler,
  setUnauthorizedHandler,
  UnauthorizedError,
} from "./http";
import type { MembershipResponse } from "./membership-types";

export type { AiPublicConfig, AiUserSettings };
export {
  EntitlementRequiredError,
  setEntitlementRequiredHandler,
  setUnauthorizedHandler,
  UnauthorizedError,
};

async function request<T>(path: string, init?: Parameters<typeof httpRequest>[1]): Promise<T> {
  return httpRequest<T>(path, init);
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
  role: "user" | "assistant" | "system";
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

export type EditorMode = "blockly" | "monaco";

export type CreateArtifactKind =
  | "web"
  | "miniprogram"
  | "smarthome"
  | "iot"
  | "toy"
  | "free"
  | "exercise";

export interface CreateArtifact {
  id: string;
  title: string;
  kind: CreateArtifactKind;
  summary: string | null;
  visibility: string;
  lifecycleState: string;
  ownerId: string;
  tenantId: string;
  currentVersionId: string | null;
  currentVersion: number;
  workspaceProjectId?: string | null;
  exerciseType?: string | null;
  language?: string | null;
  createdAt: string;
  updatedAt: string;
}

type AiOpts = {
  provider?: string;
  model?: string;
  artifactId?: string;
  kind?: CreateArtifactKind;
};

export interface PreviewSession {
  id: string;
  artifactId: string;
  kind: string;
  status: string;
  isolation?: {
    mode: string;
    origin?: string;
    embedUrl?: string;
    sandboxFlags?: string[];
    networkPolicy?: string;
  };
  previewUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface SmarthomeSimSession {
  id: string;
  artifactId: string;
  status: string;
  world: unknown;
  createdAt: string;
  expiresAt: string;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  aiConfig: () => request<AiPublicConfig>("/ai/config"),
  listArtifacts: (params?: { kind?: CreateArtifactKind; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.kind) q.set("kind", params.kind);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<{ items: CreateArtifact[] }>(`/create/artifacts${qs ? `?${qs}` : ""}`);
  },
  createArtifact: (data: {
    title: string;
    kind: CreateArtifactKind;
    summary?: string;
    visibility?: string;
    exerciseType?: "lesson" | "script";
    language?: string;
    workspaceProjectId?: string;
  }) =>
    request<CreateArtifact>("/create/artifacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getArtifact: (id: string) => request<CreateArtifact>(`/create/artifacts/${id}`),
  updateArtifact: (
    id: string,
    data: {
      title?: string;
      summary?: string;
      visibility?: string;
      language?: string;
      workspaceProjectId?: string;
      exerciseType?: "lesson" | "script";
    },
  ) =>
    request<CreateArtifact>(`/create/artifacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  putArtifactFiles: (
    id: string,
    body: {
      files: Array<{ path: string; contentType?: string; content?: string }>;
      deletePaths?: string[];
    },
  ) =>
    request<{ files: Array<{ path: string; contentType: string; content: string }> }>(
      `/create/artifacts/${id}/files`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),
  listProjects: () => request<Project[]>("/code/projects"),
  getProject: (id: string) => request<Project>(`/code/projects/${id}`),
  createProject: (data: Partial<Project>) =>
    request<Project>("/code/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/code/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<{ deleted: boolean }>(`/code/projects/${id}`, {
      method: "DELETE",
    }),
  listLessons: () => request<LessonSummary[]>("/code/lessons"),
  getLesson: (id: string) => request<Lesson>(`/code/lessons/${id}`),
  codeRuntime: () => request<CodeRuntimeConfig>("/code/runtime"),
  executeCode: (body: { languageId: string; code: string; stdin?: string }) =>
    request<ExecuteCodeResult>("/code/execute", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  aiChat: (
    messages: ChatMessage[],
    opts?: AiOpts & {
      code?: string;
      editorMode?: EditorMode;
      teachingDepth?: string;
      lastError?: { message?: string; stderr?: string; exitCode?: number };
      consoleOutput?: string[];
      blockXml?: string;
    },
  ) =>
    request<{ role: string; content: string; mock?: boolean; provider?: string; model?: string }>(
      "/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          messages,
          code: opts?.code,
          editorMode: opts?.editorMode,
          provider: opts?.provider,
          model: opts?.model,
          artifactId: opts?.artifactId,
          kind: opts?.kind,
          teachingDepth: opts?.teachingDepth,
          lastError: opts?.lastError,
          consoleOutput: opts?.consoleOutput,
          blockXml: opts?.blockXml,
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
    request<{ hint: string; nextAction: string; mock?: boolean }>("/ai/coach/hint", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  aiUpgradePro: (body: AiOpts & { code: string; blockXml?: string; goal?: string }) =>
    request<{ code: string; explanation: string; mock?: boolean }>("/ai/coach/upgrade-pro", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  aiFixCode: (
    code: string,
    error?: string,
    opts?: AiOpts & { lastError?: { message?: string; stderr?: string; exitCode?: number }; teachingDepth?: string },
  ) =>
    request<{
      explanation: string;
      fixedCode: string;
      mock?: boolean;
      patch?: { original?: string; proposed?: string; requiresConfirm?: boolean };
    }>("/ai/code/fix", {
      method: "POST",
      body: JSON.stringify({
        code,
        error,
        language: "javascript",
        provider: opts?.provider,
        model: opts?.model,
        artifactId: opts?.artifactId,
        kind: opts?.kind,
        lastError: opts?.lastError,
        teachingDepth: opts?.teachingDepth,
      }),
    }),
  aiReview: (body: Record<string, unknown>) =>
    request<{ summary?: string; dimensions?: Array<{ name: string; score: number; comment: string }> }>(
      "/ai/code/review",
      { method: "POST", body: JSON.stringify(body) },
    ),
  aiAgentStep: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>("/ai/agent/step", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createPreviewSession: (body: {
    artifactId: string;
    kind: Exclude<CreateArtifactKind, "exercise" | "free">;
    htmlDocument?: string;
    ttlSeconds?: number;
  }) =>
    request<PreviewSession>("/preview/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePreviewHtml: (sessionId: string, htmlDocument: string) =>
    request<PreviewSession>(`/preview/sessions/${sessionId}/html`, {
      method: "PUT",
      body: JSON.stringify({ htmlDocument }),
    }),
  getArtifactFiles: (artifactId: string) =>
    request<{ files: Array<{ path: string; contentType: string; content: string }> }>(
      `/create/artifacts/${artifactId}/files`,
    ),
  createSmarthomeSession: (body: { artifactId: string; previewSessionId?: string }) =>
    request<SmarthomeSimSession>("/smarthome/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  runSmarthomeSession: (sessionId: string) =>
    request<SmarthomeSimSession>(`/smarthome/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  publishWeb: (artifactId: string) =>
    request<{ status: string; artifactId: string; message: string }>("/publish/web", {
      method: "POST",
      body: JSON.stringify({ artifactId }),
    }),
  getMembership: () => request<MembershipResponse>("/membership"),
  ensureTrial: (body?: { organizationId?: string }) =>
    request<unknown>("/membership/trial/ensure", {
      method: "POST",
      body: JSON.stringify(body ?? {}),
      // Strict Mode remounts App effect → avoid duplicate trial ensure
      coalesce: true,
    }),
};
