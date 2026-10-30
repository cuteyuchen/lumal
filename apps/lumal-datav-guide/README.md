# lumal-datav-guide

基于已发布的 `@lumal/* 0.1.1-beta` 的 DataV 独立指南站，逐一演示各组件的用法与可交互的属性编辑示例。可静态托管，并通过外链形式内嵌到 [lumal-admin](../lumal-admin/README.md)（由其 `VITE_DATAV_GUIDE_URL` 指向本站）。

## 技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vite
- Vue Router 4
- Element Plus
- ECharts（通过 `@lumal/datav`）
- Lumal 组件库：`@lumal/core`、`@lumal/datav`、`@lumal/icons`、`@lumal/icons-vue`

## 本地开发

开发（`vite serve`）模式下通过 `@lumal/vite` 的 `createLumalAliases` 将 UI 包别名指向各 package 的 **源码**，改动组件库即时热更新；生产构建使用各包的 `dist` 产物。全新 clone 先在根目录执行 `pnpm --filter @lumal/vite build`，生成 Vite 配置所需的公开入口。

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
├── components/     # 指南站布局与演示组件（含基于 LumalSchemaForm 的属性编辑器）
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

## 统一 vw 与生产构建

`vite.config.ts` 一处配置设计宽度 1920，业务 CSS/SCSS 和可静态分析的模板 style 正常写 px。
`@lumal/vite` 在 Dev/Build 中统一生成普通 vw，并将同一配置注入 Core 和 DataV 的动态设计尺寸。
高度、字号、有单位行高和最小尺寸按宽度同比换算；细边框、忽略项、原子类与第三方来源保护仍生效。
`LumalFullScreenContainer` 只承载内容与滚动/裁切，不提供模式选择或整画布缩放。

在仓库根执行 `pnpm datav-guide:build`，会按顺序构建依赖和本站；单独在应用内构建前须准备好依赖产物。
iframe 中的 vw 相对 iframe 自身浏览器布局视口，不相对外层 Admin 的容器宽度。
动态图表设计数值显式使用宽度工具，实际 DOM/Canvas 测量直接用于 resize，不再换算。
详细规则见 [统一 vw 指南](../../docs/screen-viewport-guide.md)，线上更新证据见
[0.1.1-beta 执行记录](../../docs/npm-release-0.1.1-beta.md#非-cockpit-站点与宿主-skill-更新)。
