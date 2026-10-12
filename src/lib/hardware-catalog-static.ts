/** Bundled board and module cards when the hardware catalog API is unavailable. */

export type BoardFamily = "esp32-s3" | "esp32-c3" | "nucleo";

export type StaticBoard = {
  sku: string;
  nameKey: string;
  family: BoardFamily;
};

export type StaticModule = {
  sku: string;
  nameKey: string;
  pins: readonly string[];
  color: string;
  bus: string;
  voltage: string;
};

export const STATIC_BOARDS: readonly StaticBoard[] = [
  {
    sku: "board.espressif.esp32-s3-devkitc-1",
    nameKey: "stage.board.esp32s3",
    family: "esp32-s3",
  },
  {
    sku: "board.espressif.esp32-c3-devkitm-1",
    nameKey: "stage.board.esp32c3",
    family: "esp32-c3",
  },
  {
    sku: "board.st.nucleo-f401re",
    nameKey: "stage.board.nucleo",
    family: "nucleo",
  },
];

export const STATIC_MODULES: readonly StaticModule[] = [
  {
    sku: "mod.relay-12v-iso",
    nameKey: "stage.module.relay12v",
    pins: ["IN GPIO4", "VCC 5V", "GND"],
    color: "#ef4444",
    bus: "GPIO",
    voltage: "5V",
  },
  {
    sku: "mod.limit-switch",
    nameKey: "stage.module.limit",
    pins: ["SIG GPIO5", "GND"],
    color: "#f59e0b",
    bus: "GPIO",
    voltage: "3V3",
  },
  {
    sku: "mod.rain-sensor",
    nameKey: "stage.module.rain",
    pins: ["AO GPIO6", "VCC 3V3", "GND"],
    color: "#06b6d4",
    bus: "ADC",
    voltage: "3V3",
  },
  {
    sku: "mod.soil-moisture",
    nameKey: "stage.module.soil",
    pins: ["AO GPIO7", "VCC 3V3", "GND"],
    color: "#22c55e",
    bus: "ADC",
    voltage: "3V3",
  },
  {
    sku: "mod.float-switch",
    nameKey: "stage.module.float",
    pins: ["SIG GPIO8", "GND"],
    color: "#3b82f6",
    bus: "GPIO",
    voltage: "3V3",
  },
  {
    sku: "mod.bme280",
    nameKey: "stage.module.bme280",
    pins: ["SDA GPIO8", "SCL GPIO9", "VCC 3V3", "GND"],
    color: "#14b8a6",
    bus: "I2C",
    voltage: "3V3",
  },
  {
    sku: "mod.motor-tb6612",
    nameKey: "stage.module.motor",
    pins: ["PWMA GPIO25", "AIN1 GPIO26", "AIN2 GPIO27", "GND"],
    color: "#8b5cf6",
    bus: "GPIO",
    voltage: "5V",
  },
  {
    sku: "mod.ssd1306",
    nameKey: "stage.module.oled",
    pins: ["SDA GPIO8", "SCL GPIO9", "VCC 3V3", "GND"],
    color: "#94a3b8",
    bus: "I2C",
    voltage: "3V3",
  },
  {
    sku: "mod.relay",
    nameKey: "stage.module.relay",
    pins: ["IN GPIO4", "VCC 5V", "GND"],
    color: "#f97316",
    bus: "GPIO",
    voltage: "5V",
  },
  {
    sku: "mod.led",
    nameKey: "stage.module.led",
    pins: ["A GPIO2", "GND"],
    color: "#facc15",
    bus: "GPIO",
    voltage: "3V3",
  },
  {
    sku: "mod.button",
    nameKey: "stage.module.button",
    pins: ["SIG GPIO0", "GND"],
    color: "#64748b",
    bus: "GPIO",
    voltage: "3V3",
  },
];

const MODULE_BY_SKU = new Map(STATIC_MODULES.map((mod) => [mod.sku, mod]));

export function boardFamily(sku: string | null | undefined): BoardFamily {
  if (!sku) return "esp32-s3";
  if (sku.includes("esp32-c3")) return "esp32-c3";
  if (sku.includes("nucleo") || sku.includes("board.st.")) return "nucleo";
  return "esp32-s3";
}

export function staticBoard(sku: string | null | undefined): StaticBoard {
  return STATIC_BOARDS.find((board) => board.sku === sku) ?? STATIC_BOARDS[0];
}

export function staticModule(sku: string): StaticModule | undefined {
  return MODULE_BY_SKU.get(sku);
}

export function modulesForSkus(skus: readonly string[]): StaticModule[] {
  const seen = new Set<string>();
  const out: StaticModule[] = [];
  for (const sku of skus) {
    if (seen.has(sku)) continue;
    seen.add(sku);
    const known = MODULE_BY_SKU.get(sku);
    out.push(
      known ?? {
        sku,
        nameKey: "",
        pins: [],
        color: "#64748b",
        bus: "GPIO",
        voltage: "3V3",
      },
    );
  }
  return out;
}

export type HardwareBinding = {
  boardSku: string | null;
  moduleSkus: string[];
  packSlug: string | null;
};

export function readHardwareFile(
  files: ReadonlyArray<{ path: string; content?: string }>,
): HardwareBinding {
  const empty: HardwareBinding = { boardSku: null, moduleSkus: [], packSlug: null };
  const entry = files.find(
    (file) => file.path === "hardware.json" || file.path.endsWith("/hardware.json"),
  );
  if (!entry?.content) return empty;
  try {
    const parsed = JSON.parse(entry.content) as {
      boardSku?: unknown;
      moduleSkus?: unknown;
      packSlug?: unknown;
    };
    const moduleSkus = Array.isArray(parsed.moduleSkus)
      ? parsed.moduleSkus.filter((sku): sku is string => typeof sku === "string" && sku.length > 0)
      : [];
    return {
      boardSku: typeof parsed.boardSku === "string" ? parsed.boardSku : null,
      moduleSkus,
      packSlug: typeof parsed.packSlug === "string" ? parsed.packSlug : null,
    };
  } catch {
    return empty;
  }
}
