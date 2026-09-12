import type { ArtifactKind } from "../types/artifact";
import { t } from "./i18n";

export function kindLabel(kind: ArtifactKind): string {
  return t(`kind.${kind}`);
}

export function untitledArtifactName(kind: ArtifactKind): string {
  return t("kind.untitled", { kind: kindLabel(kind) });
}
