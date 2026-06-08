/**
 * 扩展语言插件清单 — 第三方可通过 npm 包注册 registerLanguagePlugin()
 * 安装示例：npm install @blockyedu/plugin-lang-cpp
 */
export const EXTENSION_PLUGIN_MANIFEST = [
  {
    id: 'cpp',
    packageName: '@blockyedu/plugin-lang-cpp',
    description: 'WASM 版 g++ 编译器，浏览器内运行 C++',
  },
  {
    id: 'csharp',
    packageName: '@blockyedu/plugin-lang-csharp',
    description: 'Roslyn / WASM 运行时（规划中）',
  },
  {
    id: 'java',
    packageName: '@blockyedu/plugin-lang-java',
    description: 'TeaVM 或 server 沙箱（规划中）',
  },
  {
    id: 'rust',
    packageName: '@blockyedu/plugin-lang-rust',
    description: 'WASM rustc 工具链（规划中）',
  },
  {
    id: 'go',
    packageName: '@blockyedu/plugin-lang-go',
    description: 'TinyGo WASM（规划中）',
  },
  {
    id: 'python',
    packageName: '@blockyedu/plugin-lang-python',
    description: 'Pyodide 完整 Python 运行时（可选增强 core Python）',
  },
] as const;
