import type { LanguagePlugin } from './types';

export const javascriptPlugin: LanguagePlugin = {
  id: 'javascript',
  name: 'JavaScript',
  label: 'JS',
  tier: 'core',
  monacoLanguageId: 'javascript',
  blockly: true,
  fileExtension: '.js',
  run: 'in-browser',
  defaultStarter: `// JavaScript
console.log("Hello BlockyEdu");
`,
  description: 'Web 与 Blockly 默认语言，浏览器内直接运行',
};

export const typescriptPlugin: LanguagePlugin = {
  id: 'typescript',
  name: 'TypeScript',
  label: 'TS',
  tier: 'core',
  monacoLanguageId: 'typescript',
  blockly: false,
  fileExtension: '.ts',
  run: 'in-browser',
  defaultStarter: `// TypeScript
const message: string = "Hello BlockyEdu";
console.log(message);
`,
  description: 'Monaco 编辑；预览用 typescript.js，完整运行需 Pro + Piston',
};

export const pythonPlugin: LanguagePlugin = {
  id: 'python',
  name: 'Python',
  label: 'Py',
  tier: 'core',
  monacoLanguageId: 'python',
  blockly: false,
  fileExtension: '.py',
  run: 'in-browser',
  defaultStarter: `# Python
print("Hello BlockyEdu")
`,
  description: '入门友好；预览用 Pyodide，完整标准库与 pip 需 Pro 云端',
};

export const cppPlugin: LanguagePlugin = {
  id: 'cpp',
  name: 'C++',
  label: 'C++',
  tier: 'extension',
  monacoLanguageId: 'cpp',
  blockly: false,
  fileExtension: '.cpp',
  run: 'plugin',
  pluginPackage: '@blockyedu/plugin-lang-cpp',
  runHint: 'C++ 运行需安装 @blockyedu/plugin-lang-cpp（WASM 编译器）',
  defaultStarter: `// C++
#include <iostream>
int main() {
  std::cout << "Hello BlockyEdu" << std::endl;
  return 0;
}
`,
  description: '通过插件提供 WASM 编译与运行',
};

export const csharpPlugin: LanguagePlugin = {
  id: 'csharp',
  name: 'C#',
  label: 'C#',
  tier: 'extension',
  monacoLanguageId: 'csharp',
  blockly: false,
  fileExtension: '.cs',
  run: 'plugin',
  pluginPackage: '@blockyedu/plugin-lang-csharp',
  runHint: 'C# 运行需安装 @blockyedu/plugin-lang-csharp',
  defaultStarter: `// C#
using System;
class Program {
  static void Main() {
    Console.WriteLine("Hello BlockyEdu");
  }
}
`,
};

export const javaPlugin: LanguagePlugin = {
  id: 'java',
  name: 'Java',
  label: 'Java',
  tier: 'extension',
  monacoLanguageId: 'java',
  blockly: false,
  fileExtension: '.java',
  run: 'plugin',
  pluginPackage: '@blockyedu/plugin-lang-java',
  runHint: 'Java 运行需安装 @blockyedu/plugin-lang-java 或连接 server 沙箱',
  defaultStarter: `// Java
public class Main {
  public static void main(String[] args) {
    System.out.println("Hello BlockyEdu");
  }
}
`,
};

export const rustPlugin: LanguagePlugin = {
  id: 'rust',
  name: 'Rust',
  label: 'Rust',
  tier: 'extension',
  monacoLanguageId: 'rust',
  blockly: false,
  fileExtension: '.rs',
  run: 'plugin',
  pluginPackage: '@blockyedu/plugin-lang-rust',
  runHint: 'Rust 运行需安装 @blockyedu/plugin-lang-rust（WASM）',
  defaultStarter: `// Rust
fn main() {
    println!("Hello BlockyEdu");
}
`,
};

export const goPlugin: LanguagePlugin = {
  id: 'go',
  name: 'Go',
  label: 'Go',
  tier: 'extension',
  monacoLanguageId: 'go',
  blockly: false,
  fileExtension: '.go',
  run: 'plugin',
  pluginPackage: '@blockyedu/plugin-lang-go',
  runHint: 'Go 运行需安装 @blockyedu/plugin-lang-go',
  defaultStarter: `// Go
package main
import "fmt"
func main() {
  fmt.Println("Hello BlockyEdu")
}
`,
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
