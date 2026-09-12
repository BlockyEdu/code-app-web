import { useEffect, useRef } from "react";
import { useAuthStore } from "../lib/auth-store";
import { useWorkspaceStore } from "../stores/workspace";

const AUTOSAVE_MS = 1500;

/** Debounced draft save. Skips while a manual/in-flight save is running. */
export function useArtifactAutosave() {
  const saveDirty = useWorkspaceStore((s) => s.saveDirty);
  const saveStatus = useWorkspaceStore((s) => s.saveStatus);
  const code = useWorkspaceStore((s) => s.code);
  const blockXml = useWorkspaceStore((s) => s.blockXml);
  const artifactFiles = useWorkspaceStore((s) => s.artifactFiles);
  const appSchema = useWorkspaceStore((s) => s.appSchema);
  const user = useAuthStore((s) => s.user);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Retrigger debounce on content edits even when saveDirty stays true.
  // biome-ignore lint/correctness/useExhaustiveDependencies: code/blockXml/files reset the timer
  useEffect(() => {
    const clear = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!saveDirty || saveStatus === "saving" || !user) {
      clear();
      return clear;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const s = useWorkspaceStore.getState();
      if (!s.saveDirty || s.saveStatus === "saving") return;
      if (!useAuthStore.getState().user) return;
      void s.saveCurrentArtifact();
    }, AUTOSAVE_MS);

    return clear;
  }, [saveDirty, saveStatus, code, blockXml, artifactFiles, appSchema, user]);
}
