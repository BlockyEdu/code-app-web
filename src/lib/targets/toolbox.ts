import type * as Blockly from "blockly";
import { t } from "../../lib/i18n";
import type { ArtifactKind } from "../../types/artifact";
import { isConsoleKind, isTargetBlockKind } from "../../types/artifact";
import { STUDIO_CATEGORY, STUDIO_FLYOUT_GAP } from "../blockly-theme";
import { KIND_BLOCK_SPECS } from "./blocks";

type ToolboxItem = Blockly.utils.toolbox.ToolboxItemInfo;

function block(type: string): ToolboxItem {
  return { kind: "block", type, gap: STUDIO_FLYOUT_GAP };
}

function sharedCategories(): ToolboxItem[] {
  return [
    {
      kind: "category",
      name: t("toolbox.logic"),
      categorystyle: STUDIO_CATEGORY.logic,
      contents: [
        block("controls_if"),
        block("logic_compare"),
        block("logic_operation"),
        block("logic_negate"),
        block("logic_boolean"),
      ],
    },
    {
      kind: "category",
      name: t("toolbox.loops"),
      categorystyle: STUDIO_CATEGORY.loops,
      contents: [block("controls_repeat_ext"), block("controls_whileUntil"), block("controls_for")],
    },
    {
      kind: "category",
      name: t("toolbox.math"),
      categorystyle: STUDIO_CATEGORY.math,
      contents: [
        block("math_number"),
        block("math_arithmetic"),
        block("math_single"),
        block("math_random_int"),
      ],
    },
    {
      kind: "category",
      name: t("toolbox.text"),
      categorystyle: STUDIO_CATEGORY.text,
      contents: [block("text"), block("text_join"), block("text_length"), block("text_print")],
    },
    {
      kind: "category",
      name: t("toolbox.lists"),
      categorystyle: STUDIO_CATEGORY.lists,
      contents: [block("lists_create_with"), block("lists_length"), block("lists_getIndex")],
    },
    {
      kind: "category",
      name: t("toolbox.variables"),
      categorystyle: STUDIO_CATEGORY.variables,
      custom: "VARIABLE",
    },
    {
      kind: "category",
      name: t("toolbox.functions"),
      categorystyle: STUDIO_CATEGORY.functions,
      custom: "PROCEDURE",
    },
  ];
}

interface TargetCategory {
  name: string;
  categorystyle: string;
  types: string[];
}

function smarthomeCategories(): TargetCategory[] {
  return [
    {
      name: t("toolbox.lights"),
      categorystyle: STUDIO_CATEGORY.lights,
      types: ["home_light_switch", "home_light_brightness", "home_set_device"],
    },
    {
      name: t("toolbox.climate"),
      categorystyle: STUDIO_CATEGORY.climate,
      types: ["home_set_temperature"],
    },
    {
      name: t("toolbox.sensors"),
      categorystyle: STUDIO_CATEGORY.sensors,
      types: ["home_read_sensor", "home_trigger_sensor"],
    },
    {
      name: t("toolbox.scenes"),
      categorystyle: STUDIO_CATEGORY.scenes,
      types: ["home_run_scene", "home_wait"],
    },
    {
      name: t("toolbox.mqtt"),
      categorystyle: STUDIO_CATEGORY.channels,
      types: ["mqtt_publish", "mqtt_subscribe", "mqtt_payload"],
    },
  ];
}

function iotCategories(): TargetCategory[] {
  return [
    {
      name: t("toolbox.iotChannels"),
      categorystyle: STUDIO_CATEGORY.channels,
      types: ["iot_read_channel", "iot_set_channel"],
    },
    {
      name: t("toolbox.kit"),
      categorystyle: STUDIO_CATEGORY.kit,
      types: ["iot_command", "iot_evaluate_scene"],
    },
    {
      name: t("toolbox.safety"),
      categorystyle: STUDIO_CATEGORY.safety,
      types: ["iot_wait", "iot_emergency_stop"],
    },
  ];
}

function targetCategories(): Record<Exclude<ArtifactKind, "exercise" | "free">, TargetCategory[]> {
  return {
    web: [
      {
        name: t("toolbox.pageElements"),
        categorystyle: STUDIO_CATEGORY.page,
        types: ["web_add_heading", "web_add_text", "web_add_card", "web_add_image_box"],
      },
      {
        name: t("toolbox.style"),
        categorystyle: STUDIO_CATEGORY.style,
        types: ["web_set_title", "web_set_theme"],
      },
      {
        name: t("toolbox.events"),
        categorystyle: STUDIO_CATEGORY.events,
        types: ["web_add_button"],
      },
    ],
    miniprogram: [
      {
        name: t("toolbox.pages"),
        categorystyle: STUDIO_CATEGORY.pages,
        types: ["mp_create_page", "mp_add_component"],
      },
      {
        name: t("toolbox.nav"),
        categorystyle: STUDIO_CATEGORY.nav,
        types: ["mp_add_tab_button", "mp_navigate"],
      },
      {
        name: t("toolbox.dataBind"),
        categorystyle: STUDIO_CATEGORY.data,
        types: ["mp_set_data", "mp_bind_data", "mp_show_toast"],
      },
    ],
    smarthome: smarthomeCategories(),
    iot: iotCategories(),
    toy: [
      {
        name: t("toolbox.motors"),
        categorystyle: STUDIO_CATEGORY.motors,
        types: ["toy_move", "toy_stop", "toy_servo"],
      },
      {
        name: t("toolbox.lightsSound"),
        categorystyle: STUDIO_CATEGORY.sound,
        types: ["toy_led", "toy_buzzer", "toy_say"],
      },
      {
        name: t("toolbox.sensors"),
        categorystyle: STUDIO_CATEGORY.sensors,
        types: ["toy_read_sensor"],
      },
      {
        name: t("toolbox.sequence"),
        categorystyle: STUDIO_CATEGORY.sequence,
        types: ["toy_wait"],
      },
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
      categorystyle: category.categorystyle,
      contents: category.types.map((type) => block(type)),
    }));

  return {
    kind: "categoryToolbox",
    contents: [...targetItems, { kind: "sep" } as ToolboxItem, ...sharedCategories()],
  };
}
