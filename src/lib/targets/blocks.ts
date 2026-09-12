/**
 * Kind-specific Blockly block definitions + JS generators.
 * Adapted from BlockyEdu Platform Specs `targets.ts` (website→web, miniapp→miniprogram).
 *
 * Display labels (`message0`, `tooltip`, dropdown text) call `t()` inside builders so
 * `registerTargetBlocks()` can re-define blocks after a locale switch.
 */
import * as Blockly from "blockly";
import type { ArtifactKind } from "../../types/artifact";
import { t } from "../i18n";
import { starterIotCode, starterIotXml } from "./iot-lab";

export interface BlockSpec {
  type: string;
  json: Record<string, unknown>;
  generator: (block: Blockly.Block, readValue: ValueReader) => string;
}

export type ValueReader = (block: Blockly.Block, name: string, fallback: string) => string;

function xmlText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const COLOR_WEB = 210;
const COLOR_MINIAPP = 120;
const COLOR_HOME = 180;
const COLOR_TOY = 30;
const COLOR_IOT = 165;

type DropdownOptions = Array<[string, string]>;

function roomOptions(): DropdownOptions {
  return [
    [t("room.living"), "living"],
    [t("room.bedroom"), "bedroom"],
    [t("room.kitchen"), "kitchen"],
  ];
}

function onOffOptions(): DropdownOptions {
  return [
    [t("action.on"), "on"],
    [t("action.off"), "off"],
  ];
}

function sensorOptions(): DropdownOptions {
  return [
    [t("sensor.temperature"), "temperature"],
    [t("sensor.humidity"), "humidity"],
    [t("sensor.light"), "light"],
    [t("sensor.motion"), "motion"],
    [t("sensor.smoke"), "smoke"],
    [t("sensor.door"), "door"],
  ];
}

function buildIotChannels(): DropdownOptions {
  return [
    [t("iotCh.rain"), "rain"],
    [t("iotCh.temperature"), "temperature"],
    [t("iotCh.position"), "position"],
    [t("iotCh.limit_open"), "limit_open"],
    [t("iotCh.limit_close"), "limit_close"],
    [t("iotCh.soil"), "soil"],
    [t("iotCh.flow"), "flow"],
    [t("iotCh.pump"), "pump"],
    [t("iotCh.zone"), "zone"],
    [t("iotCh.do_mgl"), "do_mgl"],
    [t("iotCh.level_pct"), "level_pct"],
    [t("iotCh.temp"), "temp"],
    [t("iotCh.aerator"), "aerator"],
    [t("iotCh.spray"), "spray"],
  ];
}

function buildIotCommands(): DropdownOptions {
  return [
    [t("iotCmd.open"), "open"],
    [t("iotCmd.close"), "close"],
    [t("iotCmd.stop"), "stop"],
    [t("iotCmd.setPosition"), "setPosition"],
    [t("iotCmd.zoneOn"), "zoneOn"],
    [t("iotCmd.zoneOff"), "zoneOff"],
    [t("iotCmd.pumpOn"), "pumpOn"],
    [t("iotCmd.pumpOff"), "pumpOff"],
    [t("iotCmd.aerateOn"), "aerateOn"],
    [t("iotCmd.aerateOff"), "aerateOff"],
    [t("iotCmd.sprayOn"), "sprayOn"],
    [t("iotCmd.sprayOff"), "sprayOff"],
  ];
}

function buildIotScenes(): DropdownOptions {
  return [
    [t("iotScene.win-rain-close"), "win-rain-close"],
    [t("iotScene.win-heat-vent"), "win-heat-vent"],
    [t("iotScene.win-manual"), "win-manual"],
    [t("iotScene.irr-soil"), "irr-soil"],
    [t("iotScene.irr-rain-skip"), "irr-rain-skip"],
    [t("iotScene.irr-dry-run"), "irr-dry-run"],
    [t("iotScene.pond-aerate"), "pond-aerate"],
    [t("iotScene.pond-spray"), "pond-spray"],
    [t("iotScene.pond-level"), "pond-level"],
    [t("iotScene.pack"), "pack"],
  ];
}

function buildWebsiteBlocks(): BlockSpec[] {
  return [
    {
      type: "web_set_title",
      json: {
        message0: t("blocks.webSetTitle"),
        args0: [{ type: "input_value", name: "TEXT", check: "String" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_WEB,
        tooltip: t("blocks.webSetTitleTip"),
      },
      generator: (block, readValue) => `web.setTitle(${readValue(block, "TEXT", "''")});\n`,
    },
    {
      type: "web_add_heading",
      json: {
        message0: t("blocks.webAddHeading"),
        args0: [
          { type: "input_value", name: "TEXT", check: "String" },
          {
            type: "field_dropdown",
            name: "LEVEL",
            options: [
              [t("headingSize.l"), "h1"],
              [t("headingSize.m"), "h2"],
              [t("headingSize.s"), "h3"],
            ],
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_WEB,
        tooltip: t("blocks.webAddHeadingTip"),
      },
      generator: (block, readValue) =>
        `web.addHeading(${readValue(block, "TEXT", "''")}, '${block.getFieldValue("LEVEL")}');\n`,
    },
    {
      type: "web_add_text",
      json: {
        message0: t("blocks.webAddText"),
        args0: [{ type: "input_value", name: "TEXT", check: "String" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_WEB,
        tooltip: t("blocks.webAddTextTip"),
      },
      generator: (block, readValue) => `web.addText(${readValue(block, "TEXT", "''")});\n`,
    },
    {
      type: "web_add_card",
      json: {
        message0: t("blocks.webAddCard"),
        args0: [
          { type: "input_value", name: "TITLE", check: "String" },
          { type: "input_value", name: "BODY", check: "String" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_WEB,
        tooltip: t("blocks.webAddCardTip"),
      },
      generator: (block, readValue) =>
        `web.addCard(${readValue(block, "TITLE", "''")}, ${readValue(block, "BODY", "''")});\n`,
    },
    {
      type: "web_add_button",
      json: {
        message0: t("blocks.webAddButton"),
        args0: [
          { type: "input_value", name: "LABEL", check: "String" },
          { type: "input_value", name: "MESSAGE", check: "String" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_WEB,
        tooltip: t("blocks.webAddButtonTip"),
      },
      generator: (block, readValue) =>
        `web.addButton(${readValue(block, "LABEL", JSON.stringify(t("starter.webButton")))}, ${readValue(block, "MESSAGE", "''")});\n`,
    },
    {
      type: "web_set_theme",
      json: {
        message0: t("blocks.webSetTheme"),
        args0: [
          {
            type: "field_dropdown",
            name: "PRIMARY",
            options: [
              [t("themeColor.blue"), "#1677ff"],
              [t("themeColor.green"), "#52c41a"],
              [t("themeColor.orange"), "#fa8c16"],
              [t("themeColor.purple"), "#722ed1"],
            ],
          },
          {
            type: "field_dropdown",
            name: "BG",
            options: [
              [t("themeBg.gray"), "#f5f5f5"],
              [t("themeBg.white"), "#ffffff"],
              [t("themeBg.blue"), "#e6f4ff"],
            ],
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_WEB,
        tooltip: t("blocks.webSetThemeTip"),
      },
      generator: (block) =>
        `web.setTheme('${block.getFieldValue("PRIMARY")}', '${block.getFieldValue("BG")}');\n`,
    },
    {
      type: "web_add_image_box",
      json: {
        message0: t("blocks.webAddImage"),
        args0: [{ type: "input_value", name: "CAPTION", check: "String" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_WEB,
        tooltip: t("blocks.webAddImageTip"),
      },
      generator: (block, readValue) => `web.addImageBox(${readValue(block, "CAPTION", "''")});\n`,
    },
  ];
}

function buildMiniappBlocks(): BlockSpec[] {
  return [
    {
      type: "mp_create_page",
      json: {
        message0: t("blocks.mpCreatePage"),
        args0: [
          { type: "field_input", name: "PAGE", text: "home" },
          { type: "input_value", name: "TITLE", check: "String" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_MINIAPP,
        tooltip: t("blocks.mpCreatePageTip"),
      },
      generator: (block, readValue) =>
        `mp.createPage('${block.getFieldValue("PAGE")}', ${readValue(block, "TITLE", "''")});\n`,
    },
    {
      type: "mp_add_component",
      json: {
        message0: t("blocks.mpAddComponent"),
        args0: [
          { type: "field_input", name: "PAGE", text: "home" },
          {
            type: "field_dropdown",
            name: "KIND",
            options: [
              [t("mpComp.text"), "text"],
              [t("mpComp.card"), "card"],
              [t("mpComp.list"), "list"],
              [t("mpComp.input"), "input"],
            ],
          },
          { type: "input_value", name: "CONTENT", check: "String" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_MINIAPP,
        tooltip: t("blocks.mpAddComponentTip"),
      },
      generator: (block, readValue) =>
        `mp.addComponent('${block.getFieldValue("PAGE")}', '${block.getFieldValue("KIND")}', ${readValue(block, "CONTENT", "''")});\n`,
    },
    {
      type: "mp_set_data",
      json: {
        message0: t("blocks.mpSetData"),
        args0: [
          { type: "field_input", name: "KEY", text: "count" },
          { type: "input_value", name: "VALUE" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_MINIAPP,
        tooltip: t("blocks.mpSetDataTip"),
      },
      generator: (block, readValue) =>
        `mp.setData('${block.getFieldValue("KEY")}', ${readValue(block, "VALUE", "''")});\n`,
    },
    {
      type: "mp_bind_data",
      json: {
        message0: t("blocks.mpBindData"),
        args0: [
          { type: "field_input", name: "PAGE", text: "home" },
          { type: "field_input", name: "KEY", text: "count" },
          { type: "input_value", name: "LABEL", check: "String" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_MINIAPP,
        tooltip: t("blocks.mpBindDataTip"),
      },
      generator: (block, readValue) =>
        `mp.bindData('${block.getFieldValue("PAGE")}', '${block.getFieldValue("KEY")}', ${readValue(block, "LABEL", "''")});\n`,
    },
    {
      type: "mp_add_tab_button",
      json: {
        message0: t("blocks.mpAddNav"),
        args0: [
          { type: "input_value", name: "LABEL", check: "String" },
          { type: "field_input", name: "PAGE", text: "detail" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_MINIAPP,
        tooltip: t("blocks.mpAddNavTip"),
      },
      generator: (block, readValue) =>
        `mp.addNavButton(${readValue(block, "LABEL", JSON.stringify(t("starter.mpNav")))}, '${block.getFieldValue("PAGE")}');\n`,
    },
    {
      type: "mp_navigate",
      json: {
        message0: t("blocks.mpNavigate"),
        args0: [{ type: "field_input", name: "PAGE", text: "home" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_MINIAPP,
        tooltip: t("blocks.mpNavigateTip"),
      },
      generator: (block) => `mp.navigate('${block.getFieldValue("PAGE")}');\n`,
    },
    {
      type: "mp_show_toast",
      json: {
        message0: t("blocks.mpToast"),
        args0: [{ type: "input_value", name: "TEXT", check: "String" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_MINIAPP,
        tooltip: t("blocks.mpToastTip"),
      },
      generator: (block, readValue) => `mp.showToast(${readValue(block, "TEXT", "''")});\n`,
    },
  ];
}

function buildSmarthomeBlocks(): BlockSpec[] {
  return [
    {
      type: "home_light_switch",
      json: {
        message0: t("blocks.homeSetLight"),
        args0: [
          {
            type: "field_dropdown",
            name: "ROOM",
            options: roomOptions(),
          },
          {
            type: "field_dropdown",
            name: "STATE",
            options: onOffOptions(),
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_HOME,
        tooltip: t("blocks.homeSetLightTip"),
      },
      generator: (block) =>
        `home.setLight('${block.getFieldValue("ROOM")}', '${block.getFieldValue("STATE")}');\n`,
    },
    {
      type: "home_light_brightness",
      json: {
        message0: t("blocks.homeSetBrightness"),
        args0: [
          {
            type: "field_dropdown",
            name: "ROOM",
            options: roomOptions(),
          },
          { type: "input_value", name: "VALUE", check: "Number" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_HOME,
        tooltip: t("blocks.homeSetBrightnessTip"),
      },
      generator: (block, readValue) =>
        `home.setBrightness('${block.getFieldValue("ROOM")}', ${readValue(block, "VALUE", "80")});\n`,
    },
    {
      type: "home_set_temperature",
      json: {
        message0: t("blocks.homeSetTemp"),
        args0: [{ type: "input_value", name: "VALUE", check: "Number" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_HOME,
        tooltip: t("blocks.homeSetTempTip"),
      },
      generator: (block, readValue) => `home.setTemperature(${readValue(block, "VALUE", "26")});\n`,
    },
    {
      type: "home_read_sensor",
      json: {
        message0: t("blocks.homeReadSensor"),
        args0: [
          {
            type: "field_dropdown",
            name: "SENSOR",
            options: sensorOptions(),
          },
        ],
        output: "Number",
        colour: COLOR_HOME,
        tooltip: t("blocks.homeReadSensorTip"),
      },
      generator: (block) => `home.readSensor('${block.getFieldValue("SENSOR")}')`,
    },
    {
      type: "home_trigger_sensor",
      json: {
        message0: t("blocks.homeTriggerSensor"),
        args0: [
          {
            type: "field_dropdown",
            name: "SENSOR",
            options: sensorOptions(),
          },
          { type: "input_value", name: "VALUE", check: "Number" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_HOME,
        tooltip: t("blocks.homeTriggerSensorTip"),
      },
      generator: (block, readValue) =>
        `home.triggerSensor('${block.getFieldValue("SENSOR")}', ${readValue(block, "VALUE", "0")});\n`,
    },
    {
      type: "home_run_scene",
      json: {
        message0: t("blocks.homeRunScene"),
        args0: [
          {
            type: "field_dropdown",
            name: "SCENE",
            options: [
              [t("scene.home"), "home"],
              [t("scene.away"), "away"],
              [t("scene.sleep"), "sleep"],
              [t("scene.movie"), "movie"],
            ],
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_HOME,
        tooltip: t("blocks.homeRunSceneTip"),
      },
      generator: (block) => `home.runScene('${block.getFieldValue("SCENE")}');\n`,
    },
    {
      type: "home_set_device",
      json: {
        message0: t("blocks.homeSetDevice"),
        args0: [
          {
            type: "field_dropdown",
            name: "DEVICE",
            options: [
              [t("device.curtain"), "curtain"],
              [t("device.socket"), "socket"],
              [t("device.fan"), "fan"],
              [t("device.alarm"), "alarm"],
            ],
          },
          {
            type: "field_dropdown",
            name: "STATE",
            options: onOffOptions(),
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_HOME,
        tooltip: t("blocks.homeSetDeviceTip"),
      },
      generator: (block) =>
        `home.setDevice('${block.getFieldValue("DEVICE")}', '${block.getFieldValue("STATE")}');\n`,
    },
    {
      type: "home_wait",
      json: {
        message0: t("blocks.homeWait"),
        args0: [{ type: "input_value", name: "SECONDS", check: "Number" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_HOME,
        tooltip: t("blocks.homeWaitTip"),
      },
      generator: (block, readValue) => `home.wait(${readValue(block, "SECONDS", "1")});\n`,
    },
  ];
}

function buildToyBlocks(): BlockSpec[] {
  return [
    {
      type: "toy_move",
      json: {
        message0: t("blocks.toyMove"),
        args0: [
          {
            type: "field_dropdown",
            name: "DIRECTION",
            options: [
              [t("move.forward"), "forward"],
              [t("move.backward"), "backward"],
              [t("move.left"), "left"],
              [t("move.right"), "right"],
            ],
          },
          { type: "input_value", name: "SPEED", check: "Number" },
          { type: "input_value", name: "SECONDS", check: "Number" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_TOY,
        tooltip: t("blocks.toyMoveTip"),
      },
      generator: (block, readValue) =>
        `toy.move('${block.getFieldValue("DIRECTION")}', ${readValue(block, "SPEED", "60")}, ${readValue(block, "SECONDS", "1")});\n`,
    },
    {
      type: "toy_stop",
      json: {
        message0: t("blocks.toyStop"),
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_TOY,
        tooltip: t("blocks.toyStopTip"),
      },
      generator: () => "toy.stop();\n",
    },
    {
      type: "toy_servo",
      json: {
        message0: t("blocks.toyServo"),
        args0: [
          {
            type: "field_dropdown",
            name: "SERVO",
            options: [
              [t("servo.head"), "head"],
              [t("servo.arm"), "arm"],
              [t("servo.claw"), "claw"],
            ],
          },
          { type: "input_value", name: "ANGLE", check: "Number" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_TOY,
        tooltip: t("blocks.toyServoTip"),
      },
      generator: (block, readValue) =>
        `toy.setServo('${block.getFieldValue("SERVO")}', ${readValue(block, "ANGLE", "90")});\n`,
    },
    {
      type: "toy_led",
      json: {
        message0: t("blocks.toyLed"),
        args0: [
          {
            type: "field_dropdown",
            name: "COLOR",
            options: [
              [t("led.red"), "red"],
              [t("led.green"), "green"],
              [t("led.blue"), "blue"],
              [t("led.yellow"), "yellow"],
              [t("led.off"), "off"],
            ],
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_TOY,
        tooltip: t("blocks.toyLedTip"),
      },
      generator: (block) => `toy.setLed('${block.getFieldValue("COLOR")}');\n`,
    },
    {
      type: "toy_buzzer",
      json: {
        message0: t("blocks.toyBuzz"),
        args0: [
          {
            type: "field_dropdown",
            name: "TONE",
            options: [
              [t("buzz.beep"), "beep"],
              [t("buzz.long"), "long"],
              [t("buzz.alert"), "alert"],
              [t("buzz.win"), "win"],
            ],
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_TOY,
        tooltip: t("blocks.toyBuzzTip"),
      },
      generator: (block) => `toy.buzz('${block.getFieldValue("TONE")}');\n`,
    },
    {
      type: "toy_read_sensor",
      json: {
        message0: t("blocks.toyRead"),
        args0: [
          {
            type: "field_dropdown",
            name: "SENSOR",
            options: [
              [t("toySensor.line"), "line"],
              [t("toySensor.distance"), "distance"],
              [t("toySensor.light"), "light"],
            ],
          },
        ],
        output: "Number",
        colour: COLOR_TOY,
        tooltip: t("blocks.toyReadTip"),
      },
      generator: (block) => `toy.readSensor('${block.getFieldValue("SENSOR")}')`,
    },
    {
      type: "toy_wait",
      json: {
        message0: t("blocks.toyWait"),
        args0: [{ type: "input_value", name: "SECONDS", check: "Number" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_TOY,
        tooltip: t("blocks.toyWaitTip"),
      },
      generator: (block, readValue) => `toy.wait(${readValue(block, "SECONDS", "1")});\n`,
    },
    {
      type: "toy_say",
      json: {
        message0: t("blocks.toySay"),
        args0: [{ type: "input_value", name: "TEXT", check: "String" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_TOY,
        tooltip: t("blocks.toySayTip"),
      },
      generator: (block, readValue) => `toy.say(${readValue(block, "TEXT", "''")});\n`,
    },
  ];
}

function buildIotBlocks(): BlockSpec[] {
  const channels = buildIotChannels();
  const commands = buildIotCommands();
  const scenes = buildIotScenes();
  return [
    {
      type: "iot_read_channel",
      json: {
        message0: t("blocks.iotRead"),
        args0: [{ type: "field_dropdown", name: "CHANNEL", options: channels }],
        output: "Number",
        colour: COLOR_IOT,
        tooltip: t("blocks.iotReadTip"),
      },
      generator: (block) => `iot.readChannel('${block.getFieldValue("CHANNEL")}')`,
    },
    {
      type: "iot_set_channel",
      json: {
        message0: t("blocks.iotSet"),
        args0: [
          { type: "field_dropdown", name: "CHANNEL", options: channels },
          { type: "input_value", name: "VALUE", check: "Number" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_IOT,
        tooltip: t("blocks.iotSetTip"),
      },
      generator: (block, readValue) =>
        `iot.setChannel('${block.getFieldValue("CHANNEL")}', ${readValue(block, "VALUE", "0")});\n`,
    },
    {
      type: "iot_command",
      json: {
        message0: t("blocks.iotCmd"),
        args0: [{ type: "field_dropdown", name: "COMMAND", options: commands }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_IOT,
        tooltip: t("blocks.iotCmdTip"),
      },
      generator: (block) => `iot.command('${block.getFieldValue("COMMAND")}');\n`,
    },
    {
      type: "iot_evaluate_scene",
      json: {
        message0: t("blocks.iotScene"),
        args0: [{ type: "field_dropdown", name: "SCENE", options: scenes }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_IOT,
        tooltip: t("blocks.iotSceneTip"),
      },
      generator: (block) => `iot.evaluateScene('${block.getFieldValue("SCENE")}');\n`,
    },
    {
      type: "iot_wait",
      json: {
        message0: t("blocks.iotWait"),
        args0: [{ type: "input_value", name: "SECONDS", check: "Number" }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR_IOT,
        tooltip: t("blocks.iotWaitTip"),
      },
      generator: (block, readValue) => `iot.wait(${readValue(block, "SECONDS", "1")});\n`,
    },
    {
      type: "iot_emergency_stop",
      json: {
        message0: t("blocks.iotStop"),
        previousStatement: null,
        nextStatement: null,
        colour: 0,
        tooltip: t("blocks.iotStopTip"),
      },
      generator: () => `iot.emergencyStop();\n`,
    },
  ];
}

function buildAllBlockSpecs(): BlockSpec[] {
  return [
    ...buildWebsiteBlocks(),
    ...buildMiniappBlocks(),
    ...buildSmarthomeBlocks(),
    ...buildIotBlocks(),
    ...buildToyBlocks(),
  ];
}

/** Custom blocks per create kind (exercise/free use shared categories only). Types only. */
export const KIND_BLOCK_SPECS: Record<Exclude<ArtifactKind, "exercise" | "free">, BlockSpec[]> = {
  web: buildWebsiteBlocks(),
  miniprogram: buildMiniappBlocks(),
  smarthome: buildSmarthomeBlocks(),
  iot: buildIotBlocks(),
  toy: buildToyBlocks(),
};

export const ALL_BLOCK_SPECS: BlockSpec[] = [
  ...KIND_BLOCK_SPECS.web,
  ...KIND_BLOCK_SPECS.miniprogram,
  ...KIND_BLOCK_SPECS.smarthome,
  ...KIND_BLOCK_SPECS.iot,
  ...KIND_BLOCK_SPECS.toy,
];

/** Re-define every custom block with current locale strings (safe to call on locale switch). */
export function registerTargetBlocks(): void {
  buildAllBlockSpecs().forEach((spec) => {
    delete Blockly.Blocks[spec.type];
    Blockly.common.defineBlocksWithJsonArray([{ type: spec.type, ...spec.json }]);
  });
}

export const DEFAULT_KIND_XML: Record<ArtifactKind, string> = {
  get web() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="web_set_title" x="30" y="30">
    <value name="TEXT"><block type="text"><field name="TEXT">${xmlText(t("starter.webTitle"))}</field></block></value>
    <next>
      <block type="web_add_heading">
        <value name="TEXT"><block type="text"><field name="TEXT">${xmlText(t("starter.webHeading"))}</field></block></value>
        <field name="LEVEL">h1</field>
        <next>
          <block type="web_add_text">
            <value name="TEXT"><block type="text"><field name="TEXT">${xmlText(t("starter.webBody"))}</field></block></value>
            <next>
              <block type="web_add_button">
                <value name="LABEL"><block type="text"><field name="TEXT">${xmlText(t("starter.webButton"))}</field></block></value>
                <value name="MESSAGE"><block type="text"><field name="TEXT">${xmlText(t("starter.webClick"))}</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;
  },
  get miniprogram() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="mp_create_page" x="30" y="30">
    <field name="PAGE">home</field>
    <value name="TITLE"><block type="text"><field name="TEXT">${xmlText(t("starter.mpTitle"))}</field></block></value>
    <next>
      <block type="mp_add_component">
        <field name="PAGE">home</field>
        <field name="KIND">card</field>
        <value name="CONTENT"><block type="text"><field name="TEXT">${xmlText(t("starter.mpCard"))}</field></block></value>
        <next>
          <block type="mp_set_data">
            <field name="KEY">count</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">3</field></block></value>
            <next>
              <block type="mp_bind_data">
                <field name="PAGE">home</field>
                <field name="KEY">count</field>
                <value name="LABEL"><block type="text"><field name="TEXT">${xmlText(t("starter.mpCountLabel"))}</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;
  },
  get smarthome() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="home_light_switch" x="30" y="30">
    <field name="ROOM">living</field>
    <field name="STATE">on</field>
    <next>
      <block type="home_light_brightness">
        <field name="ROOM">living</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">70</field></block></value>
        <next>
          <block type="home_set_temperature">
            <value name="VALUE"><block type="math_number"><field name="NUM">26</field></block></value>
            <next>
              <block type="home_run_scene">
                <field name="SCENE">home</field>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;
  },
  get toy() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="toy_led" x="30" y="30">
    <field name="COLOR">green</field>
    <next>
      <block type="toy_move">
        <field name="DIRECTION">forward</field>
        <value name="SPEED"><block type="math_number"><field name="NUM">60</field></block></value>
        <value name="SECONDS"><block type="math_number"><field name="NUM">2</field></block></value>
        <next>
          <block type="toy_servo">
            <field name="SERVO">arm</field>
            <value name="ANGLE"><block type="math_number"><field name="NUM">120</field></block></value>
            <next>
              <block type="toy_buzzer">
                <field name="TONE">win</field>
                <next>
                  <block type="toy_stop"></block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;
  },
  get iot() {
    return starterIotXml("smart-window");
  },
  get free() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="text_print" x="30" y="30">
    <value name="TEXT"><block type="text"><field name="TEXT">${xmlText(t("starter.freePrint"))}</field></block></value>
  </block>
</xml>`;
  },
  get exercise() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="text_print" x="30" y="30">
    <value name="TEXT"><block type="text"><field name="TEXT">Hello BlockyEdu</field></block></value>
  </block>
</xml>`;
  },
};

export const DEFAULT_KIND_CODE: Record<ArtifactKind, string> = {
  get web() {
    return `${t("starter.webCodeComment")}
web.setTitle(${JSON.stringify(t("starter.webTitle"))});
web.setTheme('#1677ff', '#f5f5f5');
web.addHeading(${JSON.stringify(t("starter.webHeading"))}, 'h1');
web.addText(${JSON.stringify(t("starter.webBody"))});
web.addButton(${JSON.stringify(t("starter.webButton"))}, ${JSON.stringify(t("starter.webClick"))});
`;
  },
  get miniprogram() {
    return `${t("starter.mpCodeComment")}
mp.createPage('home', ${JSON.stringify(t("starter.mpTitle"))});
mp.addComponent('home', 'card', ${JSON.stringify(t("starter.mpCard"))});
mp.setData('count', 3);
mp.bindData('home', 'count', ${JSON.stringify(t("starter.mpCountLabel"))});
mp.addNavButton(${JSON.stringify(t("starter.mpNav"))}, 'detail');
mp.createPage('detail', ${JSON.stringify(t("starter.mpDetailTitle"))});
mp.addComponent('detail', 'text', ${JSON.stringify(t("starter.mpDetailBody"))});
`;
  },
  get smarthome() {
    return `${t("starter.homeCodeComment")}
home.setLight('living', 'on');
home.setBrightness('living', 70);
home.setTemperature(26);

home.triggerSensor('motion', 1);
if (home.readSensor('motion') > 0) {
  home.setDevice('curtain', 'on');
  home.runScene('home');
}
`;
  },
  get iot() {
    return starterIotCode("smart-window");
  },
  get toy() {
    return `${t("starter.toyCodeComment")}
toy.setLed('green');
toy.move('forward', 60, 2);

if (toy.readSensor('distance') < 30) {
  toy.buzz('alert');
  toy.move('left', 50, 1);
}

toy.setServo('arm', 120);
toy.buzz('win');
toy.stop();
`;
  },
  get free() {
    return `${t("starter.freeCodeComment")}
console.log("Hello BlockyEdu");
`;
  },
  get exercise() {
    return `console.log("Hello BlockyEdu");
`;
  },
};
