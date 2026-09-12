import { t } from "../lib/i18n";
import { runPythonWithPyodide } from "../lib/preview/pyodide-runner";
import { compileTypeScriptToJs } from "../lib/preview/typescript-compiler";
import { BUILTIN_PLUGINS } from "./builtins";
import { runJavascript } from "./runners";
import type { LanguagePlugin, LanguageRunResult } from "./types";

const registry = new Map<string, LanguagePlugin>();

for (const p of BUILTIN_PLUGINS) {
  registry.set(p.id, p);
}

/** 注册扩展语言插件（npm 包或动态加载时调用） */
export function registerLanguagePlugin(plugin: LanguagePlugin): void {
  registry.set(plugin.id, plugin);
}

export function getLanguagePlugin(id: string): LanguagePlugin | undefined {
  return registry.get(id);
}

export function listCoreLanguages(): LanguagePlugin[] {
  return [...registry.values()].filter((p) => p.tier === "core");
}

export function listExtensionLanguages(): LanguagePlugin[] {
  return [...registry.values()].filter((p) => p.tier === "extension");
}

export function listAllLanguages(): LanguagePlugin[] {
  return [...registry.values()];
}

export function getDefaultLanguageId(): string {
  try {
    return localStorage.getItem("blockyedu_language") ?? "javascript";
  } catch {
    return "javascript";
  }
}

export function runLanguageCode(languageId: string, code: string): LanguageRunResult {
  return runLanguageCodePreviewSync(languageId, code);
}

/** 同步预览（仅 JS）；异步请用 runLanguageCodePreview */
function runLanguageCodePreviewSync(languageId: string, code: string): LanguageRunResult {
  const plugin = getLanguagePlugin(languageId);
  if (!plugin) {
    return { logs: [], error: t("plugin.unknownLang", { id: languageId }) };
  }

  if (plugin.run === "plugin") {
    return {
      logs: [plugin.runHint ?? t("plugin.install", { pkg: plugin.pluginPackage })],
    };
  }

  if (plugin.run === "server") {
    return { logs: [t("plugin.needPro")] };
  }

  if (plugin.run === "none") {
    return { logs: [t("plugin.editOnly")] };
  }

  switch (languageId) {
    case "javascript":
      return { logs: runJavascript(code) };
    default:
      return { logs: [`[info] ${t("run.useConsoleButton")}`] };
  }
}

/** 浏览器预览：JS / TS (typescript.js) / Python (Pyodide) */
export async function runLanguageCodePreview(
  languageId: string,
  code: string,
): Promise<LanguageRunResult> {
  const plugin = getLanguagePlugin(languageId);
  if (!plugin) {
    return { logs: [], error: t("plugin.unknownLang", { id: languageId }) };
  }

  if (plugin.run === "plugin") {
    return {
      logs: [
        plugin.runHint ?? t("plugin.install", { pkg: plugin.pluginPackage }),
        t("plugin.proSandbox"),
      ],
    };
  }

  if (plugin.run === "none") {
    return { logs: [t("plugin.editOnly")] };
  }

  try {
    switch (languageId) {
      case "javascript":
        return { logs: runJavascript(code) };
      case "typescript": {
        const js = await compileTypeScriptToJs(code);
        return { logs: runJavascript(js) };
      }
      case "python":
        return { logs: await runPythonWithPyodide(code) };
      default:
        return runLanguageCodePreviewSync(languageId, code);
    }
  } catch (err) {
    return {
      logs: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export type { LanguagePlugin, LanguageRunResult, LanguageTier, RunCapability } from "./types";
