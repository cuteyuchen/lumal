# @lumal/cockpit

通用驾驶舱编排框架：布局配置、左右模块运行时、Designer、组件注册与消息总线。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/cockpit` |
| 本地路径 | `packages/cockpit` |
| 在线文档 | https://lumal-docs-cf.pages.dev/packages/cockpit |
| 正式地址（上线后） | `https://www.npmjs.com/package/@lumal/cockpit` |
| 规范 | [驾驶舱开发规范](/reference/cockpit-development-spec) |
| 示例 | `apps/lumal-cockpit` |

## 安装

```bash
pnpm add @lumal/cockpit @lumal/core @lumal/icons-vue vue element-plus
```

可视化组件按需另装 `@lumal/datav`。

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `@lumal/cockpit` | 聚合导出 |
| `@lumal/cockpit/runtime` | 只读运行时（可不加载 Designer） |
| `@lumal/cockpit/designer` | 设计器 |
| `@lumal/cockpit/registry` | 组件注册表 |
| `@lumal/cockpit/style.css` | 样式 |

## v3 模型要点

- `CockpitConfig` 仅含 `layouts` 与 `activeLayoutId`
- 布局含独立左、右区域；列宽像素、行高百分比（合计 100%）
- 普通行每列一个槽；合并行作 Tab 容器
- **中心内容不进配置**，由应用插槽提供

## 注册模块

```ts
import { createCockpitRegistry } from '@lumal/cockpit/registry'

const registry = createCockpitRegistry()

registry.registerWidget({
  type: 'application-widget',
  label: '应用模块',
  component: () => import('./ApplicationWidget.vue'),
})
```

可选 `thumbnail`；未提供时 Designer 实时渲染预览。业务资源由消费应用维护。

## 运行时

```vue
<script setup lang="ts">
import { LumalCockpit } from '@lumal/cockpit/runtime'
import '@lumal/cockpit/style.css'
</script>

<template>
  <LumalCockpit
    v-model:active-layout-id="activeLayoutId"
    :config="config"
    :registry="registry"
    :viewport-mode="viewportMode"
  >
    <template #header-title="{ title }">
      <AppHeader :title="title" :layouts="config.layouts" />
    </template>

    <template #center="{ context, layout }">
      <ApplicationCenter :key="context.instanceId" :context="context" :layout="layout" />
    </template>
  </LumalCockpit>
</template>
```

- `viewportMode="scale"`：1920×1080 等比缩放
- `viewportMode="vwvh"`：VW/VH 适配
- 同 type 可多实例（独立 `instanceId`）；Tab 切换保留实例状态
- 布局导航由应用负责

## Designer

```vue
<script setup lang="ts">
import { LumalCockpitDesigner } from '@lumal/cockpit/designer'
</script>

<template>
  <LumalCockpitDesigner
    :config="config"
    :registry="registry"
    :saving="saving"
    @save="saveLayout"
    @cancel="closeDesigner"
  />
</template>
```

- 仅编辑草稿副本；`@save` 输出 `{ config, layout }`
- 包 **不** 调用 HTTP / localStorage
- 装配区只含左右网格，无中央大屏预览

## 自定义 Card

通过 `cardComponent` 替换默认 `LumalCockpitCard`，需支持 `title`、`widget`、`tabs`、`activeTabId` 及 `title` / `tab` 插槽等约定。

## 边界

- 不内置地图 / 图表引擎、行业皮肤、固定 Logo
- 不包含业务接口地址、状态码、权限码
- 依赖 `@lumal/core`；**不能**依赖 `@lumal/charts` 或 ECharts 运行时
