# @lumal/cockpit

## 什么时候用

需要多布局、左右模块区域、Tab 行、模块注册/消息通信，或可视化装配设计器时使用。只摆一张静态大屏不必引入编排框架；图表和装饰本身由 [Charts](charts.md) / [DataV](datav.md) 提供。

## 包边界与入口

- `@lumal/cockpit/runtime`：只读运行时、Card、容器和模块宿主。
- `@lumal/cockpit/registry`：模块注册表和类型。
- `@lumal/cockpit/designer`：设计器及草稿相关能力；只有编辑页面需要时才引入。
- 根入口：配置工厂/迁移/校验、消息总线、composables、运行时；不从根入口导入 Designer。
- `@lumal/cockpit/style.css`：公共样式。设计器的 UI 需 Element Plus，实际 peer 与样式按所用入口核对。

运行时与设计器分开构建，只读页面不要同步加载 Designer/Sortable。中心地图、业务模块、HTTP、鉴权、保存策略和皮肤全部由消费应用负责。

## v3 配置模型

`CockpitConfig` 包含版本、标识、标题、`layouts/activeLayoutId`。每个 layout 只有 `left/right` 两个区域，**没有旧版 categories/pages 或中央组件配置**。

- 区域列宽为像素，行高为百分比，标准化后行高总计 100%。
- `grid` 行每列是一个空槽或模块；`tabs` 行跨满区域，用 `widgets` 保存模块。
- 中心内容通过 `#center` 插槽提供，不写入配置 JSON。
- 相同 type 的模块可以有多个实例，区分 widget id 与运行时 `context.instanceId`。

## 最小接入

示例假设应用已经提供 `MetricWidget.vue` 和 `ApplicationCenter.vue`：

```vue
<script setup lang="ts">
import { createDefaultCockpitConfig } from '@lumal/cockpit'
import { createCockpitRegistry } from '@lumal/cockpit/registry'
import { LumalCockpit } from '@lumal/cockpit/runtime'
import { shallowRef } from 'vue'
import ApplicationCenter from './ApplicationCenter.vue'
import '@lumal/cockpit/style.css'

/***********************模块注册*********************/
const registry = createCockpitRegistry()
registry.registerWidget({
  type: 'metric',
  label: '指标',
  component: () => import('./MetricWidget.vue'),
})

/***********************布局状态*********************/
const config = shallowRef(createDefaultCockpitConfig())
const activeLayoutId = shallowRef(config.value.activeLayoutId)
</script>

<template>
  <LumalCockpit
    v-model:active-layout-id="activeLayoutId"
    :config="config"
    :registry="registry"
    viewport-mode="scale"
  >
    <template #center="{ context, layout }">
      <ApplicationCenter :context="context" :layout="layout" />
    </template>
  </LumalCockpit>
</template>
```

默认配置提供空槽；注册模块不代表自动把它放进布局。通过 Designer，或 `createWidgetInstance` 配合配置工厂把实例放入相应槽位。

## 设计器与保存

从 `@lumal/cockpit/designer` 单独导入 `LumalCockpitDesigner`，传 `config/registry/saving`，监听 `save/cancel`。

- `save` 负载为 `{ config, layout }`，不是仅一个 layout。
- Designer 编辑草稿，不直接调用后端或写 localStorage。由应用校验权限、持久化成功后替换正式配置。
- 使用 `prepareCockpitConfig/normalizeCockpitConfig/validateCockpitConfig` 与迁移工具接收旧配置；不要手动假装旧结构已是 v3。
- 拖拽缩减包含模块的行列会被阻止，替换已占用槽需确认。新增能力不要绕开这些数据保护。
- `0.0.7-beta` 已修复并发布布局名称输入被还原的补丁；历史 npm `0.0.6-beta` 不含该修复。区分源码、tarball、registry 和示例站点部署。

## 缩放、消息和主题

- `scale`：内部按 1920×1080 等比缩放；`vwvh`：视口单位适配；`external`：父容器承担缩放，Cockpit 不再自缩放。
- 与 `LumalFullScreenContainer` 组合时使用 `external`，避免双重缩放和点击偏移。
- `enterFullscreen()` 只全屏组件根节点；body Teleport 和外部 Designer 不在其中。应用需选择包含浮层的全屏宿主，或打开浮层前退出全屏，不用第二次 CSS 缩放修复可见性。
- 用 `useCockpitContext` 获取当前实例的 `messages/mode/instanceId`；不要为每个模块创建一个互不相通的全局消息总线。
- 设计区内已放置模块共享 `mode: 'design'` 的总线，模块库预览保持隔离。
- 自定义 `cardComponent` 应遵循 `CockpitCardProps`、activeTabId 更新事件和公开插槽，而不是复制运行时内部组件。
- Tab 切换保留实例状态；订阅、轮询、刷新与卸载/失活的清理仍由模块负责。
- 样式只使用结构和语义变量，地图、Logo、行业图片与皮肤属于应用资产。

## Demo 的使用边界

Admin 的 `examples/CockpitView.vue` 是最小 Runtime + Widget，外层 Viewport / 内层 external，
不导入地图或 Designer；独立 `apps/lumal-cockpit` 才演示地图、持久化和编辑流程。
完整源码与安装说明可从仓库 `docs/demo-integration-guide.md` 核对，不把 Demo 业务逻辑复制进公共包。

独立 Demo 从仓库根执行 `pnpm cockpit:build`，包内 `pnpm build` 委托同一流程。
`build:app` 要求公共包 JS / types 已构建；开发源码 alias 不用于生产 preview。
Cesium 为 Demo 应用依赖，部署须包含整个 `cesiumStatic`，不能仅上传 JS/CSS。
资源失败应显示重试，普通 resize 不重建地图；npm 发布不代表 Demo 域名已更新。

仓库核对位置：`packages/cockpit/src/types`、`config`、`registry`、`runtime`、`designer`、`messaging` 及其测试。
