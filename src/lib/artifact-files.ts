/**
 * Map workspace editor buffers ↔ Artifact file tree paths.
 * Create kinds persist Blockly XML + generated JS into draft snapshots.
 */
import type { ArtifactKind } from "../types/artifact";

export type ArtifactFileEntry = { path: string; contentType: string; content: string };

/** Contract `contentType` for a snapshot path: `json` | `text` (binary_ref is not inferred from path). */
export function contentTypeForPath(path: string): "json" | "text" {
  return path.toLowerCase().endsWith(".json") ? "json" : "text";
}

/** Primary JS/code path written by the editor for each kind. */
export function codePathForKind(kind: ArtifactKind): string {
  switch (kind) {
    case "web":
      return "app.js";
    case "miniprogram":
      return "pages/index/index.js";
    case "smarthome":
      return "behavior.js";
    case "iot":
      return "behavior.js";
    case "toy":
      return "behavior.js";
    case "free":
    case "exercise":
      return "main.js";
    default: {
      const _e: never = kind;
      return _e;
    }
  }
}

/** Blockly workspace XML path (optional; created on first save). */
export function blocksPathForKind(kind: ArtifactKind): string {
  switch (kind) {
    case "web":
      return "blocks/web.blocks.xml";
    case "miniprogram":
      return "blocks/miniprogram.blocks.xml";
    case "smarthome":
      return "blocks/smarthome.blocks.xml";
    case "iot":
      return "blocks/iot.blocks.xml";
    case "toy":
      return "blocks/toy.blocks.xml";
    case "free":
      return "blocks/free.blocks.xml";
    case "exercise":
      return "blocks/exercise.blocks.xml";
    default: {
      const _e: never = kind;
      return _e;
    }
  }
}

export function filesToMap(files: ArtifactFileEntry[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of files) map[f.path] = f.content ?? "";
  return map;
}

export function pickFile(map: Record<string, string>, candidates: string[]): string | undefined {
  for (const c of candidates) {
    if (map[c] !== undefined) return map[c];
    const hit = Object.keys(map).find((k) => k.endsWith(`/${c}`));
    if (hit) return map[hit];
  }
  return undefined;
}

export function extractEditorBuffers(
  kind: ArtifactKind,
  files: ArtifactFileEntry[],
): { code: string; blockXml: string } {
  const map = filesToMap(files);
  const code =
    pickFile(map, [
      codePathForKind(kind),
      "firmware/main.cpp",
      "behavior.js",
      "app.js",
      "main.js",
    ]) ?? "";
  const blockXml =
    pickFile(map, [blocksPathForKind(kind), "behavior.blocks", "blocks.xml", "main.blocks.xml"]) ??
    "";
  return { code, blockXml };
}

/** Partial upsert — server putFiles merges into the current draft snapshot. */
export function buildSaveFiles(
  kind: ArtifactKind,
  code: string,
  blockXml: string,
  extra: ArtifactFileEntry[] = [],
): ArtifactFileEntry[] {
  const codePath = codePathForKind(kind);
  const files: ArtifactFileEntry[] = [
    {
      path: codePath,
      contentType: contentTypeForPath(codePath),
      content: code,
    },
  ];
  if (blockXml.trim()) {
    const blocksPath = blocksPathForKind(kind);
    files.push({
      path: blocksPath,
      contentType: contentTypeForPath(blocksPath),
      content: blockXml,
    });
  }
  for (const f of extra) {
    if (f.path !== codePath) files.push(f);
  }
  return files;
}
