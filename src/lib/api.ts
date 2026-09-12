import type { AiPublicConfig, AiUserSettings } from "./ai-settings";
import type { AppSchema } from "./app-studio/app-schema";
import type { ArtifactFileEntry } from "./artifact-files";
import { stripClientPriceFields } from "./commerce";
import {
  API_BASE,
  authHeaders,
  EntitlementRequiredError,
  httpRequest,
  setEntitlementRequiredHandler,
  setUnauthorizedHandler,
  UnauthorizedError,
} from "./http";
import { t } from "./i18n";
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

export type LearnLinkSubmissionState = "none" | "draft" | "submitted" | "returned";

export interface ArtifactLearnLink {
  assignmentId?: string;
  courseId?: string;
  chapterId?: string;
  workspaceLessonId?: string;
  deepLink?: string;
  submissionState?: LearnLinkSubmissionState;
  submittedVersionId?: string;
}

export interface ArtifactVersion {
  id: string;
  artifactId: string;
  versionNumber: number;
  message?: string | null;
  createdAt: string;
  createdBy?: string;
  /** Present on GET /versions/:n when the snapshot includes file bodies. */
  files?: ArtifactFileEntry[];
}

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
  intent?: string;
  verifiedMilestone?: string;
  boardSku?: string | null;
  templateId?: string | null;
  learnLink?: ArtifactLearnLink | null;
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

export type ToySimStatus =
  | "pending"
  | "loading"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "stopped"
  | "expired";

export type ToySimRuntime = "canvas_2d" | "three_3d";

export interface ToySimState {
  x: number;
  y: number;
  heading: number;
  speed: number;
  moving: string;
  led: string;
  sensors: Record<string, number>;
  sound?: string;
  speech?: string;
  timeline: string[];
  arena: { width: number; height: number };
  sku?: string;
}

export interface ToySimSession {
  id: string;
  artifactId: string;
  status: ToySimStatus | string;
  runtime: ToySimRuntime | string;
  tick?: number;
  state?: ToySimState;
  embedUrl?: string;
  lastErrorCode?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ToySimEventResult {
  accepted: boolean;
  sessionId: string;
  appliedTick?: number;
  status?: ToySimStatus | string;
  state?: ToySimState;
}

export interface ToySimResult {
  sessionId: string;
  status: ToySimStatus | string;
  metrics?: {
    durationMs?: number;
    eventCount?: number;
    collisionCount?: number;
  };
  assertions?: Array<{ name: string; passed: boolean; detail?: string }>;
  snapshotRef?: string;
}

export type BlogPostStatus = "draft" | "published";

export interface BlogPostData {
  title: string;
  excerpt: string;
  content: string;
  cover?: string;
}

export interface BlogPostRecord {
  id: string;
  artifactId: string;
  collection: string;
  slug: string;
  status: BlogPostStatus;
  data: BlogPostData;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BlogPostInput = Partial<{
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  status: BlogPostStatus;
}>;

export interface AppValidateReport {
  ok: boolean;
  issues?: Array<{ code?: string; message?: string }>;
}

export interface WebRelease {
  id: string;
  artifactId: string;
  artifactVersionNumber?: number;
  status: string;
  publicUrl?: string;
  contentDigest?: string;
  createdAt: string;
  createdBy?: string;
  liveAt?: string;
  errorCode?: string;
}

export interface WebPublishStatus {
  artifactId: string;
  lifecycle: string;
  liveRelease?: WebRelease;
  lastFailedRelease?: WebRelease;
  publicUrl?: string;
}

export interface AppSchemaPatch {
  summary?: string;
  affectedLayers?: Array<"page" | "data" | "logic">;
  operations: Array<{
    op: string;
    pageId?: string;
    nodeId?: string;
    field?: string;
    value?: unknown;
  }>;
  schema?: AppSchema;
  issues?: Array<{ code?: string; message?: string }>;
  requiresConfirm?: boolean;
}

async function requestText(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders({ Accept: "text/html" }),
  });
  if (res.status === 401) {
    throw new UnauthorizedError(t("auth.needSignInCloud"));
  }
  if (!res.ok) {
    const raw = await res.text().catch(() => res.statusText);
    throw new Error(raw.trim() || res.statusText);
  }
  return res.text();
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  aiConfig: () => request<AiPublicConfig>("/ai/config"),
  listArtifacts: (params?: {
    kind?: CreateArtifactKind;
    limit?: number;
    assignmentId?: string;
    workspaceLessonId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.kind) q.set("kind", params.kind);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.assignmentId) q.set("assignmentId", params.assignmentId);
    if (params?.workspaceLessonId) q.set("workspaceLessonId", params.workspaceLessonId);
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
    intent?: string;
    templateId?: string;
    boardSku?: string;
  }) =>
    request<CreateArtifact>("/create/artifacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getArtifact: (id: string) => request<CreateArtifact>(`/create/artifacts/${id}`),
  putArtifactLearnLink: (id: string, body: ArtifactLearnLink) =>
    request<CreateArtifact>(`/create/artifacts/${id}/learn-link`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteArtifactLearnLink: (id: string) =>
    request<void>(`/create/artifacts/${id}/learn-link`, { method: "DELETE" }),
  listArtifactVersions: (id: string) =>
    request<{ items: ArtifactVersion[] }>(`/create/artifacts/${id}/versions`),
  getArtifactVersion: (id: string, versionNumber: number) =>
    request<ArtifactVersion>(`/create/artifacts/${id}/versions/${versionNumber}`),
  createArtifactVersion: (id: string, body?: { label?: string; message?: string }) =>
    request<ArtifactVersion>(`/create/artifacts/${id}/versions`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),
  updateArtifact: (
    id: string,
    data: {
      title?: string;
      summary?: string;
      visibility?: string;
      language?: string;
      workspaceProjectId?: string;
      exerciseType?: "lesson" | "script";
      intent?: string;
      templateId?: string;
      boardSku?: string;
      verifiedMilestone?: string;
    },
  ) =>
    request<CreateArtifact>(`/create/artifacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  putArtifactFiles: (
    id: string,
    body: {
      files: Array<{
        path: string;
        contentType?: string;
        content?: string;
        storageRef?: string;
        mimeType?: string;
      }>;
      deletePaths?: string[];
    },
  ) =>
    request<{
      files: Array<{
        path: string;
        contentType: string;
        content?: string;
        storageRef?: string;
        mimeType?: string;
        sizeBytes?: number;
      }>;
    }>(`/create/artifacts/${id}/files`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  putArtifactAsset: (id: string, body: { path: string; mimeType: string; dataBase64: string }) =>
    request<{
      path: string;
      contentType: "binary_ref";
      storageRef: string;
      mimeType: string;
      sizeBytes: number;
      url?: string;
    }>(`/create/artifacts/${id}/assets`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
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
    opts?: AiOpts & {
      lastError?: { message?: string; stderr?: string; exitCode?: number };
      teachingDepth?: string;
    },
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
    request<{
      summary?: string;
      dimensions?: Array<{ name: string; score: number; comment: string }>;
    }>("/ai/code/review", { method: "POST", body: JSON.stringify(body) }),
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
  getArtifactFile: (id: string, path: string) =>
    request<{ path: string; contentType: string; content?: string }>(
      `/create/artifacts/${id}/files/${encodeURIComponent(path)}`,
    ),
  deleteArtifactFile: (id: string, path: string) =>
    request<void>(`/create/artifacts/${id}/files/${encodeURIComponent(path)}`, {
      method: "DELETE",
    }),
  createSmarthomeSession: (body: { artifactId: string; previewSessionId?: string }) =>
    request<SmarthomeSimSession>("/smarthome/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getSmarthomeSession: (sessionId: string) =>
    request<SmarthomeSimSession>(`/smarthome/sessions/${sessionId}`),
  runSmarthomeSession: (sessionId: string) =>
    request<SmarthomeSimSession>(`/smarthome/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  injectSmarthomeEvent: (
    sessionId: string,
    body: {
      type: "sensor" | "device_toggle" | "scene";
      sensor?: string;
      value?: number;
      deviceId?: string;
      scene?: string;
    },
  ) =>
    request<SmarthomeSimSession>(`/smarthome/sessions/${sessionId}/events`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createToySimulation: (body: {
    artifactId: string;
    runtime?: ToySimRuntime;
    versionNumber?: number;
    previewSessionId?: string;
    ttlSeconds?: number;
  }) =>
    request<ToySimSession>("/toy/simulations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getToySimulation: (sessionId: string) => request<ToySimSession>(`/toy/simulations/${sessionId}`),
  stopToySimulation: (sessionId: string) =>
    request<void>(`/toy/simulations/${sessionId}`, { method: "DELETE" }),
  injectToySimulationEvent: (
    sessionId: string,
    body: {
      type: "sensor" | "input" | "reset" | "custom";
      name?: string;
      payload?: Record<string, unknown>;
      clientEventId?: string;
    },
  ) =>
    request<ToySimEventResult>(`/toy/simulations/${sessionId}/events`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  runToySimulation: (sessionId: string, body?: { mode?: "step" | "full" }) =>
    request<ToySimSession>(`/toy/simulations/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),
  getToySimulationResult: (sessionId: string) =>
    request<ToySimResult>(`/toy/simulations/${sessionId}/result`),
  publishWeb: (artifactId: string, note?: string) =>
    request<WebRelease>("/publish/web", {
      method: "POST",
      body: JSON.stringify({ artifactId, note }),
    }),
  getAppSchema: (artifactId: string) =>
    request<{ schema: AppSchema }>(`/app-runtime/artifacts/${artifactId}/schema`),
  putAppSchema: (artifactId: string, schema: AppSchema) =>
    request<{ schema: AppSchema }>(`/app-runtime/artifacts/${artifactId}/schema`, {
      method: "PUT",
      body: JSON.stringify({ schema }),
    }),
  validateAppArtifact: (artifactId: string) =>
    request<AppValidateReport>(`/app-runtime/artifacts/${artifactId}/validate`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getAppPreviewHtml: (artifactId: string, page: "home" | "post", slug?: string) => {
    const q = new URLSearchParams({ page });
    if (page === "post" && slug) q.set("slug", slug);
    return requestText(`/app-runtime/artifacts/${artifactId}/preview-html?${q.toString()}`);
  },
  listPosts: (artifactId: string) =>
    request<{ items: BlogPostRecord[] }>(`/app-runtime/artifacts/${artifactId}/records/posts`),
  createPost: (artifactId: string, body: BlogPostInput) =>
    request<BlogPostRecord>(`/app-runtime/artifacts/${artifactId}/records/posts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePost: (artifactId: string, recordId: string, body: BlogPostInput) =>
    request<BlogPostRecord>(`/app-runtime/artifacts/${artifactId}/records/posts/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deletePost: (artifactId: string, recordId: string) =>
    request<void>(`/app-runtime/artifacts/${artifactId}/records/posts/${recordId}`, {
      method: "DELETE",
    }),
  getWebPublish: (artifactId: string) => request<WebPublishStatus>(`/publish/web/${artifactId}`),
  listWebReleases: (artifactId: string) =>
    request<{ items: WebRelease[] }>(`/publish/web/${artifactId}/releases`),
  getWebRelease: (artifactId: string, releaseId: string) =>
    request<WebRelease>(`/publish/web/${artifactId}/releases/${releaseId}`),
  rollbackWeb: (artifactId: string, targetReleaseId: string) =>
    request<WebPublishStatus>(`/publish/web/${artifactId}/rollback`, {
      method: "POST",
      body: JSON.stringify({ targetReleaseId }),
    }),
  exportPublishZip: async (artifactId: string, kind: "web" | "miniprogram") => {
    const path =
      kind === "miniprogram"
        ? `/publish/miniprogram/${artifactId}/export`
        : `/publish/web/${artifactId}/export`;
    const res = await fetch(`${API_BASE}${path}`, {
      headers: authHeaders({ Accept: "application/zip" }),
    });
    if (res.status === 401) {
      throw new UnauthorizedError(t("auth.needSignInCloud"));
    }
    if (!res.ok) {
      const raw = await res.text().catch(() => res.statusText);
      throw new Error(raw.trim() || res.statusText);
    }
    return res.blob();
  },
  aiProposeAppPatch: (body: { artifactId: string; instruction: string; schema?: AppSchema }) =>
    request<AppSchemaPatch>("/ai/app/propose-patch", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listHardwareBoards: (goldenPath = true) =>
    request<{ items: Array<{ sku: string; name: string; familyId: string; goldenPath: boolean }> }>(
      `/hardware/boards${goldenPath ? "?goldenPath=true" : ""}`,
    ),
  listHardwareModules: (boardSku?: string) => {
    const q = boardSku ? `?boardSku=${encodeURIComponent(boardSku)}` : "";
    return request<{ items: Array<{ sku: string; name: string; bus: string; voltage: string }> }>(
      `/hardware/modules${q}`,
    );
  },
  listHeroProjects: () =>
    request<{
      items: Array<{
        id: string;
        name: string;
        boardSku: string;
        moduleSkus: string[];
        toolchain: string;
      }>;
    }>("/hardware/heroes"),
  checkHardwareCompat: (boardSku: string, moduleSkus: string[]) =>
    request<{ ok: boolean; issues: Array<{ code: string; message: string }> }>(
      "/hardware/compatibility/check",
      { method: "POST", body: JSON.stringify({ boardSku, moduleSkus }) },
    ),
  createFirmwareBuild: (body: {
    artifactId: string;
    boardSku: string;
    toolchain: string;
    firmwarePath?: string;
  }) =>
    request<{
      id: string;
      status: string;
      logExcerpt: string;
      imageDigest: string;
      reproducible: boolean;
    }>("/hardware/builds", { method: "POST", body: JSON.stringify(body) }),
  createHardwareSim: (body: {
    artifactId: string;
    boardSku: string;
    buildId?: string;
    adapter?: string;
  }) =>
    request<{
      id: string;
      status: string;
      adapter: string;
      exportHint: string;
      serialLog: string;
    }>("/hardware/sim/sessions", { method: "POST", body: JSON.stringify(body) }),
  runHardwareSim: (id: string) =>
    request<{
      id: string;
      status: string;
      adapter: string;
      serialLog: string;
      exportHint: string;
      assertions?: Array<{ id: string; name: string; ok: boolean; detail: string }>;
      exportFiles?: Array<{ path: string; content: string }>;
    }>(`/hardware/sim/sessions/${id}/run`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  listHardwareSimAdapters: () =>
    request<{ items: Array<{ id: string; available: boolean; reason?: string }> }>(
      "/hardware/sim/adapters",
    ),
  runIotLabSim: (body: {
    packSlug: string;
    code: string;
    telemetry?: Record<string, unknown>;
    boardSku?: string;
  }) =>
    request<{
      status: string;
      assertions: Array<{ id: string; ok: boolean; detail: string }>;
      events: Array<{ text: string }>;
    }>("/iot-lab/run", { method: "POST", body: JSON.stringify(body) }),
  runIotLabLive: (body: {
    packSlug: string;
    code: string;
    boardSku?: string;
    sessionId?: string;
  }) =>
    request<{
      decision?: string;
      reason?: string;
      status?: string;
      command?: unknown;
      exportOnly?: boolean;
    }>("/iot-lab/live/intent", { method: "POST", body: JSON.stringify(body) }),
  getManufacturingPack: (artifactId: string) =>
    request<{
      artifactId: string;
      gate: string;
      watermark: boolean;
      files: Array<{ path: string; kind: string }>;
    }>(`/manufacturing/artifacts/${artifactId}/pack`),
  validateManufacturing: (artifactId: string) =>
    request<{
      ok: boolean;
      engine: string;
      issues: Array<{ severity: string; code: string; message: string }>;
    }>(`/manufacturing/artifacts/${artifactId}/validate`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  createManufacturingQuote: (artifactId: string, vendor = "deeplink") =>
    request<{
      id: string;
      mode: string;
      deeplinkUrl?: string;
      blockedReason?: string;
      amountUsd?: number;
    }>(`/manufacturing/artifacts/${artifactId}/quotes`, {
      method: "POST",
      body: JSON.stringify({ vendor }),
    }),
  createLaunchPack: (artifactId: string, channels: string[] = ["markdown", "tindie"]) =>
    request<{
      artifactId: string;
      readyToSell: boolean;
      channels: string[];
      checklist: Array<{ id: string; label: string; done: boolean }>;
      markdown: string;
    }>(`/launch/artifacts/${artifactId}/pack`, {
      method: "POST",
      body: JSON.stringify({ channels }),
    }),
  getMembership: () => request<MembershipResponse>("/membership"),
  ensureTrial: (body?: { organizationId?: string }) =>
    request<unknown>("/membership/trial/ensure", {
      method: "POST",
      body: JSON.stringify(body ?? {}),
      // Strict Mode remounts App effect → avoid duplicate trial ensure
      coalesce: true,
    }),
  commerceCatalog: (market?: string) =>
    request<Record<string, unknown>>(
      `/commerce/catalog${market ? `?market=${encodeURIComponent(market)}` : ""}`,
    ),
  commerceMethods: (currency?: string) =>
    request<Record<string, unknown>>(
      `/commerce/methods${currency ? `?currency=${encodeURIComponent(currency)}` : ""}`,
    ),
  commerceLegal: () => request<Record<string, unknown>>("/commerce/legal"),
  commerceAcceptLegal: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>("/commerce/legal/accept", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  commerceCreateOrder: (body: Record<string, unknown>) =>
    request<{ id: string } & Record<string, unknown>>("/commerce/orders", {
      method: "POST",
      body: JSON.stringify(stripClientPriceFields(body)),
    }),
  commercePayOrder: (id: string, body: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/commerce/orders/${encodeURIComponent(id)}/pay`, {
      method: "POST",
      body: JSON.stringify(stripClientPriceFields(body)),
    }),
  commerceCompleteOrder: (id: string, body?: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/commerce/orders/${encodeURIComponent(id)}/complete`, {
      method: "POST",
      body: JSON.stringify(stripClientPriceFields(body ?? {})),
    }),
  commerceOrderStatus: (id: string) =>
    request<Record<string, unknown>>(`/commerce/orders/${encodeURIComponent(id)}`),
};
