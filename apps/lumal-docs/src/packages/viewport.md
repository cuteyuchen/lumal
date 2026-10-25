# @lumal/viewport

纯 Vue 的尺寸监听与工作区适配能力，供普通页面、独立 Screen 和 Admin 内嵌区域复用。
不依赖 Core、Element Plus、ECharts、地图或 Cockpit。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/viewport` |
| 本地路径 | `packages/viewport` |
| 在线文档 | https://lumal.cuteyuchen.top/packages/viewport |
| npm 地址 | `https://www.npmjs.com/package/@lumal/viewport` |
| Peer | Vue `^3.5.0` |

## 安装

本文面向已发布的 `0.0.6-beta` API，下列命令显式选择本版。
逐包核验见 [发布记录](/reference/npm-release-0.0.6-beta)，未发布源码接入见 [安装说明](/guide/essentials/installation)。

```bash
pnpm add @lumal/viewport@0.0.6-beta vue@^3.5
```

## 公开入口

从 `@lumal/viewport` 导入以下能力和相应类型，不需要额外全局样式：

| 能力 | 用途 |
| --- | --- |
| `LumalViewport` | 基于自身实际容器的响应式、contain、width 或容器单位策略 |
| `createViewportPlugin` | 提供应用默认值，不变换 DOM 根或强制注册路由守卫 |
| `resolveViewportPolicy` / `useViewportPolicy` | 合并应用默认和局部显式覆盖 |
| `useElementSize` / `useViewportScale` | 响应式尺寸与比例，管理 Observer、RAF 和生命周期 |
| `computeViewportScale` | 无 Vue 实例的纯缩放算法 |
| `computeViewportFontSize` | 明确字号下限计算，不修改 Admin 用户字体偏好 |

## 范围与策略

应用默认、页面和容器是三个作用范围，策略单独选择：
`disabled` 关闭，`responsive` 保持自然布局，`contain` 等比完整容纳并留白，
`width` 等比填满宽度并允许宿主局部纵向滚动，`vw` 只提供实际容器尺寸变量。
容器需有明确宽高，`minScale/maxScale/minFontSize` 由消费方显式配置。

全局、路由/页面与容器接线示例集中维护在
[屏幕与工作区适配](/reference/screen-viewport-guide)，
Screen 与混合后台项目见 [项目模板](/reference/project-template-guide)。

## 集成边界

- 观察实际内容容器，不把含 Header / Tabbar 的页面一律按窗口高度计算。
- 地图保持实际尺寸，变化时调用现有实例 `updateSize()`；图表调用 `resize()`。
- 不在尺寸回调中重建引擎、重新拉取全部业务数据或重置中心位置。
- 同一内容树只保留一个画布缩放责任方，内层 Cockpit 使用 `viewport-mode="external"`。
- Teleport 到 body 的弹层不自动继承局部画布缩放，需独立核对位置、字号和点击。
- KeepAlive 停用时暂停监听，激活后测量恢复；不向后续页面残留全局 CSS。

脱敏夹具的真实地图、Canvas、Element Plus 与浏览器缩放证据见
[隔离验收报告](/reference/screen-viewport-verification)，不能代替原业务页面验收。
