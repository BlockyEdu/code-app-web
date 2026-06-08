/** 语言插件能力分级 */
export type LanguageTier = 'core' | 'extension';

/** 代码运行方式 */
export type RunCapability = 'in-browser' | 'plugin' | 'server' | 'none';

export interface LanguagePlugin {
  /** 稳定 ID，与 server Project.language 一致 */
  id: string;
  /** 显示名 */
  name: string;
  /** 短标签，用于工具栏 */
  label: string;
  tier: LanguageTier;
  /** Monaco 语言 ID */
  monacoLanguageId: string;
  /** 是否支持 Blockly 积木 */
  blockly: boolean;
  /** 默认 starter 代码 */
  defaultStarter: string;
  run: RunCapability;
  /** 扩展语言 / 插件运行时的提示 */
  runHint?: string;
  /** 推荐文件扩展名 */
  fileExtension: string;
  /** 未来 npm 插件包名（extension 语言） */
  pluginPackage?: string;
  /** 插件说明 */
  description?: string;
}

export interface LanguageRunResult {
  logs: string[];
  error?: string;
}

export interface LanguagePluginManifest {
  id: string;
  packageName: string;
  version?: string;
}
