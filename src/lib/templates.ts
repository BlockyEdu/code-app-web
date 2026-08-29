import type { ArtifactKind } from "../types/artifact";
import type { ArtifactFileEntry } from "./artifact-files";

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
  温湿度监测: [],
  设备联动: [],
  落地页: [],
  作品集: [],
  博客: [],
  管理后台: [],
};

export const HERO_TEMPLATE_BOARD: Record<string, string> = {
  "HP-01 Air Beacon": "board.espressif.esp32-s3-devkitc-1",
  "HP-02 Desk Rover": "board.st.nucleo-f401re",
  "HP-03 Room Node": "board.espressif.esp32-s3-devkitc-1",
  温湿度监测: "board.espressif.esp32-s3-devkitc-1",
};

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
