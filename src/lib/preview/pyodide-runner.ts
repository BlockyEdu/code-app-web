import { loadScript } from './load-script';

const PYODIDE_JS =
  'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';

type PyodideRuntime = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (msg: string) => void }) => void;
  setStderr: (opts: { batched: (msg: string) => void }) => void;
};

declare global {
  interface Window {
    loadPyodide?: (opts?: { indexURL: string }) => Promise<PyodideRuntime>;
  }
}

let pyodide: PyodideRuntime | null = null;
let loading: Promise<PyodideRuntime> | null = null;

export function loadPyodideRuntime(): Promise<PyodideRuntime> {
  if (pyodide) return Promise.resolve(pyodide);
  if (!loading) {
    loading = (async () => {
      await loadScript(PYODIDE_JS);
      if (!window.loadPyodide) throw new Error('Pyodide 未加载');
      const runtime = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
      });
      pyodide = runtime;
      return runtime;
    })();
  }
  return loading;
}

export async function runPythonWithPyodide(code: string): Promise<string[]> {
  const logs: string[] = [];
  const py = await loadPyodideRuntime();
  py.setStdout({ batched: (msg) => logs.push(msg) });
  py.setStderr({ batched: (msg) => logs.push(`[stderr] ${msg}`) });
  try {
    await py.runPythonAsync(code);
  } catch (err) {
    logs.push(`[error] ${err instanceof Error ? err.message : String(err)}`);
  }
  return logs.length ? logs : ['[info] 程序已执行（无输出）'];
}
