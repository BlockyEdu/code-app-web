# BlockyEdu Code App Web

编程平台 Web 端：Blockly + Monaco + AI 辅导。

## 依赖服务

- [BlockyEdu/server](https://github.com/BlockyEdu/server) — `http://localhost:3000`

## 工具链

- 构建：**Rsbuild**（`rsbuild.config.ts`）
- 规范：**Biome**（`npm run lint`）

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:5173

## 环境变量

```env
# .env.local（可选）
VITE_API_BASE_URL=/api/v1
```

开发时 Rsbuild 将 `/api` 代理到 server（见 `rsbuild.config.ts`）。

## API 路径（server v0.1）

| 功能 | 路径 |
| --- | --- |
| 健康检查 | `GET /api/v1/health` |
| 项目 | `/api/v1/code/projects` |
| 练习 | `/api/v1/code/lessons` |
| AI | `/api/v1/ai/chat`, `/api/v1/ai/code/fix` |

## 从 platform 迁移

本仓库自 `VibeEdu/platform/apps/web` 拆出，API 已从 `/api/projects` 升级为 `/api/v1/code/projects`。
