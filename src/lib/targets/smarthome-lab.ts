/**
 * Smart-home teaching cases: starter code + Blockly XML + seed files (incl. floor.json).
 * Each case drives the isometric floor preview for classroom “wow” moments.
 */
import type { ArtifactFileEntry } from "../artifact-files";
import { t } from "../i18n";
import {
  DEFAULT_SMARTHOME_FLOOR,
  FLOOR_JSON_PATH,
  serializeFloorLayout,
} from "../smarthome-floor-layout";

export type SmarthomeLabTemplate =
  | "灯光场景"
  | "温控联动"
  | "安防演示"
  | "观影模式"
  | "人体感应"
  | "晚安模式";

export const SMARTHOME_LAB_TEMPLATES: readonly SmarthomeLabTemplate[] = [
  "灯光场景",
  "温控联动",
  "安防演示",
  "观影模式",
  "人体感应",
  "晚安模式",
] as const;

export function isSmarthomeLabTemplate(id: string | null | undefined): id is SmarthomeLabTemplate {
  return Boolean(id && (SMARTHOME_LAB_TEMPLATES as readonly string[]).includes(id));
}

function xmlWrap(inner: string): string {
  return `<xml xmlns="https://developers.google.com/blockly/xml">
  ${inner}
</xml>`;
}

function homeJson(): string {
  return `${JSON.stringify(
    {
      version: 1,
      name: "My Smart Home",
      rooms: [
        { id: "living", name: "living", type: "living" },
        { id: "bedroom", name: "bedroom", type: "bedroom" },
        { id: "kitchen", name: "kitchen", type: "kitchen" },
      ],
      devices: [
        {
          id: "light-living",
          type: "light",
          roomId: "living",
          capabilities: ["on_off", "brightness"],
        },
        {
          id: "ac-living",
          type: "ac",
          roomId: "living",
          capabilities: ["on_off", "temperature"],
        },
        {
          id: "curtain-bedroom",
          type: "curtain",
          roomId: "bedroom",
          capabilities: ["on_off"],
        },
        {
          id: "sensor-motion",
          type: "sensor",
          roomId: "living",
          capabilities: ["motion"],
        },
      ],
      scenes: [
        { id: "home", name: "home" },
        { id: "away", name: "away" },
        { id: "sleep", name: "sleep" },
        { id: "movie", name: "movie" },
      ],
      defaultSceneId: "home",
    },
    null,
    2,
  )}\n`;
}

/** Welcome home — lights + curtains pop on the floor stage. */
function codeWelcomeHome(): string {
  return `${t("starter.homeWelcomeComment")}
home.runScene('home');
home.setBrightness('living', 80);
home.setDevice('curtain', 'on');
home.setTemperature(26);
`;
}

function xmlWelcomeHome(): string {
  return xmlWrap(`<block type="home_run_scene" x="30" y="30">
    <field name="SCENE">home</field>
    <next>
      <block type="home_light_brightness">
        <field name="ROOM">living</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">80</field></block></value>
        <next>
          <block type="home_set_device">
            <field name="DEVICE">curtain</field>
            <field name="STATE">on</field>
            <next>
              <block type="home_set_temperature">
                <value name="VALUE"><block type="math_number"><field name="NUM">26</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>`);
}

/** Hot day — MQTT climate + fan spin on the floor. */
function codeClimate(): string {
  return `${t("starter.homeClimateComment")}
mqtt.publish('home/climate/temperature', '24');
mqtt.publish('home/device/fan', 'on');
mqtt.publish('home/living/light', 'on');
home.setBrightness('living', 55);
`;
}

function xmlClimate(): string {
  return xmlWrap(`<block type="mqtt_publish" x="30" y="30">
    <field name="TOPIC">home/climate/temperature</field>
    <value name="PAYLOAD"><block type="text"><field name="TEXT">24</field></block></value>
    <next>
      <block type="mqtt_publish">
        <field name="TOPIC">home/device/fan</field>
        <value name="PAYLOAD"><block type="text"><field name="TEXT">on</field></block></value>
        <next>
          <block type="mqtt_publish">
            <field name="TOPIC">home/living/light</field>
            <value name="PAYLOAD"><block type="text"><field name="TEXT">on</field></block></value>
            <next>
              <block type="home_light_brightness">
                <field name="ROOM">living</field>
                <value name="VALUE"><block type="math_number"><field name="NUM">55</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>`);
}

/** Away mode — alarm glow + lights off. */
function codeSecurity(): string {
  return `${t("starter.homeSecurityComment")}
mqtt.publish('home/scene', 'away');
mqtt.publish('home/device/alarm', 'on');
mqtt.publish('home/sensor/door', '1');
`;
}

function xmlSecurity(): string {
  return xmlWrap(`<block type="mqtt_publish" x="30" y="30">
    <field name="TOPIC">home/scene</field>
    <value name="PAYLOAD"><block type="text"><field name="TEXT">away</field></block></value>
    <next>
      <block type="mqtt_publish">
        <field name="TOPIC">home/device/alarm</field>
        <value name="PAYLOAD"><block type="text"><field name="TEXT">on</field></block></value>
        <next>
          <block type="mqtt_publish">
            <field name="TOPIC">home/sensor/door</field>
            <value name="PAYLOAD"><block type="text"><field name="TEXT">1</field></block></value>
          </block>
        </next>
      </block>
    </next>
  </block>`);
}

/** Movie night — dim the living room, close the curtains, start the projector. */
function codeMovie(): string {
  return `${t("starter.homeMovieComment")}
home.runScene('movie');
home.setBrightness('living', 18);
home.setLight('bedroom', 'off');
home.setLight('kitchen', 'off');
home.setDevice('curtain', 'off');
home.setDevice('fan', 'off');
home.wait(1);
home.setDevice('socket', 'on');
`;
}

function xmlMovie(): string {
  return xmlWrap(`<block type="home_run_scene" x="30" y="30">
    <field name="SCENE">movie</field>
    <next>
      <block type="home_light_brightness">
        <field name="ROOM">living</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">18</field></block></value>
        <next>
          <block type="home_light_switch">
            <field name="ROOM">bedroom</field>
            <field name="STATE">off</field>
            <next>
              <block type="home_light_switch">
                <field name="ROOM">kitchen</field>
                <field name="STATE">off</field>
                <next>
                  <block type="home_set_device">
                    <field name="DEVICE">curtain</field>
                    <field name="STATE">off</field>
                    <next>
                      <block type="home_set_device">
                        <field name="DEVICE">fan</field>
                        <field name="STATE">off</field>
                        <next>
                          <block type="home_wait">
                            <value name="SECONDS"><block type="math_number"><field name="NUM">1</field></block></value>
                            <next>
                              <block type="home_set_device">
                                <field name="DEVICE">socket</field>
                                <field name="STATE">on</field>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>`);
}

/** Motion → light via virtual MQTT — protocol lesson with floor glow. */
function codeMotion(): string {
  return `${t("starter.homeMotionComment")}
mqtt.subscribe('home/sensor/motion', function(payload) {
  if (Number(payload) > 0) {
    mqtt.publish('home/living/light', 'on');
    home.setBrightness('living', 90);
  }
});

mqtt.publish('home/sensor/motion', '1');
`;
}

function xmlMotion(): string {
  return xmlWrap(`<block type="mqtt_subscribe" x="30" y="20">
    <field name="TOPIC">home/sensor/motion</field>
    <statement name="DO">
      <block type="controls_if">
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">GT</field>
            <value name="A"><block type="mqtt_payload"></block></value>
            <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="mqtt_publish">
            <field name="TOPIC">home/living/light</field>
            <value name="PAYLOAD"><block type="text"><field name="TEXT">on</field></block></value>
            <next>
              <block type="home_light_brightness">
                <field name="ROOM">living</field>
                <value name="VALUE"><block type="math_number"><field name="NUM">90</field></block></value>
              </block>
            </next>
          </block>
        </statement>
      </block>
    </statement>
    <next>
      <block type="mqtt_publish">
        <field name="TOPIC">home/sensor/motion</field>
        <value name="PAYLOAD"><block type="text"><field name="TEXT">1</field></block></value>
      </block>
    </next>
  </block>`);
}

/** Good night — sleep scene sequence with waits. */
function codeSleep(): string {
  return `${t("starter.homeSleepComment")}
home.setBrightness('living', 40);
home.wait(1);
home.setBrightness('kitchen', 0);
home.setLight('kitchen', 'off');
home.wait(1);
home.runScene('sleep');
home.setDevice('curtain', 'off');
`;
}

function xmlSleep(): string {
  return xmlWrap(`<block type="home_light_brightness" x="30" y="30">
    <field name="ROOM">living</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">40</field></block></value>
    <next>
      <block type="home_wait">
        <value name="SECONDS"><block type="math_number"><field name="NUM">1</field></block></value>
        <next>
          <block type="home_light_switch">
            <field name="ROOM">kitchen</field>
            <field name="STATE">off</field>
            <next>
              <block type="home_wait">
                <value name="SECONDS"><block type="math_number"><field name="NUM">1</field></block></value>
                <next>
                  <block type="home_run_scene">
                    <field name="SCENE">sleep</field>
                    <next>
                      <block type="home_set_device">
                        <field name="DEVICE">curtain</field>
                        <field name="STATE">off</field>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>`);
}

export function starterSmarthomeCode(templateId: SmarthomeLabTemplate): string {
  switch (templateId) {
    case "温控联动":
      return codeClimate();
    case "安防演示":
      return codeSecurity();
    case "观影模式":
      return codeMovie();
    case "人体感应":
      return codeMotion();
    case "晚安模式":
      return codeSleep();
    default:
      return codeWelcomeHome();
  }
}

export function starterSmarthomeXml(templateId: SmarthomeLabTemplate): string {
  switch (templateId) {
    case "温控联动":
      return xmlClimate();
    case "安防演示":
      return xmlSecurity();
    case "观影模式":
      return xmlMovie();
    case "人体感应":
      return xmlMotion();
    case "晚安模式":
      return xmlSleep();
    default:
      return xmlWelcomeHome();
  }
}

export function smarthomeLabFiles(templateId: SmarthomeLabTemplate): ArtifactFileEntry[] {
  const code = starterSmarthomeCode(templateId);
  const xml = starterSmarthomeXml(templateId);
  return [
    { path: "home.json", contentType: "json", content: homeJson() },
    {
      path: FLOOR_JSON_PATH,
      contentType: "json",
      content: serializeFloorLayout(DEFAULT_SMARTHOME_FLOOR),
    },
    { path: "behavior.js", contentType: "text", content: code },
    { path: "blocks/smarthome.blocks.xml", contentType: "text", content: xml },
  ];
}
