import type { ArtifactKind } from "../types/artifact";
import type { AppSchema } from "./app-studio/app-schema";
import type { ArtifactFileEntry } from "./artifact-files";

const STORAGE_KEY = "blockyedu:guest-draft";

export type GuestDraft = {
  sampleSlug: string | null;
  kind: ArtifactKind;
  name: string;
  templateId: string | null;
  intent?: string;
  languageId: string;
  code: string;
  blockXml: string;
  files: ArtifactFileEntry[];
  activeFilePath: string;
  editorMode: "blockly" | "monaco";
  surfaceMode: "design" | "data" | "logic" | "code";
  appSchema: AppSchema | null;
  selectedNodeId: string | null;
};

/** Set when this document already seeded the editor, so a route change does not reset it. */
let skipBootKey: string | null = null;

export function markGuestBooted(key: string): void {
  skipBootKey = key;
}

export function consumeGuestBootSkip(key: string): boolean {
  if (skipBootKey !== key) return false;
  skipBootKey = null;
  return true;
}

export function guestBootKey(sampleSlug: string | null): string {
  return sampleSlug || "untitled";
}

export function readGuestDraft(): GuestDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestDraft;
    if (!parsed || typeof parsed.kind !== "string" || !Array.isArray(parsed.files)) return null;
    return { ...parsed, selectedNodeId: parsed.selectedNodeId ?? null };
  } catch {
    return null;
  }
}

export function writeGuestDraft(draft: GuestDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* private mode or quota */
  }
}

/** Official samples should not reopen onto an empty Blockly canvas. */
export function isBlankGuestEditor(draft: GuestDraft): boolean {
  const compact = draft.blockXml.replace(/\s/g, "");
  return (
    !compact ||
    compact === '<xmlxmlns="https://developers.google.com/blockly/xml"></xml>' ||
    compact === "<xml></xml>"
  );
}

export function clearGuestDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
