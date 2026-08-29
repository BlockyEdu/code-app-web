export type ArtifactKind =
  | "web"
  | "miniprogram"
  | "smarthome"
  | "iot"
  | "toy"
  | "free"
  | "exercise";

/** Preview surface for non-console kinds (console kinds use bottom console). */
export type PreviewType = "artifact" | "simulation" | "smarthome" | "console" | "firmware";

export type LeftPanelTab = "files" | "modules" | "templates" | "learn" | "launch";

export const ARTIFACT_KIND_ORDER: ArtifactKind[] = [
  "web",
  "miniprogram",
  "smarthome",
  "iot",
  "toy",
  "free",
  "exercise",
];

export const KIND_LABEL: Record<ArtifactKind, string> = {
  web: "Web 作品",
  miniprogram: "微信小程序",
  smarthome: "智能家居",
  iot: "物联网",
  toy: "智能玩具",
  free: "自由编程",
  exercise: "编程练习",
};

export const KIND_COLOR: Record<ArtifactKind, string> = {
  web: "#3b82f6",
  miniprogram: "#16a34a",
  smarthome: "#0ea5e9",
  iot: "#14b8a6",
  toy: "#d97706",
  free: "#64748b",
  exercise: "#7c3aed",
};

export const KIND_DEFAULT_PREVIEW: Record<ArtifactKind, PreviewType> = {
  web: "artifact",
  miniprogram: "artifact",
  smarthome: "smarthome",
  iot: "firmware",
  toy: "simulation",
  free: "console",
  exercise: "console",
};

export const PREVIEW_LABEL: Record<PreviewType, string> = {
  artifact: "作品预览",
  simulation: "仿真运行",
  /** UI 固定文案仍为「仿真运行」（spec §5）；面板标题可另写「设备面板」 */
  smarthome: "仿真运行",
  firmware: "固件仿真",
  console: "控制台运行",
};

/** Console-only kinds (no right preview panel). */
export function isConsoleKind(kind: ArtifactKind): boolean {
  return kind === "exercise" || kind === "free";
}

/** Kinds that use smarthome simulation preview / APIs. */
export function isHomeSimKind(kind: ArtifactKind): boolean {
  return kind === "smarthome";
}

export function isHardwareKind(kind: ArtifactKind): boolean {
  return kind === "iot";
}

/** Create kinds with Blockly target toolboxes (not free/exercise shared-only). */
export function isTargetBlockKind(
  kind: ArtifactKind,
): kind is Exclude<ArtifactKind, "exercise" | "free" | "iot"> {
  return kind !== "exercise" && kind !== "free" && kind !== "iot";
}
