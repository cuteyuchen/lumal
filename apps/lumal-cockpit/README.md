# lumal-cockpit

独立驾驶舱应用，基于已发布的 `@lumal/* 0.0.7-beta` 演示运行时与设计器，并集成 Cesium、OpenLayers、ECharts GEO。应用不进入公共包 tarball；完整生产构建和生产浏览器纳入普通 PR 与 Release Gate。

## 技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vite（含 `vite-plugin-static-copy` 拷贝 Cesium 静态资源）
- Element Plus
- 可视化：Cesium、OpenLayers（ol / my-openlayer）、ECharts + vue-echarts、china-geojson
- Lumal 组件库：`@lumal/core`、`@lumal/charts`、`@lumal/viewport`、`@lumal/cockpit`、`@lumal/datav`、`@lumal/icons`、`@lumal/icons-vue`

## 本地开发

开发（`vite serve`）模式下通过 `@lumal/vite` 的 `createLumalAliases` 将 `@lumal/*` 别名指向各 package 的 **源码**，改动组件库即时热更新，无需先构建 dist；生产构建才使用各包的 `dist` 产物。

```bash
# 在仓库根目录：一键并行启动全部 app
pnpm dev

# 或在本目录单独启动
pnpm dev
```

- 开发服务器固定端口：**5180**（`strictPort: true`）。
- 访问地址：http://127.0.0.1:5180
- Cesium 运行时资源由 `vite-plugin-static-copy` 拷贝到 `cesiumStatic/`，`CESIUM_BASE_URL` 已在配置中指向该目录。

## 交互入口

- 顶部布局选择会保存到本地，设计器按打开时动态加载；取消不写入配置，保存后刷新恢复。
- 自动刷新为 1 分钟，可暂停或立即刷新；左右模块可折叠，Tab 可切换。
- 顶部「视口实验」在真实视口 Dialog 内运行，演示 `@lumal/viewport` 的 contain / width / responsive、
  实际容器尺寸和点击热区。它不包裹主驾驶舱，不会造成双重缩放。
- 主驾驶舱保留 scale / vwvh / DataV 全屏容器三种用法；容器模式内部为 `external`。
- Demo 对整个文档请求全屏，确保 body Teleport 弹窗和兄弟 Designer 仍可交互；缩放仍由原画布负责。
- 中心支持 ECharts、OpenLayers、Cesium 与独立 SVG 场景。窗口 resize 不重建地图。
- Cesium 的初始化、渲染或 WebGL 上下文错误显示可重试状态，并释放旧实例及监听器。
- 本地配置无法读取时显示恢复提示，保留原始存档；只有显式恢复或保存时覆盖。

浏览器验收前在仓库根执行 `pnpm typecheck:e2e:cockpit`，检查 E2E 与共享诊断 Fixture 的类型。
`pnpm test:e2e:cockpit` 会先完整构建，再运行生产 preview；已构建产物可用 `pnpm test:e2e:cockpit:built`。

## 目录结构

```
src/
├── centers/        # 各类可视化"中心"
│   ├── cesium-center/       # Cesium 三维地球
│   ├── echarts-geo-center/  # ECharts GEO 地图
│   ├── openlayers-center/   # OpenLayers 地图
│   ├── scene-center/        # 场景编排
│   └── standalone-center/   # 独立中心示例
├── widgets/        # 驾驶舱挂件（指标卡、趋势、排行、事件列表等）
├── components/     # 应用级组件
├── data/           # 演示数据
├── messages/       # 文案
├── services/       # 数据服务
├── registry.ts     # 挂件/组件注册表
├── styles/
├── App.vue
└── main.ts
```

## 常用脚本

| 脚本 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（端口 5180） |
| `pnpm build` | 从仓库根编排公共包，再类型检查和生产构建；干净 checkout 推荐入口 |
| `pnpm build:app` | 内部步骤，要求已执行根目录 `pnpm cockpit:deps`；缺少产物时给出明确错误 |
| `pnpm preview` | 预览构建产物 |
| `pnpm typecheck` | 类型检查 |
| `pnpm test` | 运行单元测试 |

在仓库根目录使用 `pnpm cockpit:build`，或 `pnpm --filter lumal-cockpit build`，两者执行同一完整构建链。
生产 `preview` 只读取 dist，不启用开发源码 alias。不要用裸 `vite build` 替代包含类型检查的构建命令。

根目录执行 `pnpm test:e2e:cockpit` 完整构建并运行 Playwright；
已有产物时使用 `pnpm test:e2e:cockpit:built`。证据在 `output/playwright/`，
覆盖地图切换、真实 Canvas 像素、静态资源、自动刷新、Designer 保存和配置损坏恢复。
Viewport 实验与主画布隔离；测试的五种窗口尺寸不等同于真实浏览器缩放验证。

完整安装、Cesium 资源与源码 alias / dist 边界见 [接入指南](../../docs/demo-integration-guide.md)。
Designer 名称输入修复已随 `0.0.7-beta` 发布并完成 registry 核验，
示例已随 PR #9 合入 master 并完成授权部署；
首次生产验收基线、Cesium 资源检查及未覆盖边界见
[本版发布记录](../../docs/npm-release-0.0.7-beta.md#合并与站点实际验收)。
后续包版本、源码和线上产物仍须分别核对。
