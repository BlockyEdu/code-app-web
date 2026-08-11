import * as Blockly from "blockly";

/** Dark Zelos theme aligned with the create workspace shell. */
export const BLOCKYEDU_BLOCKLY_THEME = Blockly.Theme.defineTheme("blockyedu_dark", {
  name: "blockyedu_dark",
  base: Blockly.Themes.Zelos,
  componentStyles: {
    workspaceBackgroundColour: "#151a24",
    toolboxBackgroundColour: "#0f131a",
    toolboxForegroundColour: "#e2e8f0",
    flyoutBackgroundColour: "#121722",
    flyoutForegroundColour: "#e2e8f0",
    flyoutOpacity: 0.98,
    scrollbarColour: "#334155",
    scrollbarOpacity: 0.55,
    insertionMarkerColour: "#94a3b8",
    insertionMarkerOpacity: 0.35,
    markerColour: "#60a5fa",
    cursorColour: "#d1d5db",
  },
  fontStyle: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    weight: "500",
    size: 12,
  },
});
