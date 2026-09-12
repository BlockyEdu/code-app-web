import type { PreviewType } from "../types/artifact";
import { t } from "./i18n";

export function previewLabel(previewType: PreviewType): string {
  return t(`preview.type.${previewType}`);
}
