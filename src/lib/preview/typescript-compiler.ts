import { loadScript } from './load-script';

const TS_CDN = 'https://cdn.jsdelivr.net/npm/typescript@5.6.3/lib/typescript.js';

type TsGlobal = {
  transpileModule: (
    code: string,
    options: { compilerOptions: { target: number; module: number } },
  ) => { outputText: string; diagnostics: { messageText: string }[] };
  ScriptTarget: { ES2020: number };
  ModuleKind: { CommonJS: number };
};

declare global {
  interface Window {
    ts?: TsGlobal;
  }
}

let loading: Promise<TsGlobal> | null = null;

export function loadTypeScriptCompiler(): Promise<TsGlobal> {
  if (window.ts) return Promise.resolve(window.ts);
  if (!loading) {
    loading = loadScript(TS_CDN).then(() => {
      if (!window.ts) throw new Error('typescript.js 未加载');
      return window.ts;
    });
  }
  return loading;
}

export async function compileTypeScriptToJs(code: string): Promise<string> {
  const ts = await loadTypeScriptCompiler();
  const out = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
    },
  });
  const err = out.diagnostics?.[0]?.messageText;
  if (err) throw new Error(String(err));
  return out.outputText;
}
