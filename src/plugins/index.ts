import { runJavascript } from './runners';
import type { LanguagePlugin, LanguageRunResult } from './types';
import { BUILTIN_PLUGINS } from './builtins';
import { compileTypeScriptToJs } from '../lib/preview/typescript-compiler';
import { runPythonWithPyodide } from '../lib/preview/pyodide-runner';

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
  return [...registry.values()].filter((p) => p.tier === 'core');
}

export function listExtensionLanguages(): LanguagePlugin[] {
  return [...registry.values()].filter((p) => p.tier === 'extension');
}

export function listAllLanguages(): LanguagePlugin[] {
  return [...registry.values()];
}

export function getDefaultLanguageId(): string {
  try {
    return localStorage.getItem('blockyedu_language') ?? 'javascript';
  } catch {
    return 'javascript';
  }
}

export function runLanguageCode(languageId: string, code: string): LanguageRunResult {
  return runLanguageCodePreviewSync(languageId, code);
}

/** 同步预览（仅 JS）；异步请用 runLanguageCodePreview */
function runLanguageCodePreviewSync(languageId: string, code: string): LanguageRunResult {
  const plugin = getLanguagePlugin(languageId);
  if (!plugin) {
    return { logs: [], error: `未知语言：${languageId}` };
  }

  if (plugin.run === 'plugin') {
    return {
      logs: [`[插件] ${plugin.runHint ?? `请安装 ${plugin.pluginPackage}`}`],
    };
  }

  if (plugin.run === 'server') {
    return { logs: ['[server] 请使用 Pro 云端运行'] };
  }

  if (plugin.run === 'none') {
    return { logs: ['[info] 该语言暂不支持运行，仅编辑'] };
  }

  switch (languageId) {
    case 'javascript':
      return { logs: runJavascript(code) };
    default:
      return { logs: ['[info] 请使用「预览运行」按钮加载完整运行时'] };
  }
}

/** 浏览器预览：JS / TS (typescript.js) / Python (Pyodide) */
export async function runLanguageCodePreview(
  languageId: string,
  code: string,
): Promise<LanguageRunResult> {
  const plugin = getLanguagePlugin(languageId);
  if (!plugin) {
    return { logs: [], error: `未知语言：${languageId}` };
  }

  if (plugin.run === 'plugin') {
    return {
      logs: [
        `[插件] ${plugin.runHint ?? `请安装 ${plugin.pluginPackage}`}`,
        '[提示] Pro 用户可使用「Pro 运行」在云端沙箱执行此语言',
      ],
    };
  }

  if (plugin.run === 'none') {
    return { logs: ['[info] 该语言暂不支持运行，仅编辑'] };
  }

  try {
    switch (languageId) {
      case 'javascript':
        return { logs: runJavascript(code) };
      case 'typescript': {
        const js = await compileTypeScriptToJs(code);
        return { logs: runJavascript(js) };
      }
      case 'python':
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

export type { LanguagePlugin, LanguageRunResult, LanguageTier, RunCapability } from './types';
