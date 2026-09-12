import type { ArtifactLearnLink, LearnLinkSubmissionState } from "./api";

export type { ArtifactLearnLink, LearnLinkSubmissionState };

/** Submit is available once an artifact exists and the pin is not already submitted. */
export function shouldShowLessonSubmit(opts: {
  artifactId: string | null | undefined;
  submissionState?: LearnLinkSubmissionState | null;
}): boolean {
  return Boolean(opts.artifactId) && opts.submissionState !== "submitted";
}

export function isLessonSubmitted(state?: LearnLinkSubmissionState | null): boolean {
  return state === "submitted";
}

/** Same merge as code-server PUT /learn-link: patch fields overlay the stored link. */
export function mergeLearnLink(
  current: ArtifactLearnLink | null | undefined,
  patch: ArtifactLearnLink,
): ArtifactLearnLink {
  return { ...(current ?? {}), ...patch };
}

/** Interpolation suffix for `lesson.alreadySubmitted` (`{{version}}`). */
export function formatSubmittedVersion(submittedVersionId?: string | null): string {
  const id = submittedVersionId?.trim();
  return id ? ` (${id})` : "";
}
