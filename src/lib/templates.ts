import type { ArtifactKind } from "../types/artifact";
import { defaultSchemaForTemplate } from "./app-studio/app-schema";
import type { ArtifactFileEntry } from "./artifact-files";
import { t } from "./i18n";
import { type IotPackSlug, isIotLabPack, starterIotCode, starterIotXml } from "./targets/iot-lab";

const HP01_FIRMWARE = `// HP-01 Air Beacon — ESP32-S3 Arduino stub
void setup() {
  Serial.begin(115200);
  Serial.println("Air Beacon boot");
}

void loop() {
  Serial.println("BME280 mock T=24.1 H=48");
  delay(2000);
}
`;

const HP02_FIRMWARE = `// HP-02 Desk Rover — STM32Cube stub (NUCLEO-F401RE)
#include <stdio.h>
int main(void) {
  printf("Desk Rover boot\\n");
  for (;;) {
    printf("motor A=0 B=0 heading=0\\n");
  }
}
`;

const HP03_FIRMWARE = `// HP-03 Room Node — ESP-IDF stub
void app_main(void) {
  printf("Room Node boot\\n");
}
`;

function hardwareJson(
  boardSku: string,
  modules: string[],
  toolchain: string,
  hero: string,
): ArtifactFileEntry {
  return {
    path: "hardware.json",
    contentType: "application/json",
    content: `${JSON.stringify({ boardSku, moduleSkus: modules, toolchain, heroProject: hero }, null, 2)}\n`,
  };
}

function firmware(content: string): ArtifactFileEntry {
  return { path: "firmware/main.cpp", contentType: "text", content };
}

function iotLabFiles(
  packSlug: IotPackSlug,
  boardSku: string,
  modules: string[],
): ArtifactFileEntry[] {
  return [
    {
      path: "hardware.json",
      contentType: "application/json",
      content: `${JSON.stringify(
        {
          packSlug,
          boardSku,
          moduleSkus: modules,
          toolchain: "arduino-esp32",
          runMode: "sim",
        },
        null,
        2,
      )}\n`,
    },
    {
      path: "behavior.js",
      contentType: "text/javascript",
      content: starterIotCode(packSlug),
    },
    {
      path: "blocks/iot.blocks.xml",
      contentType: "text",
      content: starterIotXml(packSlug),
    },
    {
      path: "wiring.json",
      contentType: "application/json",
      content: `${JSON.stringify(
        {
          boardSku,
          kitHint: packSlug,
          notes: t("studioFiles.wiringNotes"),
        },
        null,
        2,
      )}\n`,
    },
    firmware(
      `// ${packSlug} — ESP32 Arduino stub (export only until a lab session exists)\n#include "kit_config.h"\n`,
    ),
  ];
}

function studioTemplateFiles(templateId: string): ArtifactFileEntry[] {
  const schema = defaultSchemaForTemplate(templateId);
  const landingCss =
    templateId === "落地页"
      ? `${t("studioFiles.cssLanding")}
.hero h1 { font-size: 40px; letter-spacing: -0.03em; }
.hero { padding: 48px 0 32px; }
`
      : `${t("studioFiles.cssTheme")}
.hero h1 {
  letter-spacing: -0.02em;
}
`;
  return [
    {
      path: "app.schema.json",
      contentType: "application/json",
      content: `${JSON.stringify(schema, null, 2)}\n`,
    },
    {
      path: "styles.css",
      contentType: "text/css",
      content: landingCss,
    },
    {
      path: "extensions.js",
      contentType: "text/javascript",
      content: `${t("studioFiles.extJs")}\nfunction onReady() {}\n`,
    },
  ];
}

/** Template id → extra starter files written on create. */
export const TEMPLATE_FILES: Record<string, ArtifactFileEntry[]> = {
  空白项目: [],
  脚本草稿: [
    {
      path: "README.md",
      contentType: "text",
      content: "# Scratch pad\n\nWrite a small program, then ask AI to review it.\n",
    },
  ],
  "Hello World": [],
  排序算法: [
    {
      path: "main.js",
      contentType: "text",
      content: `function sortNumbers(nums) {
  return [...nums].sort((a, b) => a - b);
}
console.log(sortNumbers([3, 1, 2]));
`,
    },
  ],
  "HP-01 Air Beacon": [
    hardwareJson(
      "board.espressif.esp32-s3-devkitc-1",
      ["mod.bme280", "mod.ssd1306"],
      "arduino-esp32",
      "HP-01",
    ),
    firmware(HP01_FIRMWARE),
  ],
  "HP-02 Desk Rover": [
    hardwareJson(
      "board.st.nucleo-f401re",
      ["mod.motor-tb6612", "mod.ssd1306"],
      "stm32cube",
      "HP-02",
    ),
    firmware(HP02_FIRMWARE),
  ],
  "HP-03 Room Node": [
    hardwareJson(
      "board.espressif.esp32-s3-devkitc-1",
      ["mod.bme280", "mod.relay"],
      "esp-idf",
      "HP-03",
    ),
    firmware(HP03_FIRMWARE),
  ],
  get 智慧窗控() {
    return iotLabFiles("smart-window", "board.espressif.esp32-s3-devkitc-1", [
      "mod.relay-12v-iso",
      "mod.limit-switch",
      "mod.rain-sensor",
    ]);
  },
  get 智慧灌溉() {
    return iotLabFiles("agri-irrigation", "board.espressif.esp32-c3-devkitm-1", [
      "mod.relay-12v-iso",
      "mod.soil-moisture",
    ]);
  },
  get 鱼塘增氧() {
    return iotLabFiles("agri-pond", "board.espressif.esp32-s3-devkitc-1", [
      "mod.relay-12v-iso",
      "mod.float-switch",
    ]);
  },
  温湿度监测: [],
  设备联动: [],
  get 落地页() {
    return studioTemplateFiles("落地页");
  },
  get 作品集() {
    return studioTemplateFiles("作品集");
  },
  get 博客() {
    return studioTemplateFiles("博客");
  },
  get 资讯小程序() {
    return studioTemplateFiles("资讯小程序");
  },
  管理后台: [],
};

export const HERO_TEMPLATE_BOARD: Record<string, string> = {
  "HP-01 Air Beacon": "board.espressif.esp32-s3-devkitc-1",
  "HP-02 Desk Rover": "board.st.nucleo-f401re",
  "HP-03 Room Node": "board.espressif.esp32-s3-devkitc-1",
  温湿度监测: "board.espressif.esp32-s3-devkitc-1",
  智慧窗控: "board.espressif.esp32-s3-devkitc-1",
  智慧灌溉: "board.espressif.esp32-c3-devkitm-1",
  鱼塘增氧: "board.espressif.esp32-s3-devkitc-1",
};

export function parsePackSlugFromFiles(files: ArtifactFileEntry[]): IotPackSlug | null {
  const entry = files.find((f) => f.path === "hardware.json" || f.path.endsWith("/hardware.json"));
  if (!entry?.content) return null;
  try {
    const parsed = JSON.parse(entry.content) as { packSlug?: string };
    return isIotLabPack(parsed.packSlug) ? parsed.packSlug : null;
  } catch {
    return null;
  }
}

export {
  type IotPackSlug,
  isIotLabPack,
  packSlugFromTemplate,
} from "./targets/iot-lab";

export function extraFilesForTemplate(
  _kind: ArtifactKind,
  templateId: string | null | undefined,
): ArtifactFileEntry[] {
  if (!templateId) return [];
  if (templateId === "温湿度监测") return TEMPLATE_FILES["HP-01 Air Beacon"];
  if (templateId === "设备联动") return TEMPLATE_FILES["HP-03 Room Node"];
  return TEMPLATE_FILES[templateId] ?? [];
}

export function boardSkuForTemplate(templateId: string | null | undefined): string | undefined {
  if (!templateId) return undefined;
  if (templateId === "温湿度监测") return HERO_TEMPLATE_BOARD["HP-01 Air Beacon"];
  if (templateId === "设备联动") return HERO_TEMPLATE_BOARD["HP-03 Room Node"];
  return HERO_TEMPLATE_BOARD[templateId];
}
