import type * as Blockly from "blockly";
import type { ArtifactKind } from "../../types/artifact";
import { isConsoleKind, isTargetBlockKind } from "../../types/artifact";
import { KIND_BLOCK_SPECS } from "./blocks";

type ToolboxItem = Blockly.utils.toolbox.ToolboxItemInfo;

const SHARED_CATEGORIES: ToolboxItem[] = [
  {
    kind: "category",
    name: "逻辑",
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
    name: "循环",
    categorystyle: "loop_category",
    contents: [
      { kind: "block", type: "controls_repeat_ext" },
      { kind: "block", type: "controls_whileUntil" },
      { kind: "block", type: "controls_for" },
    ],
  },
  {
    kind: "category",
    name: "数学",
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
    name: "文本",
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
    name: "列表",
    categorystyle: "list_category",
    contents: [
      { kind: "block", type: "lists_create_with" },
      { kind: "block", type: "lists_length" },
      { kind: "block", type: "lists_getIndex" },
    ],
  },
  {
    kind: "category",
    name: "变量",
    categorystyle: "variable_category",
    custom: "VARIABLE",
  },
  {
    kind: "category",
    name: "函数",
    categorystyle: "procedure_category",
    custom: "PROCEDURE",
  },
];

interface TargetCategory {
  name: string;
  colour: string;
  types: string[];
}

const SMARTHOME_CATEGORIES: TargetCategory[] = [
  {
    name: "灯光与开关",
    colour: "180",
    types: ["home_light_switch", "home_light_brightness", "home_set_device"],
  },
  { name: "温控", colour: "175", types: ["home_set_temperature"] },
  {
    name: "传感器",
    colour: "170",
    types: ["home_read_sensor", "home_trigger_sensor"],
  },
  { name: "场景联动", colour: "165", types: ["home_run_scene", "home_wait"] },
];

const TARGET_CATEGORIES: Record<Exclude<ArtifactKind, "exercise" | "free">, TargetCategory[]> = {
  web: [
    {
      name: "页面元素",
      colour: "210",
      types: ["web_add_heading", "web_add_text", "web_add_card", "web_add_image_box"],
    },
    { name: "样式", colour: "200", types: ["web_set_title", "web_set_theme"] },
    { name: "事件交互", colour: "190", types: ["web_add_button"] },
  ],
  miniprogram: [
    {
      name: "页面与组件",
      colour: "120",
      types: ["mp_create_page", "mp_add_component"],
    },
    { name: "页面跳转", colour: "110", types: ["mp_add_tab_button", "mp_navigate"] },
    {
      name: "数据绑定",
      colour: "100",
      types: ["mp_set_data", "mp_bind_data", "mp_show_toast"],
    },
  ],
  smarthome: SMARTHOME_CATEGORIES,
  iot: SMARTHOME_CATEGORIES,
  toy: [
    { name: "电机与舵机", colour: "30", types: ["toy_move", "toy_stop", "toy_servo"] },
    { name: "灯光与声音", colour: "25", types: ["toy_led", "toy_buzzer", "toy_say"] },
    { name: "传感器", colour: "20", types: ["toy_read_sensor"] },
    { name: "动作序列", colour: "15", types: ["toy_wait"] },
  ],
};

/**
 * Build the toolbox for an artifact kind.
 * Create kinds get target categories first, then shared logic/loops/math/text/vars.
 * Exercise / free use shared categories only.
 */
export function buildToolbox(kind: ArtifactKind): Blockly.utils.toolbox.ToolboxDefinition {
  if (isConsoleKind(kind) || !isTargetBlockKind(kind)) {
    return { kind: "categoryToolbox", contents: SHARED_CATEGORIES };
  }

  const known = new Set(KIND_BLOCK_SPECS[kind].map((s) => s.type));
  const targetCategories: ToolboxItem[] = TARGET_CATEGORIES[kind]
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
    contents: [...targetCategories, { kind: "sep" } as ToolboxItem, ...SHARED_CATEGORIES],
  };
}
