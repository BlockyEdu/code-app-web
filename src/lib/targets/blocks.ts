/**
 * Kind-specific Blockly block definitions + JS generators.
 * Adapted from BlockyEdu Platform Specs `targets.ts` (website→web, miniapp→miniprogram).
 */
import * as Blockly from "blockly";
import type { ArtifactKind } from "../../types/artifact";

export interface BlockSpec {
  type: string;
  json: Record<string, unknown>;
  generator: (block: Blockly.Block, readValue: ValueReader) => string;
}

export type ValueReader = (block: Blockly.Block, name: string, fallback: string) => string;

const COLOR_WEB = 210;
const COLOR_MINIAPP = 120;
const COLOR_HOME = 180;
const COLOR_TOY = 30;

const WEBSITE_BLOCKS: BlockSpec[] = [
  {
    type: "web_set_title",
    json: {
      message0: "设置页面标题 %1",
      args0: [{ type: "input_value", name: "TEXT", check: "String" }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_WEB,
      tooltip: "设置预览页面顶部的标题文字",
    },
    generator: (block, readValue) => `web.setTitle(${readValue(block, "TEXT", "''")});\n`,
  },
  {
    type: "web_add_heading",
    json: {
      message0: "添加标题文字 %1 级别 %2",
      args0: [
        { type: "input_value", name: "TEXT", check: "String" },
        {
          type: "field_dropdown",
          name: "LEVEL",
          options: [
            ["大", "h1"],
            ["中", "h2"],
            ["小", "h3"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_WEB,
      tooltip: "在页面中添加一个标题",
    },
    generator: (block, readValue) =>
      `web.addHeading(${readValue(block, "TEXT", "''")}, '${block.getFieldValue("LEVEL")}');\n`,
  },
  {
    type: "web_add_text",
    json: {
      message0: "添加段落文字 %1",
      args0: [{ type: "input_value", name: "TEXT", check: "String" }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_WEB,
      tooltip: "在页面中添加一段说明文字",
    },
    generator: (block, readValue) => `web.addText(${readValue(block, "TEXT", "''")});\n`,
  },
  {
    type: "web_add_card",
    json: {
      message0: "添加卡片 标题 %1 内容 %2",
      args0: [
        { type: "input_value", name: "TITLE", check: "String" },
        { type: "input_value", name: "BODY", check: "String" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_WEB,
      tooltip: "添加一个带标题与正文的卡片",
    },
    generator: (block, readValue) =>
      `web.addCard(${readValue(block, "TITLE", "''")}, ${readValue(block, "BODY", "''")});\n`,
  },
  {
    type: "web_add_button",
    json: {
      message0: "添加按钮 %1 点击后提示 %2",
      args0: [
        { type: "input_value", name: "LABEL", check: "String" },
        { type: "input_value", name: "MESSAGE", check: "String" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_WEB,
      tooltip: "添加一个可点击按钮，点击后在页面显示提示",
    },
    generator: (block, readValue) =>
      `web.addButton(${readValue(block, "LABEL", "'按钮'")}, ${readValue(block, "MESSAGE", "''")});\n`,
  },
  {
    type: "web_set_theme",
    json: {
      message0: "设置页面主题色 %1 背景 %2",
      args0: [
        {
          type: "field_dropdown",
          name: "PRIMARY",
          options: [
            ["蓝色", "#1677ff"],
            ["绿色", "#52c41a"],
            ["橙色", "#fa8c16"],
            ["紫色", "#722ed1"],
          ],
        },
        {
          type: "field_dropdown",
          name: "BG",
          options: [
            ["浅灰", "#f5f5f5"],
            ["白色", "#ffffff"],
            ["浅蓝", "#e6f4ff"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_WEB,
      tooltip: "设置页面配色",
    },
    generator: (block) =>
      `web.setTheme('${block.getFieldValue("PRIMARY")}', '${block.getFieldValue("BG")}');\n`,
  },
  {
    type: "web_add_image_box",
    json: {
      message0: "添加图片占位块 说明 %1",
      args0: [{ type: "input_value", name: "CAPTION", check: "String" }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_WEB,
      tooltip: "添加一个图片占位区域，用于排版练习",
    },
    generator: (block, readValue) => `web.addImageBox(${readValue(block, "CAPTION", "''")});\n`,
  },
];

const MINIAPP_BLOCKS: BlockSpec[] = [
  {
    type: "mp_create_page",
    json: {
      message0: "创建页面 %1 标题 %2",
      args0: [
        { type: "field_input", name: "PAGE", text: "home" },
        { type: "input_value", name: "TITLE", check: "String" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_MINIAPP,
      tooltip: "创建一个小程序页面",
    },
    generator: (block, readValue) =>
      `mp.createPage('${block.getFieldValue("PAGE")}', ${readValue(block, "TITLE", "''")});\n`,
  },
  {
    type: "mp_add_component",
    json: {
      message0: "在页面 %1 添加组件 %2 内容 %3",
      args0: [
        { type: "field_input", name: "PAGE", text: "home" },
        {
          type: "field_dropdown",
          name: "KIND",
          options: [
            ["文本", "text"],
            ["卡片", "card"],
            ["列表项", "list"],
            ["输入框", "input"],
          ],
        },
        { type: "input_value", name: "CONTENT", check: "String" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_MINIAPP,
      tooltip: "向指定页面添加一个组件",
    },
    generator: (block, readValue) =>
      `mp.addComponent('${block.getFieldValue("PAGE")}', '${block.getFieldValue("KIND")}', ${readValue(block, "CONTENT", "''")});\n`,
  },
  {
    type: "mp_set_data",
    json: {
      message0: "设置数据 %1 为 %2",
      args0: [
        { type: "field_input", name: "KEY", text: "count" },
        { type: "input_value", name: "VALUE" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_MINIAPP,
      tooltip: "设置页面数据，可被数据绑定组件读取",
    },
    generator: (block, readValue) =>
      `mp.setData('${block.getFieldValue("KEY")}', ${readValue(block, "VALUE", "''")});\n`,
  },
  {
    type: "mp_bind_data",
    json: {
      message0: "在页面 %1 绑定显示数据 %2 前缀 %3",
      args0: [
        { type: "field_input", name: "PAGE", text: "home" },
        { type: "field_input", name: "KEY", text: "count" },
        { type: "input_value", name: "LABEL", check: "String" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_MINIAPP,
      tooltip: "把数据绑定到页面上显示",
    },
    generator: (block, readValue) =>
      `mp.bindData('${block.getFieldValue("PAGE")}', '${block.getFieldValue("KEY")}', ${readValue(block, "LABEL", "''")});\n`,
  },
  {
    type: "mp_add_tab_button",
    json: {
      message0: "添加跳转按钮 %1 跳到页面 %2",
      args0: [
        { type: "input_value", name: "LABEL", check: "String" },
        { type: "field_input", name: "PAGE", text: "detail" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_MINIAPP,
      tooltip: "添加一个可点击的页面跳转按钮",
    },
    generator: (block, readValue) =>
      `mp.addNavButton(${readValue(block, "LABEL", "'去详情'")}, '${block.getFieldValue("PAGE")}');\n`,
  },
  {
    type: "mp_navigate",
    json: {
      message0: "跳转到页面 %1",
      args0: [{ type: "field_input", name: "PAGE", text: "home" }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_MINIAPP,
      tooltip: "立即切换到指定页面",
    },
    generator: (block) => `mp.navigate('${block.getFieldValue("PAGE")}');\n`,
  },
  {
    type: "mp_show_toast",
    json: {
      message0: "显示提示 %1",
      args0: [{ type: "input_value", name: "TEXT", check: "String" }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_MINIAPP,
      tooltip: "在小程序中弹出一条提示",
    },
    generator: (block, readValue) => `mp.showToast(${readValue(block, "TEXT", "''")});\n`,
  },
];

const SMARTHOME_BLOCKS: BlockSpec[] = [
  {
    type: "home_light_switch",
    json: {
      message0: "把 %1 的灯 %2",
      args0: [
        {
          type: "field_dropdown",
          name: "ROOM",
          options: [
            ["客厅", "living"],
            ["卧室", "bedroom"],
            ["厨房", "kitchen"],
          ],
        },
        {
          type: "field_dropdown",
          name: "STATE",
          options: [
            ["打开", "on"],
            ["关闭", "off"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_HOME,
      tooltip: "控制某个房间灯光的开关",
    },
    generator: (block) =>
      `home.setLight('${block.getFieldValue("ROOM")}', '${block.getFieldValue("STATE")}');\n`,
  },
  {
    type: "home_light_brightness",
    json: {
      message0: "设置 %1 灯光亮度为 %2 %%",
      args0: [
        {
          type: "field_dropdown",
          name: "ROOM",
          options: [
            ["客厅", "living"],
            ["卧室", "bedroom"],
            ["厨房", "kitchen"],
          ],
        },
        { type: "input_value", name: "VALUE", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_HOME,
      tooltip: "调节灯光亮度（0-100）",
    },
    generator: (block, readValue) =>
      `home.setBrightness('${block.getFieldValue("ROOM")}', ${readValue(block, "VALUE", "80")});\n`,
  },
  {
    type: "home_set_temperature",
    json: {
      message0: "设置空调温度为 %1 ℃",
      args0: [{ type: "input_value", name: "VALUE", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_HOME,
      tooltip: "设置温控目标温度",
    },
    generator: (block, readValue) => `home.setTemperature(${readValue(block, "VALUE", "26")});\n`,
  },
  {
    type: "home_read_sensor",
    json: {
      message0: "读取传感器 %1",
      args0: [
        {
          type: "field_dropdown",
          name: "SENSOR",
          options: [
            ["温度", "temperature"],
            ["湿度", "humidity"],
            ["光照", "light"],
            ["人体感应", "motion"],
            ["烟雾浓度", "smoke"],
            ["门磁状态", "door"],
          ],
        },
      ],
      output: "Number",
      colour: COLOR_HOME,
      tooltip: "读取传感器当前数值",
    },
    generator: (block) => `home.readSensor('${block.getFieldValue("SENSOR")}')`,
  },
  {
    type: "home_trigger_sensor",
    json: {
      message0: "模拟传感器 %1 数值变为 %2",
      args0: [
        {
          type: "field_dropdown",
          name: "SENSOR",
          options: [
            ["温度", "temperature"],
            ["湿度", "humidity"],
            ["光照", "light"],
            ["人体感应", "motion"],
            ["烟雾浓度", "smoke"],
            ["门磁状态", "door"],
          ],
        },
        { type: "input_value", name: "VALUE", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_HOME,
      tooltip: "在仿真环境中改变传感器读数，用于测试条件触发",
    },
    generator: (block, readValue) =>
      `home.triggerSensor('${block.getFieldValue("SENSOR")}', ${readValue(block, "VALUE", "0")});\n`,
  },
  {
    type: "home_run_scene",
    json: {
      message0: "执行场景 %1",
      args0: [
        {
          type: "field_dropdown",
          name: "SCENE",
          options: [
            ["回家模式", "home"],
            ["离家模式", "away"],
            ["睡眠模式", "sleep"],
            ["观影模式", "movie"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_HOME,
      tooltip: "一键执行预设场景联动",
    },
    generator: (block) => `home.runScene('${block.getFieldValue("SCENE")}');\n`,
  },
  {
    type: "home_set_device",
    json: {
      message0: "把设备 %1 %2",
      args0: [
        {
          type: "field_dropdown",
          name: "DEVICE",
          options: [
            ["窗帘", "curtain"],
            ["插座", "socket"],
            ["风扇", "fan"],
            ["安防警报", "alarm"],
          ],
        },
        {
          type: "field_dropdown",
          name: "STATE",
          options: [
            ["打开", "on"],
            ["关闭", "off"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_HOME,
      tooltip: "控制其他智能设备的开关",
    },
    generator: (block) =>
      `home.setDevice('${block.getFieldValue("DEVICE")}', '${block.getFieldValue("STATE")}');\n`,
  },
  {
    type: "home_wait",
    json: {
      message0: "等待 %1 秒",
      args0: [{ type: "input_value", name: "SECONDS", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_HOME,
      tooltip: "等待一段时间后继续执行",
    },
    generator: (block, readValue) => `home.wait(${readValue(block, "SECONDS", "1")});\n`,
  },
];

const TOY_BLOCKS: BlockSpec[] = [
  {
    type: "toy_move",
    json: {
      message0: "小车 %1 速度 %2 持续 %3 秒",
      args0: [
        {
          type: "field_dropdown",
          name: "DIRECTION",
          options: [
            ["前进", "forward"],
            ["后退", "backward"],
            ["左转", "left"],
            ["右转", "right"],
          ],
        },
        { type: "input_value", name: "SPEED", check: "Number" },
        { type: "input_value", name: "SECONDS", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_TOY,
      tooltip: "控制电机让小车移动",
    },
    generator: (block, readValue) =>
      `toy.move('${block.getFieldValue("DIRECTION")}', ${readValue(block, "SPEED", "60")}, ${readValue(block, "SECONDS", "1")});\n`,
  },
  {
    type: "toy_stop",
    json: {
      message0: "小车停止",
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_TOY,
      tooltip: "停止所有电机",
    },
    generator: () => "toy.stop();\n",
  },
  {
    type: "toy_servo",
    json: {
      message0: "舵机 %1 转到 %2 度",
      args0: [
        {
          type: "field_dropdown",
          name: "SERVO",
          options: [
            ["头部", "head"],
            ["手臂", "arm"],
            ["夹爪", "claw"],
          ],
        },
        { type: "input_value", name: "ANGLE", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_TOY,
      tooltip: "把舵机旋转到指定角度（0-180）",
    },
    generator: (block, readValue) =>
      `toy.setServo('${block.getFieldValue("SERVO")}', ${readValue(block, "ANGLE", "90")});\n`,
  },
  {
    type: "toy_led",
    json: {
      message0: "把 LED 设为 %1",
      args0: [
        {
          type: "field_dropdown",
          name: "COLOR",
          options: [
            ["红色", "red"],
            ["绿色", "green"],
            ["蓝色", "blue"],
            ["黄色", "yellow"],
            ["熄灭", "off"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_TOY,
      tooltip: "控制彩色 LED 灯",
    },
    generator: (block) => `toy.setLed('${block.getFieldValue("COLOR")}');\n`,
  },
  {
    type: "toy_buzzer",
    json: {
      message0: "蜂鸣器播放 %1",
      args0: [
        {
          type: "field_dropdown",
          name: "TONE",
          options: [
            ["短音", "beep"],
            ["长音", "long"],
            ["提示音", "alert"],
            ["胜利音", "win"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_TOY,
      tooltip: "让蜂鸣器发出声音",
    },
    generator: (block) => `toy.buzz('${block.getFieldValue("TONE")}');\n`,
  },
  {
    type: "toy_read_sensor",
    json: {
      message0: "读取 %1 传感器",
      args0: [
        {
          type: "field_dropdown",
          name: "SENSOR",
          options: [
            ["循线", "line"],
            ["避障距离", "distance"],
            ["光线", "light"],
          ],
        },
      ],
      output: "Number",
      colour: COLOR_TOY,
      tooltip: "读取小车传感器数值",
    },
    generator: (block) => `toy.readSensor('${block.getFieldValue("SENSOR")}')`,
  },
  {
    type: "toy_wait",
    json: {
      message0: "等待 %1 秒",
      args0: [{ type: "input_value", name: "SECONDS", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_TOY,
      tooltip: "等待一段时间后继续动作",
    },
    generator: (block, readValue) => `toy.wait(${readValue(block, "SECONDS", "1")});\n`,
  },
  {
    type: "toy_say",
    json: {
      message0: "玩具说 %1",
      args0: [{ type: "input_value", name: "TEXT", check: "String" }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOR_TOY,
      tooltip: "在仿真视图上显示一句台词",
    },
    generator: (block, readValue) => `toy.say(${readValue(block, "TEXT", "''")});\n`,
  },
];

/** Custom blocks per create kind (exercise/free use shared categories only). */
export const KIND_BLOCK_SPECS: Record<Exclude<ArtifactKind, "exercise" | "free">, BlockSpec[]> = {
  web: WEBSITE_BLOCKS,
  miniprogram: MINIAPP_BLOCKS,
  smarthome: SMARTHOME_BLOCKS,
  iot: SMARTHOME_BLOCKS,
  toy: TOY_BLOCKS,
};

export const ALL_BLOCK_SPECS: BlockSpec[] = [
  ...WEBSITE_BLOCKS,
  ...MINIAPP_BLOCKS,
  ...SMARTHOME_BLOCKS,
  ...TOY_BLOCKS,
];

/** Register every custom block definition exactly once. */
export function registerTargetBlocks(): void {
  ALL_BLOCK_SPECS.forEach((spec) => {
    if (Blockly.Blocks[spec.type]) return;
    Blockly.common.defineBlocksWithJsonArray([{ type: spec.type, ...spec.json }]);
  });
}

export const DEFAULT_KIND_XML: Record<ArtifactKind, string> = {
  web: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="web_set_title" x="30" y="30">
    <value name="TEXT"><block type="text"><field name="TEXT">我的第一个网站</field></block></value>
    <next>
      <block type="web_add_heading">
        <value name="TEXT"><block type="text"><field name="TEXT">欢迎来到我的网站</field></block></value>
        <field name="LEVEL">h1</field>
        <next>
          <block type="web_add_text">
            <value name="TEXT"><block type="text"><field name="TEXT">这是用积木搭出来的页面。</field></block></value>
            <next>
              <block type="web_add_button">
                <value name="LABEL"><block type="text"><field name="TEXT">点我试试</field></block></value>
                <value name="MESSAGE"><block type="text"><field name="TEXT">你点到按钮啦！</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  miniprogram: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="mp_create_page" x="30" y="30">
    <field name="PAGE">home</field>
    <value name="TITLE"><block type="text"><field name="TEXT">我的小程序</field></block></value>
    <next>
      <block type="mp_add_component">
        <field name="PAGE">home</field>
        <field name="KIND">card</field>
        <value name="CONTENT"><block type="text"><field name="TEXT">今天要学会数据绑定</field></block></value>
        <next>
          <block type="mp_set_data">
            <field name="KEY">count</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">3</field></block></value>
            <next>
              <block type="mp_bind_data">
                <field name="PAGE">home</field>
                <field name="KEY">count</field>
                <value name="LABEL"><block type="text"><field name="TEXT">当前数量：</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  smarthome: `<xml xmlns="https://developers.google.com/blockly/xml">
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
</xml>`,
  toy: `<xml xmlns="https://developers.google.com/blockly/xml">
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
</xml>`,
  iot: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="home_light_switch" x="30" y="30">
    <field name="ROOM">living</field>
    <field name="STATE">on</field>
    <next>
      <block type="home_read_sensor">
        <field name="SENSOR">temperature</field>
        <next>
          <block type="home_run_scene">
            <field name="SCENE">home</field>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  free: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="text_print" x="30" y="30">
    <value name="TEXT"><block type="text"><field name="TEXT">自由编程</field></block></value>
  </block>
</xml>`,
  exercise: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="text_print" x="30" y="30">
    <value name="TEXT"><block type="text"><field name="TEXT">Hello BlockyEdu</field></block></value>
  </block>
</xml>`,
};

export const DEFAULT_KIND_CODE: Record<ArtifactKind, string> = {
  web: `// 网站创作示例：用 web.* 指令搭建页面
web.setTitle('我的第一个网站');
web.setTheme('#1677ff', '#f5f5f5');
web.addHeading('欢迎来到我的网站', 'h1');
web.addText('这是用积木或代码搭出来的页面。');
web.addButton('点我试试', '你点到按钮啦！');
`,
  miniprogram: `// 小程序示例：页面 + 组件 + 数据绑定
mp.createPage('home', '我的小程序');
mp.addComponent('home', 'card', '今天要学会数据绑定');
mp.setData('count', 3);
mp.bindData('home', 'count', '当前数量：');
mp.addNavButton('去详情', 'detail');
mp.createPage('detail', '详情页');
mp.addComponent('detail', 'text', '这里是详情页内容');
`,
  smarthome: `// 智能家居示例：灯光 + 温控 + 场景联动
home.setLight('living', 'on');
home.setBrightness('living', 70);
home.setTemperature(26);

home.triggerSensor('motion', 1);
if (home.readSensor('motion') > 0) {
  home.setDevice('curtain', 'on');
  home.runScene('home');
}
`,
  iot: `// 物联网示例：传感器采集 + 设备联动（复用家居仿真 API）
home.setLight('living', 'on');
home.setBrightness('living', 70);
const temp = home.readSensor('temperature');
if (temp > 28) {
  home.setTemperature(26);
  home.runScene('home');
}
`,
  toy: `// 智能玩具示例：动作序列 + 传感器
toy.setLed('green');
toy.move('forward', 60, 2);

if (toy.readSensor('distance') < 30) {
  toy.buzz('alert');
  toy.move('left', 50, 1);
}

toy.setServo('arm', 120);
toy.buzz('win');
toy.stop();
`,
  free: `// 自由编程 — 从这里开始
console.log("Hello BlockyEdu");
`,
  exercise: `console.log("Hello BlockyEdu");
`,
};
