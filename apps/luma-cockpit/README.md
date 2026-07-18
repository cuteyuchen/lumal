# luma-cockpit

独立驾驶舱应用，演示 `@luma/cockpit` 的运行时与设计器能力，并集成多种地理/图表可视化方案（Cesium、OpenLayers、ECharts GEO）。作为独立示例站运行，不进入 `@luma/cockpit` 的发布检查。

## 技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vite（含 `vite-plugin-static-copy` 拷贝 Cesium 静态资源）
- Element Plus
- 可视化：Cesium、OpenLayers（ol / my-openlayer）、ECharts + vue-echarts、china-geojson
- Luma 组件库：`@luma/core`、`@luma/charts`、`@luma/cockpit`、`@luma/datav`、`@luma/icons`、`@luma/icons-vue`

## 本地开发

开发（`vite serve`）模式下通过 `@luma/vite` 的 `createLumaAliases` 将 `@luma/*` 别名指向各 package 的 **源码**，改动组件库即时热更新，无需先构建 dist；生产构建才使用各包的 `dist` 产物。

```bash
# 在仓库根目录：一键并行启动全部 app
pnpm dev

# 或在本目录单独启动
pnpm dev
```

- 开发服务器固定端口：**5180**（`strictPort: true`）。
- 访问地址：http://127.0.0.1:5180
- Cesium 运行时资源由 `vite-plugin-static-copy` 拷贝到 `cesiumStatic/`，`CESIUM_BASE_URL` 已在配置中指向该目录。

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
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览构建产物 |
| `pnpm typecheck` | 类型检查 |
| `pnpm test` | 运行单元测试 |
