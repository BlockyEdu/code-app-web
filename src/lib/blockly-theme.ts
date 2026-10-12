import * as Blockly from "blockly";

/**
 * Studio palette. Secondary/tertiary are the same hue mixed toward black
 * so Zelos blocks keep a fill, a darker input, and a darker edge.
 */
export const STUDIO_PALETTE = {
  logic: "#5B8DEF",
  loops: "#2FB67C",
  math: "#7C6CF2",
  text: "#E2894B",
  lists: "#D45FA0",
  variables: "#E0B33A",
  functions: "#3BB0C9",
  device: "#14B8A6",
  sensor: "#0EA5E9",
  scene: "#F2685C",
  output: "#64748B",
} as const;

export const STUDIO_BLOCK = {
  logic: "logic_blocks",
  loops: "loop_blocks",
  math: "math_blocks",
  text: "text_blocks",
  lists: "list_blocks",
  variables: "variable_blocks",
  functions: "procedure_blocks",
  device: "device_blocks",
  sensor: "sensor_blocks",
  scene: "scene_blocks",
  output: "output_blocks",
  /** Event/start. Hat cap is drawn only when the block has no previous connection. */
  event: "event_blocks",
} as const;

export const STUDIO_CATEGORY = {
  logic: "logic_category",
  loops: "loop_category",
  math: "math_category",
  text: "text_category",
  lists: "list_category",
  variables: "variable_category",
  functions: "procedure_category",
  lights: "lights_category",
  climate: "climate_category",
  sensors: "sensor_category",
  scenes: "scene_category",
  channels: "channel_category",
  kit: "kit_category",
  safety: "safety_category",
  page: "page_category",
  style: "style_category",
  events: "event_category",
  pages: "pages_category",
  nav: "nav_category",
  data: "data_category",
  motors: "motor_category",
  sound: "sound_category",
  sequence: "sequence_category",
  output: "output_category",
} as const;

const THEME_NAME = "blockyedu_studio";

const CANVAS = "#11151d";
const CHROME = "#0d1118";

type GlyphShape =
  | { kind: "path"; d: string; fill?: boolean }
  | { kind: "circle"; cx: number; cy: number; r: number; fill?: boolean };

const GLYPHS: Record<string, GlyphShape[]> = {
  [STUDIO_CATEGORY.logic]: [{ kind: "path", d: "M8 2.2 13.2 8 8 13.8 2.8 8Z" }],
  [STUDIO_CATEGORY.loops]: [
    { kind: "path", d: "M12.6 8.2a4.6 4.6 0 1 1-1.2-3.2" },
    { kind: "path", d: "M12.7 2.6v2.8H9.9" },
  ],
  [STUDIO_CATEGORY.math]: [{ kind: "path", d: "M8 3.2v9.6M3.2 8h9.6" }],
  [STUDIO_CATEGORY.text]: [{ kind: "path", d: "M3.6 4.2h8.8M8 4.2v8" }],
  [STUDIO_CATEGORY.lists]: [{ kind: "path", d: "M3.4 4.4h9.2M3.4 8h9.2M3.4 11.6h6" }],
  [STUDIO_CATEGORY.variables]: [{ kind: "path", d: "M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" }],
  variable_dynamic_category: [{ kind: "path", d: "M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" }],
  [STUDIO_CATEGORY.functions]: [
    {
      kind: "path",
      d: "M6.4 3.2c-1.5.1-2 .9-2 2v1.2c0 .7-.3 1-1.1 1.1.8 0 1.1.4 1.1 1.1v1.2c0 1.1.5 1.9 2 2",
    },
    {
      kind: "path",
      d: "M9.6 3.2c1.5.1 2 .9 2 2v1.2c0 .7.3 1 1.1 1.1-.8 0-1.1.4-1.1 1.1v1.2c0 1.1-.5 1.9-2 2",
    },
  ],
  [STUDIO_CATEGORY.lights]: [
    { kind: "path", d: "M8 2.4a3.1 3.1 0 0 0-1.5 5.9v1.3h3V8.3A3.1 3.1 0 0 0 8 2.4Z" },
    { kind: "path", d: "M6.7 11.2h2.6M7.1 12.8h1.8" },
  ],
  [STUDIO_CATEGORY.climate]: [
    { kind: "path", d: "M8 2.4v6.6" },
    { kind: "circle", cx: 8, cy: 11.4, r: 2.1 },
  ],
  [STUDIO_CATEGORY.sensors]: [
    { kind: "path", d: "M2.6 11.4a6.2 6.2 0 0 1 10.8 0" },
    { kind: "path", d: "M4.6 11.6a3.6 3.6 0 0 1 6.8 0" },
    { kind: "circle", cx: 8, cy: 12.2, r: 1, fill: true },
  ],
  [STUDIO_CATEGORY.scenes]: [
    { kind: "path", d: "M8 2.2 9.2 6.4 13.4 7.2 9.2 8.2 8 12.4 6.8 8.2 2.6 7.2 6.8 6.4Z" },
  ],
  [STUDIO_CATEGORY.channels]: [
    { kind: "path", d: "M3.2 4.4h9.6M3.2 8h9.6M3.2 11.6h9.6" },
    { kind: "circle", cx: 6, cy: 4.4, r: 1.15, fill: true },
    { kind: "circle", cx: 10.2, cy: 8, r: 1.15, fill: true },
    { kind: "circle", cx: 7.2, cy: 11.6, r: 1.15, fill: true },
  ],
  [STUDIO_CATEGORY.kit]: [
    { kind: "path", d: "M5 5h6v6H5Z" },
    {
      kind: "path",
      d: "M6.6 2.6v2.4M9.4 2.6v2.4M6.6 11v2.4M9.4 11v2.4M2.6 6.6h2.4M2.6 9.4h2.4M11 6.6h2.4M11 9.4h2.4",
    },
  ],
  [STUDIO_CATEGORY.safety]: [
    { kind: "path", d: "M8 2.4 12.4 4.2v3.4c0 2.5-1.8 4.2-4.4 5-2.6-.8-4.4-2.5-4.4-5V4.2Z" },
  ],
  [STUDIO_CATEGORY.page]: [
    { kind: "path", d: "M3.2 3.2h9.6v9.6H3.2Z" },
    { kind: "path", d: "M3.2 6.4h9.6" },
  ],
  [STUDIO_CATEGORY.style]: [
    { kind: "circle", cx: 5.2, cy: 6, r: 1.7 },
    { kind: "circle", cx: 9.2, cy: 4.8, r: 1.7 },
    { kind: "circle", cx: 11.2, cy: 8.4, r: 1.7 },
    { kind: "circle", cx: 7.2, cy: 10.6, r: 1.7 },
  ],
  [STUDIO_CATEGORY.events]: [{ kind: "path", d: "M9.2 2.2 4.6 8.4h3.1L6.6 13.8 12 7.2H8.6Z" }],
  [STUDIO_CATEGORY.pages]: [
    { kind: "path", d: "M4.2 3.2h7.2v6.4H4.2Z" },
    { kind: "path", d: "M6 12.2h6.4a1 1 0 0 0 1-1V6.2" },
  ],
  [STUDIO_CATEGORY.nav]: [{ kind: "path", d: "M3 8h9.2M8.8 4.4 12.6 8 8.8 11.6" }],
  [STUDIO_CATEGORY.data]: [
    { kind: "path", d: "M4 5.2c0-1 1.8-1.8 4-1.8s4 .8 4 1.8v6.2c0 1-1.8 1.8-4 1.8s-4-.8-4-1.8Z" },
    { kind: "path", d: "M4 5.2c0 1 1.8 1.8 4 1.8s4-.8 4-1.8" },
    { kind: "path", d: "M4 8.2c0 1 1.8 1.8 4 1.8s4-.8 4-1.8" },
  ],
  [STUDIO_CATEGORY.motors]: [
    { kind: "circle", cx: 8, cy: 8, r: 2.1 },
    {
      kind: "path",
      d: "M8 2.4v1.7M8 11.9v1.7M2.4 8h1.7M11.9 8h1.7M4.1 4.1l1.2 1.2M10.7 10.7l1.2 1.2M11.9 4.1 10.7 5.3M5.3 10.7 4.1 11.9",
    },
  ],
  [STUDIO_CATEGORY.sound]: [
    { kind: "path", d: "M3.4 6.2h2.3L8.8 3.6v8.8L5.7 9.8H3.4Z" },
    { kind: "path", d: "M10.6 6.1a2.8 2.8 0 0 1 0 3.8" },
  ],
  [STUDIO_CATEGORY.sequence]: [
    { kind: "circle", cx: 8, cy: 8, r: 5 },
    { kind: "path", d: "M8 5v3.2l2.2 1.4" },
  ],
  [STUDIO_CATEGORY.output]: [
    { kind: "path", d: "M3 3.4h10v9.2H3Z" },
    { kind: "path", d: "M5 10.2 6.6 8.4 5 6.6M8.2 10.4h2.6" },
  ],
};

function channel(hex: string, index: number): number {
  return Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
}

function mixHex(hex: string, target: string, amount: number): string {
  const mix = (index: number) => {
    const value = channel(hex, index) + (channel(target, index) - channel(hex, index)) * amount;
    return Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${mix(0)}${mix(1)}${mix(2)}`.toUpperCase();
}

function relativeLuminance(hex: string): number {
  const linear = (value: number) => {
    const channelUnit = value / 255;
    return channelUnit <= 0.03928 ? channelUnit / 12.92 : ((channelUnit + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * linear(channel(hex, 0)) +
    0.7152 * linear(channel(hex, 1)) +
    0.0722 * linear(channel(hex, 2))
  );
}

/** Dark ink on the bright tiles; white ink on the slate output tile. */
export function glyphInk(hex: string): string {
  return relativeLuminance(hex) < 0.2 ? "#F8FAFC" : "#1A1408";
}

function blockStyle(primary: string, hat?: "cap"): Blockly.Theme.BlockStyle {
  return {
    colourPrimary: primary,
    colourSecondary: mixHex(primary, "#000000", 0.16),
    colourTertiary: mixHex(primary, "#000000", 0.3),
    hat: hat ?? "",
  };
}

function categoryColour(primary: string): Blockly.Theme.CategoryStyle {
  return { colour: primary };
}

const blockStyles: Record<string, Blockly.Theme.BlockStyle> = {
  [STUDIO_BLOCK.logic]: blockStyle(STUDIO_PALETTE.logic),
  [STUDIO_BLOCK.loops]: blockStyle(STUDIO_PALETTE.loops),
  [STUDIO_BLOCK.math]: blockStyle(STUDIO_PALETTE.math),
  [STUDIO_BLOCK.text]: blockStyle(STUDIO_PALETTE.text),
  [STUDIO_BLOCK.lists]: blockStyle(STUDIO_PALETTE.lists),
  [STUDIO_BLOCK.variables]: blockStyle(STUDIO_PALETTE.variables),
  variable_dynamic_blocks: blockStyle(STUDIO_PALETTE.variables),
  [STUDIO_BLOCK.functions]: blockStyle(STUDIO_PALETTE.functions),
  [STUDIO_BLOCK.device]: blockStyle(STUDIO_PALETTE.device),
  [STUDIO_BLOCK.sensor]: blockStyle(STUDIO_PALETTE.sensor),
  [STUDIO_BLOCK.scene]: blockStyle(STUDIO_PALETTE.scene),
  [STUDIO_BLOCK.output]: blockStyle(STUDIO_PALETTE.output),
  [STUDIO_BLOCK.event]: blockStyle(STUDIO_PALETTE.logic, "cap"),
  hat_blocks: blockStyle(STUDIO_PALETTE.logic, "cap"),
};

const categoryStyles: Record<string, Blockly.Theme.CategoryStyle> = {
  [STUDIO_CATEGORY.logic]: categoryColour(STUDIO_PALETTE.logic),
  [STUDIO_CATEGORY.loops]: categoryColour(STUDIO_PALETTE.loops),
  [STUDIO_CATEGORY.math]: categoryColour(STUDIO_PALETTE.math),
  [STUDIO_CATEGORY.text]: categoryColour(STUDIO_PALETTE.text),
  [STUDIO_CATEGORY.lists]: categoryColour(STUDIO_PALETTE.lists),
  [STUDIO_CATEGORY.variables]: categoryColour(STUDIO_PALETTE.variables),
  variable_dynamic_category: categoryColour(STUDIO_PALETTE.variables),
  [STUDIO_CATEGORY.functions]: categoryColour(STUDIO_PALETTE.functions),
  [STUDIO_CATEGORY.lights]: categoryColour(STUDIO_PALETTE.device),
  [STUDIO_CATEGORY.climate]: categoryColour(STUDIO_PALETTE.device),
  [STUDIO_CATEGORY.sensors]: categoryColour(STUDIO_PALETTE.sensor),
  [STUDIO_CATEGORY.scenes]: categoryColour(STUDIO_PALETTE.scene),
  [STUDIO_CATEGORY.channels]: categoryColour(STUDIO_PALETTE.sensor),
  [STUDIO_CATEGORY.kit]: categoryColour(STUDIO_PALETTE.device),
  [STUDIO_CATEGORY.safety]: categoryColour(STUDIO_PALETTE.scene),
  [STUDIO_CATEGORY.page]: categoryColour(STUDIO_PALETTE.text),
  [STUDIO_CATEGORY.style]: categoryColour(STUDIO_PALETTE.lists),
  [STUDIO_CATEGORY.events]: categoryColour(STUDIO_PALETTE.logic),
  [STUDIO_CATEGORY.pages]: categoryColour(STUDIO_PALETTE.text),
  [STUDIO_CATEGORY.nav]: categoryColour(STUDIO_PALETTE.functions),
  [STUDIO_CATEGORY.data]: categoryColour(STUDIO_PALETTE.variables),
  [STUDIO_CATEGORY.motors]: categoryColour(STUDIO_PALETTE.device),
  [STUDIO_CATEGORY.sound]: categoryColour(STUDIO_PALETTE.device),
  [STUDIO_CATEGORY.sequence]: categoryColour(STUDIO_PALETTE.loops),
  [STUDIO_CATEGORY.output]: categoryColour(STUDIO_PALETTE.output),
};

if (Blockly.registry.hasItem(Blockly.registry.Type.THEME, THEME_NAME)) {
  Blockly.registry.unregister(Blockly.registry.Type.THEME, THEME_NAME);
}

/** Dark Zelos theme for the create workspace. Export name kept for existing importers. */
export const BLOCKYEDU_BLOCKLY_THEME = Blockly.Theme.defineTheme(THEME_NAME, {
  name: THEME_NAME,
  base: Blockly.Themes.Zelos,
  blockStyles,
  categoryStyles,
  componentStyles: {
    workspaceBackgroundColour: CANVAS,
    toolboxBackgroundColour: CHROME,
    toolboxForegroundColour: "#e8eef7",
    flyoutBackgroundColour: CHROME,
    flyoutForegroundColour: "#e8eef7",
    flyoutOpacity: 1,
    scrollbarColour: "#3d4b63",
    scrollbarOpacity: 0.5,
    insertionMarkerColour: "#94a3b8",
    insertionMarkerOpacity: 0.4,
    markerColour: STUDIO_PALETTE.logic,
    cursorColour: "#e8eef7",
    selectedGlowColour: STUDIO_PALETTE.logic,
    selectedGlowOpacity: 0.55,
  },
  // Blockly applies this number as points. 10pt renders at about 13px.
  fontStyle: {
    family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    weight: "600",
    size: 10,
  },
});

const SVG_NS = "http://www.w3.org/2000/svg";

function createCategoryGlyph(styleName: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  const shapes = GLYPHS[styleName] ?? GLYPHS[STUDIO_CATEGORY.logic];
  for (const shape of shapes) {
    if (shape.kind === "circle") {
      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", String(shape.cx));
      circle.setAttribute("cy", String(shape.cy));
      circle.setAttribute("r", String(shape.r));
      circle.setAttribute("fill", shape.fill ? "currentColor" : "none");
      circle.setAttribute("stroke", "currentColor");
      circle.setAttribute("stroke-width", shape.fill ? "0" : "1.6");
      svg.append(circle);
      continue;
    }
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", shape.d);
    path.setAttribute("fill", shape.fill ? "currentColor" : "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
  }
  return svg;
}

/**
 * Toolbox row: rounded colour tile + label. Selected state is styled in CSS
 * (light fill and a left accent) instead of Blockly's full-colour row fill.
 */
class StudioToolboxCategory extends Blockly.ToolboxCategory {
  protected override createIconDom_(): Element {
    const icon = document.createElement("span");
    icon.className = "blocklyToolboxCategoryIcon blocklyStudioCategoryIcon";
    icon.dataset.categoryStyle = this.toolboxItemDef_.categorystyle ?? "";
    icon.append(createCategoryGlyph(this.toolboxItemDef_.categorystyle ?? ""));
    return icon;
  }

  protected override addColourBorder_(colour: string): void {
    super.addColourBorder_(colour);
    const accent = colour || STUDIO_PALETTE.output;
    this.rowDiv_?.style.setProperty("--studio-accent", accent);
    if (this.iconDom_ instanceof HTMLElement) {
      this.iconDom_.style.backgroundColor = accent;
      this.iconDom_.style.color = glyphInk(accent);
    }
  }

  override setSelected(isSelected: boolean): void {
    super.setSelected(isSelected);
    if (this.rowDiv_) this.rowDiv_.style.backgroundColor = "";
  }
}

/** Register the studio category and tighten scrollbars before `Blockly.inject`. */
export function installStudioToolbox(): void {
  Blockly.ToolboxCategory.borderWidth = 3;
  Blockly.Scrollbar.scrollbarThickness = 8;
  Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    StudioToolboxCategory,
    true,
  );
}

/** Recolour the built-in print block without changing its fields or generator. */
export function applyStudioBuiltinStyles(): void {
  const definition = Blockly.Blocks.text_print;
  if (!definition) return;
  const current = definition.init as Blockly.Block["init"] & { __blockyeduOutput?: boolean };
  if (current.__blockyeduOutput) return;
  const original = definition.init;
  const wrapped = function (this: Blockly.Block) {
    original.call(this);
    this.setStyle(STUDIO_BLOCK.output);
  };
  wrapped.__blockyeduOutput = true;
  definition.init = wrapped;
}

/** Vertical gap between flyout blocks. */
export const STUDIO_FLYOUT_GAP = 12;

export function applyStudioFlyoutGap(workspace: Blockly.WorkspaceSvg): void {
  const flyout = workspace.getFlyout();
  if (!flyout) return;
  (flyout as unknown as { GAP_Y: number }).GAP_Y = STUDIO_FLYOUT_GAP;
}
