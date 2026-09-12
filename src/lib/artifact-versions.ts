export const ARTIFACT_VERSION_STRIP_LIMIT = 8;

/** True when a version snapshot includes at least one file body. */
export function versionHasFiles<T>(
  version: { files?: readonly T[] | null } | null | undefined,
): version is { files: readonly T[] } {
  return (version?.files?.length ?? 0) > 0;
}

/** Newest-first lists: keep the first `limit` entries for the Files-tab strip. */
export function takeRecentArtifactVersions<T>(
  items: readonly T[] | null | undefined,
  limit = ARTIFACT_VERSION_STRIP_LIMIT,
): T[] {
  if (!items?.length || limit <= 0) return [];
  return items.slice(0, limit);
}

/** Relative time when the timestamp is recent; otherwise ISO (or the raw string). */
export function formatVersionTime(iso: string, locale?: string, now = Date.now()): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  const diffMs = ms - now;
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale || undefined, { numeric: "auto" });
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  if (abs < minute) return rtf.format(Math.round(diffMs / 1000), "second");
  if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (abs < day * 7) return rtf.format(Math.round(diffMs / day), "day");
  return new Date(ms).toISOString();
}
