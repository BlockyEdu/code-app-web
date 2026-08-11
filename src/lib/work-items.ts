import type { ArtifactKind } from "../types/artifact";
import { api, type CreateArtifact, type Project, UnauthorizedError } from "./api";

export type WorkSource = "artifact" | "project";

/** Unified row for WorksPanel (create Artifact + legacy Project). */
export type WorkItem = {
  key: string;
  source: WorkSource;
  /** Open/save target id (artifact id or project id depending on source). */
  id: string;
  title: string;
  kind: ArtifactKind;
  updatedAt: string;
  language?: string | null;
  artifactId: string | null;
  workspaceProjectId: string | null;
};

/** Shared loader for hub + workspace works list (GET coalesced under the hood). */
export async function fetchWorkItems(limit = 50): Promise<WorkItem[]> {
  const [artifactsRes, projects] = await Promise.all([
    api.listArtifacts({ limit }),
    api.listProjects().catch((err) => {
      if (err instanceof UnauthorizedError) return [] as Project[];
      throw err;
    }),
  ]);
  return mergeWorkItems(artifactsRes.items, projects);
}

export function mergeWorkItems(artifacts: CreateArtifact[], projects: Project[]): WorkItem[] {
  const linkedProjectIds = new Set(
    artifacts.map((a) => a.workspaceProjectId).filter((id): id is string => Boolean(id)),
  );

  const fromArtifacts: WorkItem[] = artifacts.map((a) => ({
    key: `artifact:${a.id}`,
    source: "artifact",
    id: a.id,
    title: a.title,
    kind: a.kind,
    updatedAt: a.updatedAt,
    language: a.language,
    artifactId: a.id,
    workspaceProjectId: a.workspaceProjectId ?? null,
  }));

  const fromProjects: WorkItem[] = projects
    .filter((p) => !linkedProjectIds.has(p.id))
    .map((p) => ({
      key: `project:${p.id}`,
      source: "project" as const,
      id: p.id,
      title: p.name,
      kind: "exercise" as const,
      updatedAt: p.updatedAt,
      language: p.language,
      artifactId: null,
      workspaceProjectId: p.id,
    }));

  return [...fromArtifacts, ...fromProjects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
