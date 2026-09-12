import { DEFAULT_JS } from "../lib/blockly-defaults";
import { t } from "../lib/i18n";
import type { LanguagePlugin } from "./types";

export const javascriptPlugin: LanguagePlugin = {
  id: "javascript",
  name: "JavaScript",
  label: "JS",
  tier: "core",
  monacoLanguageId: "javascript",
  blockly: true,
  fileExtension: ".js",
  run: "in-browser",
  get defaultStarter() {
    return DEFAULT_JS();
  },
  get description() {
    return t("lang.jsDesc");
  },
};

export const typescriptPlugin: LanguagePlugin = {
  id: "typescript",
  name: "TypeScript",
  label: "TS",
  tier: "core",
  monacoLanguageId: "typescript",
  blockly: false,
  fileExtension: ".ts",
  run: "in-browser",
  get defaultStarter() {
    return t("lang.tsStart");
  },
  get description() {
    return t("lang.tsDesc");
  },
};

export const pythonPlugin: LanguagePlugin = {
  id: "python",
  name: "Python",
  label: "Py",
  tier: "core",
  monacoLanguageId: "python",
  blockly: false,
  fileExtension: ".py",
  run: "in-browser",
  get defaultStarter() {
    return t("lang.pyStart");
  },
  get description() {
    return t("lang.pyDesc");
  },
};

export const cppPlugin: LanguagePlugin = {
  id: "cpp",
  name: "C++",
  label: "C++",
  tier: "extension",
  monacoLanguageId: "cpp",
  blockly: false,
  fileExtension: ".cpp",
  run: "plugin",
  pluginPackage: "@blockyedu/plugin-lang-cpp",
  get runHint() {
    return t("lang.cppHint");
  },
  get defaultStarter() {
    return t("lang.cppStart");
  },
  get description() {
    return t("lang.cppDesc");
  },
};

export const csharpPlugin: LanguagePlugin = {
  id: "csharp",
  name: "C#",
  label: "C#",
  tier: "extension",
  monacoLanguageId: "csharp",
  blockly: false,
  fileExtension: ".cs",
  run: "plugin",
  pluginPackage: "@blockyedu/plugin-lang-csharp",
  get runHint() {
    return t("lang.csharpHint");
  },
  get defaultStarter() {
    return t("lang.csharpStart");
  },
  get description() {
    return t("lang.csharpDesc");
  },
};

export const javaPlugin: LanguagePlugin = {
  id: "java",
  name: "Java",
  label: "Java",
  tier: "extension",
  monacoLanguageId: "java",
  blockly: false,
  fileExtension: ".java",
  run: "plugin",
  pluginPackage: "@blockyedu/plugin-lang-java",
  get runHint() {
    return t("lang.javaHint");
  },
  get defaultStarter() {
    return t("lang.javaStart");
  },
  get description() {
    return t("lang.javaDesc");
  },
};

export const rustPlugin: LanguagePlugin = {
  id: "rust",
  name: "Rust",
  label: "Rust",
  tier: "extension",
  monacoLanguageId: "rust",
  blockly: false,
  fileExtension: ".rs",
  run: "plugin",
  pluginPackage: "@blockyedu/plugin-lang-rust",
  get runHint() {
    return t("lang.rustHint");
  },
  get defaultStarter() {
    return t("lang.rustStart");
  },
  get description() {
    return t("lang.rustDesc");
  },
};

export const goPlugin: LanguagePlugin = {
  id: "go",
  name: "Go",
  label: "Go",
  tier: "extension",
  monacoLanguageId: "go",
  blockly: false,
  fileExtension: ".go",
  run: "plugin",
  pluginPackage: "@blockyedu/plugin-lang-go",
  get runHint() {
    return t("lang.goHint");
  },
  get defaultStarter() {
    return t("lang.goStart");
  },
  get description() {
    return t("lang.goDesc");
  },
};

export const BUILTIN_PLUGINS: LanguagePlugin[] = [
  javascriptPlugin,
  typescriptPlugin,
  pythonPlugin,
  cppPlugin,
  csharpPlugin,
  javaPlugin,
  rustPlugin,
  goPlugin,
];
