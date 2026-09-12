import { t } from "../../lib/i18n";

export function runJavascript(code: string): string[] {
  const logs: string[] = [];
  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => logs.push(`[warn] ${args.map(String).join(" ")}`),
    error: (...args: unknown[]) => logs.push(`[error] ${args.map(String).join(" ")}`),
  };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("console", code);
    fn(fakeConsole);
  } catch (err) {
    logs.push(`[error] ${err instanceof Error ? err.message : String(err)}`);
  }
  return logs;
}

/** TS 子集：同步简易模式（回退） */
export function runTypescriptSync(code: string): string[] {
  const stripped = code
    .replace(/:\s*(string|number|boolean|void|unknown|any)\b/g, "")
    .replace(/<[^>]+>/g, "");
  const logs = runJavascript(stripped);
  if (logs.some((l) => l.startsWith("[error]"))) {
    logs.unshift(t("plugin.tsPreview"));
  }
  return logs;
}

/** Python 简易 print 解析；完整能力由 Pyodide 插件提供 */
export function runPython(code: string): string[] {
  const logs: string[] = [];
  const printRe = /print\s*\(\s*([^)]+)\s*\)/g;
  let match = printRe.exec(code);
  while (match !== null) {
    const raw = match[1].trim();
    const unquoted = raw.replace(/^['"]|['"]$/g, "");
    logs.push(unquoted);
    match = printRe.exec(code);
  }
  if (logs.length === 0) {
    logs.push(t("plugin.pythonSimple"));
  }
  return logs;
}

export function runCpp(_code: string) {
  return { logs: [t("plugin.needPackage", { pkg: "@blockyedu/plugin-lang-cpp", lang: "C++" })] };
}

export function runCsharp(_code: string) {
  return { logs: [t("plugin.needPackage", { pkg: "@blockyedu/plugin-lang-csharp", lang: "C#" })] };
}

export function runJava(_code: string) {
  return { logs: [t("plugin.needPackage", { pkg: "@blockyedu/plugin-lang-java", lang: "Java" })] };
}

export function runRust(_code: string) {
  return { logs: [t("plugin.needPackage", { pkg: "@blockyedu/plugin-lang-rust", lang: "Rust" })] };
}

export function runGo(_code: string) {
  return { logs: [t("plugin.needPackage", { pkg: "@blockyedu/plugin-lang-go", lang: "Go" })] };
}

export function checkLessonStep(output: string[], checkValue: string): boolean {
  if (checkValue === "__SKIP__") return true;
  return output.some((line) => line.includes(checkValue));
}
