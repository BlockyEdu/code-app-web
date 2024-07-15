import type { LanguageRunResult } from '../plugins';
import { runLanguageCodePreview } from '../plugins';
import { api, type CodeRuntimeConfig, type ExecuteCodeResult } from './api';

export type RunTier = 'preview' | 'cloud' | 'local';

export interface LocalExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

declare global {
  interface Window {
    blockyedu?: {
      isElectron?: boolean;
      executeLocal?: (opts: {
        languageId: string;
        code: string;
        stdin?: string;
      }) => Promise<LocalExecuteResult>;
      pistonReachable?: () => Promise<boolean>;
    };
  }
}

export function isElectronHost(): boolean {
  return Boolean(window.blockyedu?.isElectron);
}

export async function fetchRuntimeConfig(): Promise<CodeRuntimeConfig> {
  return api.codeRuntime();
}

export async function runPreview(
  languageId: string,
  code: string,
): Promise<LanguageRunResult> {
  return runLanguageCodePreview(languageId, code);
}

export async function runCloudPro(
  languageId: string,
  code: string,
  stdin = '',
): Promise<ExecuteCodeResult> {
  return api.executeCode({ languageId, code, stdin });
}

export async function runLocalPro(
  languageId: string,
  code: string,
  stdin = '',
): Promise<LanguageRunResult> {
  const exec = window.blockyedu?.executeLocal;
  if (!exec) {
    return {
      logs: ['[本地] 请在 BlockyEdu 桌面版中运行，并启动 Docker Piston（localhost:2000）'],
      error: 'electron_unavailable',
    };
  }
  try {
    const result = await exec({ languageId, code, stdin });
    const logs: string[] = [];
    if (result.stdout) logs.push(...result.stdout.split('\n').filter(Boolean));
    if (result.stderr) logs.push(...result.stderr.split('\n').map((l) => `[stderr] ${l}`));
    if (result.exitCode !== 0) logs.push(`[exit] ${result.exitCode}`);
    return { logs };
  } catch (err) {
    return {
      logs: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function formatExecuteResult(result: ExecuteCodeResult): string[] {
  const lines: string[] = [];
  if (result.compile?.stderr) lines.push(`[compile] ${result.compile.stderr}`);
  if (result.stdout) lines.push(...result.stdout.split('\n').filter((l) => l.length > 0));
  if (result.stderr) {
    for (const line of result.stderr.split('\n')) {
      if (line) lines.push(`[stderr] ${line}`);
    }
  }
  if (result.exitCode !== 0) lines.push(`[exit] ${result.exitCode}`);
  if (lines.length === 0) lines.push('[info] 程序已执行（无输出）');
  return lines;
}
