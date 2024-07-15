export function runJavascript(code: string): string[] {
  const logs: string[] = [];
  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
    warn: (...args: unknown[]) => logs.push(`[warn] ${args.map(String).join(' ')}`),
    error: (...args: unknown[]) => logs.push(`[error] ${args.map(String).join(' ')}`),
  };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', code);
    fn(fakeConsole);
  } catch (err) {
    logs.push(`[error] ${err instanceof Error ? err.message : String(err)}`);
  }
  return logs;
}

/** TS 子集：同步简易模式（回退） */
export function runTypescriptSync(code: string): string[] {
  const stripped = code
    .replace(/:\s*(string|number|boolean|void|unknown|any)\b/g, '')
    .replace(/<[^>]+>/g, '');
  const logs = runJavascript(stripped);
  if (logs.some((l) => l.startsWith('[error]'))) {
    logs.unshift('[info] TypeScript 预览模式：复杂类型请编译后运行');
  }
  return logs;
}

/** Python 简易 print 解析；完整能力由 Pyodide 插件提供 */
export function runPython(code: string): string[] {
  const logs: string[] = [];
  const printRe = /print\s*\(\s*([^)]+)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = printRe.exec(code)) !== null) {
    const raw = match[1].trim();
    const unquoted = raw.replace(/^['"]|['"]$/g, '');
    logs.push(unquoted);
  }
  if (logs.length === 0) {
    logs.push(
      '[info] 简易模式仅支持 print("...")；完整 Python 请安装 @blockyedu/plugin-lang-python',
    );
  }
  return logs;
}

export function runCpp(_code: string) {
  return { logs: ['[插件] 请安装 @blockyedu/plugin-lang-cpp 以运行 C++'] };
}

export function runCsharp(_code: string) {
  return { logs: ['[插件] 请安装 @blockyedu/plugin-lang-csharp 以运行 C#'] };
}

export function runJava(_code: string) {
  return { logs: ['[插件] 请安装 @blockyedu/plugin-lang-java 以运行 Java'] };
}

export function runRust(_code: string) {
  return { logs: ['[插件] 请安装 @blockyedu/plugin-lang-rust 以运行 Rust'] };
}

export function runGo(_code: string) {
  return { logs: ['[插件] 请安装 @blockyedu/plugin-lang-go 以运行 Go'] };
}

export function checkLessonStep(output: string[], checkValue: string): boolean {
  if (checkValue === '__SKIP__') return true;
  return output.some((line) => line.includes(checkValue));
}
