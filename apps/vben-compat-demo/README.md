# vben-compat-demo

`@luma/vben-compat` 兼容层的示例应用（包名 `luma-vben-compat-demo`），演示如何在 Vben 风格的 API 之上使用 Luma 组件库，帮助从 Vben Admin 迁移的项目平滑接入。

## 技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vite
- Element Plus
- Luma 组件库：`@luma/core`、`@luma/vben-compat`、`@luma/icons`、`@luma/icons-vue`

## 本地开发

开发（`vite serve`）模式下通过 `@luma/vite` 的 `createLumaAliases` 将 `@luma/*` 别名指向各 package 的 **源码**，改动组件库即时热更新，无需先构建 dist；生产构建才使用各包的 `dist` 产物。

```bash
# 在仓库根目录：一键并行启动全部 app
pnpm dev

# 或在本目录单独启动
pnpm dev
```

- 开发服务器固定端口：**5185**（`strictPort: true`）。
- 访问地址：http://127.0.0.1:5185

## 目录结构

```
src/
├── App.vue        # 示例主界面
├── styles.scss
└── main.ts        # 应用入口，注册兼容层与样式
```

## 常用脚本

| 脚本 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（端口 5185） |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览构建产物 |

## 构建说明

根目录提供 `pnpm compat:build`，会先构建全部 `@luma/*` 包再构建本示例。
