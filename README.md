# BlockyEdu Code App Web

编程工作台：Blockly + Monaco、多语言插件、AI 辅导、Pro 代码运行。

## 快速开始

**推荐**（MetaRepo 根目录）：

```bash
npm run bootstrap
npm run dev:code
```

打开 http://localhost:18081

## 单独启动

```bash
cp .env.example .env.local
npm install
npm run dev
```

需 `server` 在 http://localhost:13001 运行。

## 演示

- 未登录可使用 **预览运行**（JS / TS / Python）
- 登录 `learner1` / `learner123` 后可保存项目、使用 AI
- Pro 运行需 `prolearner` / `pro123` + Piston（`npm run bootstrap -- --with-piston`）

## 环境变量

见 `.env.example` → 复制为 `.env.local`。
