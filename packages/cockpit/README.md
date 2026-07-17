# @luma/cockpit

Luma 通用驾驶舱 v3 编排框架。包负责布局配置、左右模块运行时、Designer、组件注册和消息总线；消费应用负责中心内容、业务模块、导航、主题皮肤、权限和持久化。

## v3 模型

- `CockpitConfig` 只包含 `layouts` 和 `activeLayoutId`，不包含分类、页面或中央组件配置。
- 一个布局保存独立的左、右区域。
- 区域由像素列宽和百分比行高组成；所有行高标准化后合计 `100%`。
- 普通行每列对应一个空槽或模块；合并行跨满区域并作为 Tab 容器。
- 中心内容不进入配置，由消费应用通过插槽直接提供。

## 公开入口

```text
@luma/cockpit
@luma/cockpit/runtime
@luma/cockpit/designer
@luma/cockpit/registry
@luma/cockpit/style.css
```

`runtime` 和 `designer` 独立构建，只读应用无需加载 Designer 与 SortableJS。

## 注册模块

```ts
import { createCockpitRegistry } from '@luma/cockpit/registry'

const registry = createCockpitRegistry()

registry.registerWidget({
  type: 'application-widget',
  label: '应用模块',
  component: () => import('./ApplicationWidget.vue'),
})
```

模块定义可以提供 `thumbnail`。未提供时 Designer 实时渲染组件；缩略图和业务资源始终由消费应用维护。

## 运行时

```vue
<LumaCockpit
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
</LumaCockpit>
```

- 布局导航由消费应用负责。
- 中心内容位于底层全宽画布，左右区域覆盖在其两侧。
- `viewportMode="scale"` 使用 1920 × 1080 等比缩放；`viewportMode="vwvh"` 使用 VW/VH 单位适配。
- 相同模块 type 可以创建多个拥有独立 `instanceId` 的实例。
- Tab 切换保留全部模块实例状态。

## Designer

```vue
<LumaCockpitDesigner
  :config="config"
  :registry="registry"
  :saving="saving"
  @save="saveLayout"
  @cancel="closeDesigner"
/>
```

- Designer 只编辑打开时创建的草稿副本。
- 装配区仅保留左右两侧网格，不再渲染中央大屏预览。
- 左右区域头部常驻展示行列数与像素列宽，每行头部常驻展示百分比行高，无需悬浮或点击。
- 每行独立切换普通网格或 Tab 行。
- 模块库拖入时复制实例，已放置模块可以跨区域和普通槽/Tab 行移动。
- 替换占用槽必须确认；缩减包含模块的行列会被阻止。
- 拖拽操作同时提供可聚焦的选择、移动和目标按钮。
- 已放置模块共享 `mode: 'design'` 的消息总线；模块库预览保持隔离。
- 保存事件输出 `{ config, layout }`，包不调用 HTTP 或写入 localStorage。

## 公共 Card

`LumaCockpit` 默认使用 `LumaCockpitCard`。应用可通过 `cardComponent` 替换外框和 Tab 头部，组件须接收：

- `title?: string`
- `widget?: CockpitWidgetInstance`
- `tabs?: CockpitCardTab[]`
- `activeTabId?: string`
- `update:activeTabId` 事件
- 默认、`title` 和 `tab` 插槽

默认 Card 提供 TabList、Tab、TabPanel 语义以及方向键、Home、End 键盘操作。

## 主题边界

包只提供结构样式和语义 CSS 变量，不包含固定行业皮肤、Logo、地图、业务截图或业务字体。消费应用可以覆盖变量、传入 Card、使用标题背景和自定义插槽实现品牌样式。
