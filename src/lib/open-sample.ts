import { useWorkspaceStore } from "../stores/workspace";
import { readGuestDraft } from "./guest-draft";
import { t } from "./i18n";
import { navigate } from "./navigate";
import { findOfficialSample } from "./official-samples";

/**
 * Opens a sample as a local editor copy.
 * One guest draft lives in this browser, so a different sample asks before replace.
 * `aiPrompt` is handed to the AI dock as an unsent draft.
 */
export async function openOfficialSample(slug: string, aiPrompt?: string): Promise<void> {
  const sample = findOfficialSample(slug);
  if (!sample) return;
  const draft = readGuestDraft();
  if (draft && draft.sampleSlug !== sample.slug) {
    const replace = window.confirm(t("samples.replaceDraft"));
    if (!replace) return;
  }
  const prompt = aiPrompt?.trim();
  if (draft?.sampleSlug === sample.slug) {
    if (prompt) useWorkspaceStore.getState().setPendingAiPrompt(prompt);
    navigate(`/sample/${sample.slug}`);
    return;
  }
  await useWorkspaceStore
    .getState()
    .createNewArtifact(sample.kind, t(sample.nameKey), "javascript", {
      templateId: sample.templateId,
      intent: sample.intent,
      localOnly: true,
      sampleSlug: sample.slug,
    });
  if (prompt) useWorkspaceStore.getState().setPendingAiPrompt(prompt);
  navigate(`/sample/${sample.slug}`);
}
