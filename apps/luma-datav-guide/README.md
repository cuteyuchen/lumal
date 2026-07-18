# luma-datav-guide

`@luma/datav` 大屏可视化组件库的独立指南站，逐一演示各 DataV 组件的用法与可交互的属性编辑示例。可静态托管，并通过外链形式内嵌到 [luma-admin](../luma-admin/README.md)（由其 `VITE_DATAV_GUIDE_URL` 指向本站）。

## 技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vite
- Vue Router 4
- Element Plus
- ECharts（通过 `@luma/datav`）
- Luma 组件库：`@luma/core`、`@luma/datav`、`@luma/icons`、`@luma/icons-vue`

## 本地开发

开发（`vite serve`）模式下通过 `@luma/vite` 的 `createLumaAliases` 将 `@luma/*` 别名指向各 package 的 **源码**，改动组件库即时热更新，无需先构建 dist；生产构建才使用各包的 `dist` 产物。

```bash
# 在仓库根目录：一键并行启动全部 app
pnpm dev

# 或在本目录单独启动
pnpm dev
```

- 开发服务器固定端口：**5175**（`strictPort: true`）。
- 访问地址：http://127.0.0.1:5175
- `base: './'`：构建产物使用相对路径，便于任意子路径静态托管。

## 目录结构

```
src/
├── components/     # 指南站布局与演示组件（含基于 LumaSchemaForm 的属性编辑器）
├── pages/
│   ├── components/ # 各 DataV 组件的演示页
│   └── guide/      # 指南/说明页
├── navigation.ts   # 侧边导航配置
├── router.ts       # 路由
├── services/       # 数据服务
├── styles/
├── App.vue
└── main.ts
```

## 常用脚本

| 脚本 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（端口 5175） |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览构建产物 |
| `pnpm typecheck` | 类型检查 |

## 与 admin 的关系

admin 中的 DataV 指南入口通过 iframe 外链本站。本地联调时，`pnpm dev`（根目录）会同时拉起 admin 与本站，admin 默认按 `http://localhost:5175/` 加载，因此请保持本站端口 5175 不变。
