import type * as Blockly from "blockly";
import { t } from "../../lib/i18n";
import type { ArtifactKind } from "../../types/artifact";
import { isConsoleKind, isTargetBlockKind } from "../../types/artifact";
import { KIND_BLOCK_SPECS } from "./blocks";

type ToolboxItem = Blockly.utils.toolbox.ToolboxItemInfo;

function sharedCategories(): ToolboxItem[] {
  return [
    {
      kind: "category",
      name: t("toolbox.logic"),
      categorystyle: "logic_category",
      contents: [
        { kind: "block", type: "controls_if" },
        { kind: "block", type: "logic_compare" },
        { kind: "block", type: "logic_operation" },
        { kind: "block", type: "logic_negate" },
        { kind: "block", type: "logic_boolean" },
      ],
    },
    {
      kind: "category",
      name: t("toolbox.loops"),
      categorystyle: "loop_category",
      contents: [
        { kind: "block", type: "controls_repeat_ext" },
        { kind: "block", type: "controls_whileUntil" },
        { kind: "block", type: "controls_for" },
      ],
    },
    {
      kind: "category",
      name: t("toolbox.math"),
      categorystyle: "math_category",
      contents: [
        { kind: "block", type: "math_number" },
        { kind: "block", type: "math_arithmetic" },
        { kind: "block", type: "math_single" },
        { kind: "block", type: "math_random_int" },
      ],
    },
    {
      kind: "category",
      name: t("toolbox.text"),
      categorystyle: "text_category",
      contents: [
        { kind: "block", type: "text" },
        { kind: "block", type: "text_join" },
        { kind: "block", type: "text_length" },
        { kind: "block", type: "text_print" },
      ],
    },
    {
      kind: "category",
      name: t("toolbox.lists"),
      categorystyle: "list_category",
      contents: [
        { kind: "block", type: "lists_create_with" },
        { kind: "block", type: "lists_length" },
        { kind: "block", type: "lists_getIndex" },
      ],
    },
    {
      kind: "category",
      name: t("toolbox.variables"),
      categorystyle: "variable_category",
      custom: "VARIABLE",
    },
    {
      kind: "category",
      name: t("toolbox.functions"),
      categorystyle: "procedure_category",
      custom: "PROCEDURE",
    },
  ];
}

interface TargetCategory {
  name: string;
  colour: string;
  types: string[];
}

function smarthomeCategories(): TargetCategory[] {
  return [
    {
      name: t("toolbox.lights"),
      colour: "180",
      types: ["home_light_switch", "home_light_brightness", "home_set_device"],
    },
    { name: t("toolbox.climate"), colour: "175", types: ["home_set_temperature"] },
    {
      name: t("toolbox.sensors"),
      colour: "170",
      types: ["home_read_sensor", "home_trigger_sensor"],
    },
    { name: t("toolbox.scenes"), colour: "165", types: ["home_run_scene", "home_wait"] },
  ];
}

function iotCategories(): TargetCategory[] {
  return [
    {
      name: t("toolbox.iotChannels"),
      colour: "165",
      types: ["iot_read_channel", "iot_set_channel"],
    },
    { name: t("toolbox.kit"), colour: "160", types: ["iot_command", "iot_evaluate_scene"] },
    { name: t("toolbox.safety"), colour: "0", types: ["iot_wait", "iot_emergency_stop"] },
  ];
}

function targetCategories(): Record<Exclude<ArtifactKind, "exercise" | "free">, TargetCategory[]> {
  return {
    web: [
      {
        name: t("toolbox.pageElements"),
        colour: "210",
        types: ["web_add_heading", "web_add_text", "web_add_card", "web_add_image_box"],
      },
      { name: t("toolbox.style"), colour: "200", types: ["web_set_title", "web_set_theme"] },
      { name: t("toolbox.events"), colour: "190", types: ["web_add_button"] },
    ],
    miniprogram: [
      {
        name: t("toolbox.pages"),
        colour: "120",
        types: ["mp_create_page", "mp_add_component"],
      },
      { name: t("toolbox.nav"), colour: "110", types: ["mp_add_tab_button", "mp_navigate"] },
      {
        name: t("toolbox.dataBind"),
        colour: "100",
        types: ["mp_set_data", "mp_bind_data", "mp_show_toast"],
      },
    ],
    smarthome: smarthomeCategories(),
    iot: iotCategories(),
    toy: [
      { name: t("toolbox.motors"), colour: "30", types: ["toy_move", "toy_stop", "toy_servo"] },
      { name: t("toolbox.lightsSound"), colour: "25", types: ["toy_led", "toy_buzzer", "toy_say"] },
      { name: t("toolbox.sensors"), colour: "20", types: ["toy_read_sensor"] },
      { name: t("toolbox.sequence"), colour: "15", types: ["toy_wait"] },
    ],
  };
}

/**
 * Build the toolbox for an artifact kind.
 * Create kinds get target categories first, then shared logic/loops/math/text/vars.
 * Exercise / free use shared categories only.
 */
export function buildToolbox(kind: ArtifactKind): Blockly.utils.toolbox.ToolboxDefinition {
  if (isConsoleKind(kind) || !isTargetBlockKind(kind)) {
    return { kind: "categoryToolbox", contents: sharedCategories() };
  }

  const known = new Set(KIND_BLOCK_SPECS[kind].map((s) => s.type));
  const categories = targetCategories()[kind];
  const targetItems: ToolboxItem[] = categories
    .map((category) => ({
      ...category,
      types: category.types.filter((type) => known.has(type)),
    }))
    .filter((category) => category.types.length > 0)
    .map((category) => ({
      kind: "category",
      name: category.name,
      colour: category.colour,
      contents: category.types.map((type) => ({ kind: "block", type })),
    }));

  return {
    kind: "categoryToolbox",
    contents: [...targetItems, { kind: "sep" } as ToolboxItem, ...sharedCategories()],
  };
}
