# Luma 驾驶舱开发规格与应用接入指南

## 1. 文档目的

本文档用于指导在 Luma 仓库中开发通用驾驶舱能力，并作为 Claude Code 或其他实现者的直接开发依据。

本次开发的核心目标不是提供某一个具体行业驾驶舱，而是提供一个可被高度定制的驾驶舱编排框架：

- Luma 提供驾驶舱骨架、布局运行时、模块编排设计器、组件注册机制和通用消息通道。
- 应用提供中央业务组件、两侧业务模块、分类、页面、数据请求、权限和持久化实现。
- Luma 不内置任何地图引擎、业务模块或行业术语。
- 同一套通用能力既能集成到 Luma Admin，也能由独立驾驶舱应用直接使用。

实现完成后，应当能够在不修改 @luma/cockpit 源码的情况下，为不同项目注册完全不同的中央组件、业务模块和分类。

## 2. 已确定的产品需求

### 2.1 入口与路由

- Admin Header 增加驾驶舱图标入口。
- 点击入口后进入独立驾驶舱路由。
- 驾驶舱路由不展示 Admin 的 Header、Sidebar 和 Tabs。
- 驾驶舱路由仍使用现有登录态和权限守卫。
- 驾驶舱页面提供返回 Admin、进入全屏和进入配置模式的操作入口。
- 配置入口仅对具备编辑权限的用户展示。

### 2.2 驾驶舱总体结构

驾驶舱采用 1920 × 1080 作为基准画布，运行时等比缩放到实际窗口。

整体结构固定为：

~~~text
驾驶舱
├─ 顶部区域
│  ├─ 标题
│  ├─ 页面选择
│  └─ 应用提供的扩展操作
├─ 左侧模块区域
├─ 中央组件区域
├─ 右侧模块区域
└─ 分类切换区域
~~~

其中只有结构和编排能力属于 @luma/cockpit。标题样式、背景、中央组件、业务模块和分类内容均由应用提供。

### 2.3 分类与页面

- 一个驾驶舱可以包含多个分类。
- 分类名称、图标、顺序和可见性全部由应用配置。
- “研判、实况、预报、预警、预演、预案”只能作为应用示例，禁止写入 @luma/cockpit。
- 每个分类可以包含一个或多个页面。
- 页面可以新增、删除、复制、重命名、排序和切换。
- 每个页面拥有独立的左右布局配置。
- 页面可以选择应用已注册的中央组件。
- 分类与页面切换不能依赖固定数量或固定名称。

### 2.4 左右模块编排

- 左右区域分别配置，互不要求对称。
- 每个区域包含一个或多个列。
- 列数限制通过宿主参数传入，不在包内写死；建议默认允许 1 至 3 列。
- 每列可以配置宽度权重和高度权重。
- 每列包含一个或多个模块容器。
- 每个容器可以配置高度权重。
- 容器支持以下展示模式：
  - single：显示一个模块。
  - combined：多个模块在同一容器中同时展示。
  - tabs：多个模块共用一个容器，通过 Tab 切换。
- combined 模式内部支持横向或纵向排列。
- tabs 模式支持配置默认激活模块。
- 同一种业务模块允许在同一页面创建多个独立实例。
- 每个模块实例必须拥有稳定且唯一的 instanceId。
- 模块配置仅处理位置、尺寸、顺序、数量、标题和展示模式，不处理模块业务参数。

### 2.5 配置模式

- 配置能力由通用的 LumaCockpitDesigner 提供。
- Designer 不绑定具体承载方式；应用可以把它放入全屏覆盖层、独立路由或大尺寸抽屉。
- Luma Admin 示例默认使用全屏设计模式，避免复杂编排被限制在窄抽屉中。
- 配置界面包含：
  - 分类与页面管理区。
  - 应用已注册的中央组件列表。
  - 应用已注册的业务模块列表。
  - 左右区域列结构编辑区。
  - 容器展示模式与尺寸编辑区。
  - 实时预览区。
  - 重置、取消和保存操作。
- 保存采用显式保存、立即生效模式。
- 编辑期间使用草稿副本，点击取消不得污染当前运行配置。
- 保存失败时保留草稿并展示可重试错误。
- 包只抛出保存事件，不直接调用 HTTP 接口。

### 2.6 中央组件与模块联动

- @luma/cockpit 不定义地图概念。
- 包只提供中央组件容器、中央组件注册和通用消息总线。
- 应用可以注册地图、视频、三维场景、数字孪生或其他任意中央组件。
- 左右模块与中央组件通过通用消息通道双向联动。
- 消息 topic、payload 和业务语义由应用定义。
- @luma/cockpit 只负责消息投递、订阅、取消订阅和实例定向，不解释消息内容。

## 3. 架构与依赖方向

新增与 @luma/core 同级的可选包：

~~~text
packages/
├─ core/
├─ charts/
└─ cockpit/
~~~

禁止在 packages/core/src 下增加 cockpit 业务目录，也禁止让 @luma/core 依赖 @luma/cockpit。

建议依赖方向：

~~~text
@luma/icons
     ↑
@luma/core
     ↑
@luma/cockpit
     ↑
apps/luma-admin
apps/luma-cockpit
~~~

约束如下：

- @luma/cockpit 可以复用 @luma/core 的通用组件和组合式能力。
- @luma/core 不能反向依赖 @luma/cockpit。
- @luma/cockpit 不能依赖 @luma/charts。
- @luma/cockpit 不能依赖 ECharts、OpenLayers、Cesium、Mapbox、Leaflet 等可视化或地图运行时。
- @luma/cockpit 不能包含任何业务接口地址、业务状态码、业务权限码或行业模型。
- App 只能通过 @luma/cockpit 的公开包入口消费能力，不能直连 packages/cockpit/src。

## 4. @luma/cockpit 职责边界

### 4.1 必须由包提供的能力

#### 运行时

- 1920 × 1080 基准画布及等比缩放。
- 左侧、中央、右侧和分类导航的基础骨架。
- 分类与页面切换。
- 左右列和模块容器渲染。
- single、combined、tabs 三种容器模式。
- 中央组件和模块的动态解析。
- 模块实例生命周期管理。
- 配置加载、标准化、校验和版本迁移入口。
- 加载、空状态、缺失组件和渲染失败状态。
- 浏览器全屏能力。
- 键盘操作、焦点管理和基本无障碍语义。

#### 注册机制

- 注册、批量注册和注销中央组件。
- 注册、批量注册和注销业务模块。
- 按 type 查询定义。
- 查询所有可用定义，供 Designer 展示。
- 重复 type 检测。
- 缺失 type 的安全降级。

#### 配置设计器

- 分类与页面的通用编辑。
- 左右区域列数、列宽和列高编辑。
- 容器增删、排序和高度编辑。
- 模块实例增删、复制和排序。
- 容器模式切换。
- combined 排列方向配置。
- tabs 默认项配置。
- 中央组件选择。
- 配置预览、重置、取消和保存事件。

#### 通用消息机制

- topic 订阅和发布。
- 按 sourceId、targetId 或广播方式投递。
- 自动清理组件卸载后的订阅。
- 不解析业务 payload。

### 4.2 包内明确禁止的内容

以下内容不得出现在 @luma/cockpit 的源码、测试夹具以外的公开默认配置或生产依赖中：

- ECharts、OpenLayers、Cesium 等库的导入。
- echarts、openlayers、cesium 等写死的引擎联合类型。
- 地图中心点、缩放级别、图层、点位、飞行定位等地图专用协议。
- 雨量、预警、监控、人口、设备等业务模块。
- 研判、实况、预报、预警、预演、预案等固定分类。
- 固定行业标题、Logo、背景图和装饰素材。
- 业务接口请求、Token、状态码、字段映射。
- Admin 专用路由、权限码和会话逻辑。
- 任何应用业务组件目录的硬编码路径。
- 对宿主 import.meta.glob 路径的假设。

### 4.3 包级样式边界

包可以提供：

- 画布缩放和区域布局样式。
- 列、容器、Tab、空状态和设计器的基础样式。
- 可覆盖的 CSS 变量和语义 token。
- 键盘焦点、选中、拖放目标和禁用状态样式。

包不得提供：

- 固定行业蓝色科技风皮肤。
- 具体项目背景图、边框图片或字体。
- 固定 Logo 和标题装饰。
- 业务模块内部样式。

应用通过 CSS 变量、class 和插槽完成品牌定制。

## 5. 建议包目录

~~~text
packages/cockpit/
├─ package.json
├─ README.md
├─ vite.config.ts
├─ src/
│  ├─ index.ts
│  ├─ runtime/
│  │  ├─ LumaCockpit.vue
│  │  ├─ LumaCockpitCanvas.vue
│  │  ├─ LumaCockpitRegion.vue
│  │  ├─ LumaCockpitColumn.vue
│  │  ├─ LumaCockpitContainer.vue
│  │  ├─ LumaCockpitCenterHost.vue
│  │  └─ LumaCockpitWidgetHost.vue
│  ├─ designer/
│  │  ├─ LumaCockpitDesigner.vue
│  │  ├─ CockpitComponentLibrary.vue
│  │  ├─ CockpitLayoutEditor.vue
│  │  └─ CockpitPropertiesPanel.vue
│  ├─ registry/
│  │  ├─ createCockpitRegistry.ts
│  │  └─ types.ts
│  ├─ messaging/
│  │  ├─ createCockpitMessageBus.ts
│  │  └─ types.ts
│  ├─ config/
│  │  ├─ defaults.ts
│  │  ├─ normalize.ts
│  │  ├─ validate.ts
│  │  └─ migrate.ts
│  ├─ composables/
│  │  ├─ useCockpit.ts
│  │  └─ useCockpitContext.ts
│  ├─ types/
│  │  └─ index.ts
│  └─ style/
│     └─ index.scss
└─ tests/
~~~

可以在实现时合并过小文件，但运行时、Designer、注册表、消息和配置逻辑必须保持职责分离。

## 6. 公开配置模型

以下接口名称可以根据仓库规范微调，但语义不得改变。

~~~ts
export interface CockpitConfig {
  schemaVersion: number
  id: string
  title: string
  activeCategoryId?: string
  categories: CockpitCategoryConfig[]
}

export interface CockpitCategoryConfig {
  id: string
  label: string
  icon?: string
  order?: number
  visible?: boolean
  activePageId?: string
  pages: CockpitPageConfig[]
}

export interface CockpitPageConfig {
  id: string
  title: string
  order?: number
  center?: CockpitCenterInstance
  left: CockpitRegionConfig
  right: CockpitRegionConfig
}

export interface CockpitCenterInstance {
  id: string
  type: string
}

export interface CockpitRegionConfig {
  columns: CockpitColumnConfig[]
}

export interface CockpitColumnConfig {
  id: string
  width: number
  height?: number
  containers: CockpitContainerConfig[]
}

export type CockpitContainerMode = 'single' | 'combined' | 'tabs'
export type CockpitCombinedDirection = 'horizontal' | 'vertical'

export interface CockpitContainerConfig {
  id: string
  height: number
  mode: CockpitContainerMode
  direction?: CockpitCombinedDirection
  activeWidgetId?: string
  widgets: CockpitWidgetInstance[]
}

export interface CockpitWidgetInstance {
  id: string
  type: string
  title?: string
  visible?: boolean
}
~~~

配置约束：

- schemaVersion 初版为 1。
- 所有 id 在各自父级范围内唯一；模块 instanceId 建议在整个驾驶舱内唯一。
- width 和 height 使用正数权重，不存储运行时像素。
- 运行时根据同级权重计算百分比。
- 空列、空容器和未注册 type 必须可安全渲染。
- single 模式只允许一个可见模块；Designer 保存前应校验。
- tabs 模式的 activeWidgetId 不存在时，回退到第一个可见模块。
- 配置对象必须保持 JSON 可序列化。
- 配置模型不得增加地图或具体业务字段。

## 7. 注册表公开接口

### 7.1 定义类型

~~~ts
import type { Component } from 'vue'

export interface CockpitCenterDefinition {
  type: string
  label: string
  description?: string
  group?: string
  icon?: string
  thumbnail?: string
  component: Component | (() => Promise<unknown>)
}

export interface CockpitWidgetDefinition {
  type: string
  label: string
  description?: string
  group?: string
  icon?: string
  thumbnail?: string
  component: Component | (() => Promise<unknown>)
}
~~~

group 仅用于应用自定义的组件库分组过滤，包不得预设固定分组。

### 7.2 注册器

~~~ts
export interface CockpitRegistry {
  registerCenter(definition: CockpitCenterDefinition): void
  registerCenters(definitions: CockpitCenterDefinition[]): void
  unregisterCenter(type: string): void
  resolveCenter(type: string): CockpitCenterDefinition | undefined
  listCenters(): readonly CockpitCenterDefinition[]

  registerWidget(definition: CockpitWidgetDefinition): void
  registerWidgets(definitions: CockpitWidgetDefinition[]): void
  unregisterWidget(type: string): void
  resolveWidget(type: string): CockpitWidgetDefinition | undefined
  listWidgets(): readonly CockpitWidgetDefinition[]
}

export function createCockpitRegistry(): CockpitRegistry
~~~

行为要求：

- type 不能为空。
- 同一注册器内 type 不允许重复注册；重复时抛出可定位错误。
- 中央组件 type 和模块 type 使用独立命名空间。
- list 方法返回稳定顺序，不暴露内部可变数组。
- 异步组件必须支持路由级或组件级代码分割。

## 8. 组件运行时协议

### 8.1 渲染上下文

包向中央组件和业务模块注入统一上下文：

~~~ts
export type CockpitRenderMode = 'runtime' | 'design'

export interface CockpitBaseContext {
  cockpitId: string
  categoryId: string
  pageId: string
  instanceId: string
  mode: CockpitRenderMode
  messages: CockpitMessageBus
}

export type CockpitCenterContext = CockpitBaseContext
export type CockpitWidgetContext = CockpitBaseContext
~~~

上下文只提供框架信息和消息总线，不提供业务数据。

### 8.2 组件接入方式

运行时应同时支持以下接入方式：

- 通过 props 向已注册组件传入 context。
- 通过 provide/inject 提供 useCockpitContext。

推荐业务组件使用组合式 API：

~~~ts
const context = useCockpitContext()

context.messages.publish({
  topic: 'application-defined-topic',
  sourceId: context.instanceId,
  payload: applicationPayload,
})
~~~

### 8.3 组件实例隔离

- 相同 type 的多个模块必须创建不同 Vue 组件实例。
- 组件 key 必须使用实例 id，不能只使用 type。
- Tab 切换时默认保留已挂载模块状态；是否缓存可以通过运行时选项关闭。
- 页面切换后是否保留页面组件状态由 LumaCockpit 的 cachePages 参数控制。
- 包不得把某一业务模块实现为全局单例。

## 9. 通用消息总线

~~~ts
export interface CockpitMessage<T = unknown> {
  topic: string
  sourceId: string
  targetId?: string
  payload?: T
}

export type CockpitMessageHandler<T = unknown> =
  (message: CockpitMessage<T>) => void

export interface CockpitMessageBus {
  publish<T = unknown>(message: CockpitMessage<T>): void
  subscribe<T = unknown>(
    topic: string,
    handler: CockpitMessageHandler<T>,
    options?: {
      targetId?: string
    },
  ): () => void
  clearInstance(instanceId: string): void
}
~~~

消息要求：

- topic 是应用定义的普通字符串。
- 未设置 targetId 时为广播。
- 设置 targetId 时仅目标实例处理。
- 业务组件卸载时清理其订阅。
- 单个订阅异常不能中断其他订阅者。
- 包不得记录或序列化业务 payload。
- 包不得定义 map、warning、rainfall 等业务 topic。

## 10. 运行时组件 API

建议主组件接口：

~~~vue
<LumaCockpit
  v-model:active-category-id="activeCategoryId"
  v-model:active-page-id="activePageId"
  :config="config"
  :registry="registry"
  :base-width="1920"
  :base-height="1080"
  :cache-pages="true"
  @configure="openDesigner"
  @config-error="handleConfigError"
/>
~~~

建议提供插槽：

- header-prefix：标题左侧扩展。
- header-title：自定义标题。
- header-actions：全屏、返回等应用操作。
- category-item：自定义分类导航项。
- empty-center：未配置中央组件。
- missing-center：中央组件 type 未注册。
- empty-container：空模块容器。
- missing-widget：模块 type 未注册。
- widget-title：自定义模块标题。
- error：运行时整体错误状态。

包不得在默认 header-actions 中加入 Admin 返回、业务筛选或地图操作按钮。

## 11. Designer 行为规格

### 11.1 草稿管理

- Designer 接收当前 CockpitConfig。
- 打开时深拷贝为独立草稿。
- 所有编辑仅修改草稿。
- 取消时丢弃草稿。
- 重置时恢复本次打开 Designer 时的原始配置。
- 保存前执行标准化和校验。
- 保存成功由宿主更新正式 config。
- 保存失败时 Designer 保持打开。

### 11.2 分类与页面

- 支持新增、删除、复制、重命名和排序分类。
- 支持新增、删除、复制、重命名和排序页面。
- 删除当前分类或页面后自动选择相邻可用项。
- 删除操作需要确认。
- 至少保留一个分类和一个页面；是否允许空驾驶舱由宿主约束决定。
- 图标选择由应用插槽或应用提供的图标选项完成，不内置业务图标。

### 11.3 中央组件

- Designer 从 registry.listCenters 获取可选项。
- 支持按应用定义的 group 过滤。
- 支持替换和清空当前页面中央组件。
- 中央组件预览失败时不影响左右布局编辑。
- Designer 不显示地图引擎特有参数。

### 11.4 左右区域

- 左右区域独立设置列数。
- 支持新增、删除和排序列。
- 支持修改列宽权重和可选列高权重。
- 同一区域列宽由运行时归一化，不要求用户手动保证总和等于 100。
- 删除非空列时要求确认，并允许先把容器移动到其他列。

### 11.5 容器与模块

- 支持在列内新增、删除、复制和排序容器。
- 支持修改容器高度权重。
- 支持切换 single、combined、tabs。
- combined 支持横向和纵向。
- 支持从组件库添加模块实例。
- 支持拖拽排序，同时必须提供键盘或按钮排序替代方式。
- 支持同一种模块添加多个实例。
- tabs 模式支持调整 Tab 顺序和默认激活项。
- 包不展示模块业务属性配置表单。

### 11.6 保存事件

~~~ts
interface CockpitDesignerSavePayload {
  config: CockpitConfig
}
~~~

Designer 发出 save 后由宿主持久化。包不得：

- 直接调用 fetch。
- 假设 REST 路径。
- 写入 localStorage 作为正式持久化方案。
- 判断业务状态码。
- 绑定 Admin 会话。

## 12. 在 apps/luma-admin 中开发

### 12.1 目录建议

~~~text
apps/luma-admin/src/cockpit/
├─ centers/
│  ├─ application-center-a/
│  │  ├─ Center.vue
│  │  └─ index.ts
│  └─ application-center-b/
├─ widgets/
│  ├─ business-widget-a/
│  │  ├─ Widget.vue
│  │  ├─ index.ts
│  │  └─ thumbnail.webp
│  └─ business-widget-b/
├─ config/
│  ├─ defaults.ts
│  └─ types.ts
├─ messages/
│  └─ topics.ts
├─ api/
│  └─ cockpit.ts
├─ registry.ts
└─ CockpitView.vue
~~~

这些目录属于 App 业务层，不得移动到 @luma/cockpit。

### 12.2 Header 入口

在 AppHeaderActions 增加一个有明确 title 和 aria-label 的图标按钮，并新增 openCockpit 事件。

App.vue 处理事件并跳转到驾驶舱路由。入口是否展示由应用权限决定，建议示例权限：

~~~text
cockpit:view
cockpit:edit
~~~

权限字符串属于 Admin 示例，不进入 @luma/cockpit。

### 12.3 Admin 路由

新增静态、按需加载的驾驶舱路由，建议：

~~~ts
{
  path: '/cockpit/:cockpitId?',
  name: 'AdminCockpit',
  component: () => import('../cockpit/CockpitView.vue'),
  meta: {
    layout: 'public',
    hideInMenu: true,
    hideInTab: true,
    authority: ['cockpit:view'],
    title: '驾驶舱',
  },
}
~~~

要求：

- layout: public 只用于绕过 Admin 壳层。
- 路由继续经过当前认证和权限守卫。
- 未登录访问时跳转登录，登录后返回原驾驶舱地址。
- 没有查看权限时进入 403。
- 没有编辑权限时隐藏配置入口，运行态仍可正常使用。

### 12.4 中央业务组件开发

中央组件可以引入任意 App 依赖。例如某个项目可以自行安装 ECharts、OpenLayers 或 Cesium，但这些依赖只能出现在 App 的 package.json 和源码中。

示例定义：

~~~ts
import type { CockpitCenterDefinition } from '@luma/cockpit'

export const centerDefinition: CockpitCenterDefinition = {
  type: 'application-center-a',
  label: '应用中央视图 A',
  group: 'application-centers',
  component: () => import('./Center.vue'),
}
~~~

中央组件负责：

- 初始化和销毁自己的第三方运行时。
- 加载自己的底图、场景或业务数据。
- 订阅应用定义的联动消息。
- 把点击、选择等事件发布到消息总线。
- 处理容器尺寸变化。
- 在卸载时释放监听器、WebGL、定时器和网络请求。

@luma/cockpit 不负责上述业务行为。

### 12.5 业务模块开发

每个业务模块遵循固定目录约定：

~~~text
widgets/<widget-type>/
├─ Widget.vue
├─ index.ts
└─ thumbnail.webp
~~~

index.ts 只导出模块定义：

~~~ts
import type { CockpitWidgetDefinition } from '@luma/cockpit'

export const widgetDefinition: CockpitWidgetDefinition = {
  type: 'business-widget-a',
  label: '业务模块 A',
  group: 'application-group',
  thumbnail: new URL('./thumbnail.webp', import.meta.url).href,
  component: () => import('./Widget.vue'),
}
~~~

Widget.vue 负责：

- 使用应用现有 request client 请求业务数据。
- 处理自己的 loading、empty 和 error 状态。
- 根据容器尺寸调整展示密度。
- 通过 useCockpitContext 参与联动。
- 在多实例场景下使用 instanceId 隔离本地状态。
- 清理轮询、订阅和未完成请求。

业务模块不得要求 @luma/cockpit 了解其接口、字段和业务枚举。

### 12.6 编译期自动注册

组件目录扫描必须发生在 App：

~~~ts
import {
  createCockpitRegistry,
  type CockpitCenterDefinition,
  type CockpitWidgetDefinition,
} from '@luma/cockpit'

const registry = createCockpitRegistry()

const centerModules = import.meta.glob<{
  centerDefinition: CockpitCenterDefinition
}>('./centers/*/index.ts', { eager: true })

const widgetModules = import.meta.glob<{
  widgetDefinition: CockpitWidgetDefinition
}>('./widgets/*/index.ts', { eager: true })

registry.registerCenters(
  Object.values(centerModules).map(module => module.centerDefinition),
)

registry.registerWidgets(
  Object.values(widgetModules).map(module => module.widgetDefinition),
)

export { registry as adminCockpitRegistry }
~~~

@luma/cockpit 只能接收扫描结果，不得写死宿主目录。

### 12.7 分类与页面配置

分类配置由 Admin API 或应用默认配置提供：

~~~ts
export const defaultCockpitConfig: CockpitConfig = {
  schemaVersion: 1,
  id: 'admin-demo-cockpit',
  title: '应用驾驶舱',
  categories: [
    {
      id: 'application-category-a',
      label: '分类 A',
      pages: [
        {
          id: 'page-a',
          title: '页面 A',
          center: {
            id: 'center-instance-a',
            type: 'application-center-a',
          },
          left: { columns: [] },
          right: { columns: [] },
        },
      ],
    },
  ],
}
~~~

示例名称必须保持中性。实际公司项目可以替换成任意业务分类。

### 12.8 App 业务消息

应用集中维护 topic 和 payload 类型：

~~~ts
export const cockpitTopics = {
  businessItemSelected: 'application:item-selected',
  centerSelectionChanged: 'application:center-selection-changed',
} as const

export interface BusinessItemSelectedPayload {
  id: string
}
~~~

包内不得导入该文件。中央组件和业务模块共同依赖应用消息协议。

### 12.9 配置持久化

Admin 提供自己的 API 适配层：

~~~ts
export interface CockpitConfigRepository {
  load(id: string): Promise<CockpitConfig>
  save(config: CockpitConfig): Promise<CockpitConfig>
}
~~~

建议 Admin 示例在 luma-mock-api 中增加对应接口，用于验证真实 HTTP 加载和保存流程。

接口响应必须在 App adapter 中转换为标准 CockpitConfig，后端字段和状态码不得进入 @luma/cockpit。

保存流程：

1. Designer 发出标准配置。
2. CockpitView 调用 App repository。
3. App 完成字段转换和 HTTP 请求。
4. 保存成功后用服务端返回配置替换当前运行配置。
5. 保存失败时保持当前正式配置与 Designer 草稿。

### 12.10 Admin 样式与资源

Admin 自行提供：

- 驾驶舱品牌色和背景。
- 标题装饰、Logo、字体和模块边框。
- 中央组件和模块缩略图。
- 业务图标。
- 第三方运行时 CSS 与静态资源路径。

应通过 @luma/cockpit 提供的 CSS 变量覆盖基础样式，不修改包内组件来适配某个项目。

## 13. 开发独立 apps/luma-cockpit

### 13.1 目标

新增 apps/luma-cockpit，证明驾驶舱能力可以脱离 Admin 单独构建和部署。

该应用不是 @luma/cockpit 的一部分，也不能依赖 apps/luma-admin 的源码。

### 13.2 建议目录

~~~text
apps/luma-cockpit/
├─ package.json
├─ index.html
├─ vite.config.ts
└─ src/
   ├─ main.ts
   ├─ App.vue
   ├─ centers/
   ├─ widgets/
   ├─ messages/
   ├─ services/
   ├─ registry.ts
   └─ styles/
~~~

### 13.3 独立应用职责

- 安装并通过公开入口消费 @luma/cockpit。
- 创建自己的 registry。
- 注册自己的中央组件和业务模块。
- 提供自己的分类与页面配置。
- 决定是否需要登录和权限。
- 决定从 HTTP、环境变量或静态文件加载配置。
- 提供自己的保存实现。
- 配置第三方依赖的代码分割和静态资源。
- 提供自己的错误页、品牌和部署路径。

### 13.4 与 Admin 共享业务组件

禁止让 apps/luma-cockpit 直接 import apps/luma-admin/src。

如果真实业务项目需要让 Admin 和独立驾驶舱共享同一批中央组件或模块，应在该业务项目中创建私有领域包，例如：

~~~text
@company/cockpit-widgets
@company/cockpit-centers
~~~

这些私有包可以依赖 @luma/cockpit，但不得并入公开的 @luma/cockpit。Luma 仓库中的示例 App 可以各自提供最小中性示例，不需要建立公共业务包。

## 14. 第三方组件与性能要求

虽然 @luma/cockpit 不依赖地图或图表库，但 App 需要满足：

- 中央组件和业务模块采用异步组件。
- 重型第三方库必须独立分包。
- 未注册或未使用的中央组件不得进入首屏同步执行路径。
- 切换中央组件时正确销毁旧实例。
- WebGL 和 Canvas 组件不可因页面缩放反复创建。
- ResizeObserver 或窗口缩放回调需要节流。
- 轮询在页面隐藏、Tab 非激活或组件卸载时暂停。
- 1920 × 1080 画布缩放使用 transform，避免频繁重排。
- 用户启用 prefers-reduced-motion 时减少非必要动画。

Cesium、OpenLayers、ECharts 等具体分包名称和资源策略由 App 配置，不进入 @luma/cockpit 的发布检查规则。

## 15. 错误与降级行为

运行时必须处理：

- 配置加载失败：展示应用可覆盖的错误插槽和重试事件。
- 配置为空：展示空驾驶舱状态。
- 分类为空：不渲染分类导航。
- 页面为空：展示空页面状态。
- 中央组件未注册：展示缺失 type，不使整个驾驶舱崩溃。
- 模块未注册：在对应位置展示缺失模块占位。
- 异步组件加载失败：展示重试入口。
- 单个模块渲染异常：隔离在模块容器内。
- 保存失败：不覆盖正式配置。
- 非法尺寸权重：标准化为安全默认值并报告配置问题。
- 重复 id：校验失败，不允许保存。
- 当前分类或页面不存在：回退到第一个可见项。

错误文案应可通过 props、插槽或应用层包装覆盖。

## 16. 无障碍与交互要求

- Header 图标按钮必须包含 title 和 aria-label。
- 分类导航使用可识别的导航语义。
- tabs 模式符合 Tab、TabList、TabPanel 键盘交互。
- 设计器拖拽操作必须提供上移、下移、左移、右移等按钮替代。
- 所有操作按钮拥有可见焦点状态。
- 删除、重置等危险操作需要确认。
- 保存期间禁用重复提交并显示加载状态。
- 配置错误应关联到对应字段或结构节点。
- 不能只依赖颜色表示选中、错误或状态。
- 基础交互目标不小于 44 × 44 CSS 像素。

## 17. 测试要求

### 17.1 @luma/cockpit 单元与组件测试

至少覆盖：

- 注册和解析中央组件。
- 注册和解析业务模块。
- 重复 type 拒绝。
- 分类与页面切换。
- 当前分类和页面失效后的回退。
- 左右不同列数和权重渲染。
- single、combined、tabs 三种模式。
- 同 type 多实例使用不同 instanceId。
- tabs 默认项回退。
- 缺失中央组件和模块的降级。
- 配置标准化、校验和 schemaVersion。
- Designer 草稿、取消、重置和保存。
- 消息广播、定向发送、取消订阅和异常隔离。
- 组件卸载后的订阅清理。
- 画布缩放计算。
- 键盘导航和必要 aria 属性。

测试中使用 StubCenter 和 StubWidget，不引入任何地图或业务库。

### 17.2 Admin 集成测试

至少覆盖：

- 有权限用户看到 Header 驾驶舱入口。
- 无权限用户看不到入口。
- 未登录访问驾驶舱会跳转登录。
- 登录后返回原驾驶舱 URL。
- 驾驶舱路由不显示 Admin Layout。
- 查看权限和编辑权限相互独立。
- Admin registry 能扫描并注册应用组件。
- 配置能从 Mock API 加载。
- 保存后运行态立即更新。
- 保存失败时正式配置不变。
- 返回 Admin、全屏和退出配置模式正常。

### 17.3 独立应用测试

至少覆盖：

- apps/luma-cockpit 可以独立 typecheck 和 build。
- 独立应用不依赖 apps/luma-admin 源码。
- 能注册自己的中央组件和模块。
- 能加载并渲染标准 CockpitConfig。
- 能按自己的方式保存或只读运行。

### 17.4 E2E 验收

至少完成以下浏览器流程：

1. 登录 Admin。
2. 从 Header 图标进入驾驶舱。
3. 切换分类和页面。
4. 进入设计模式。
5. 调整左右列数、宽度和模块顺序。
6. 把多个模块设为 combined。
7. 把多个模块设为 tabs 并切换 Tab。
8. 添加同 type 的第二个实例。
9. 保存并退出设计模式。
10. 刷新页面后确认配置持久化。
11. 验证左右模块与 StubCenter 的双向消息。
12. 返回 Admin。

## 18. 构建、发布与仓库检查

实现时需要同步更新：

- 根 package.json 的 build、typecheck、test 和 pack:dry-run。
- scripts/check-release-boundaries.mjs，加入 @luma/cockpit 发布字段和依赖边界。
- scripts/check-release-artifacts.mjs，检查 cockpit 的 ESM、CJS、类型和样式产物。
- scripts/check-npm-package-names.mjs，加入 @luma/cockpit。
- README.md 的工作区和依赖方向。
- docs/architecture.md。
- docs/package-boundaries.md。
- docs/release-checklist.md。

@luma/cockpit 建议公开以下入口：

~~~text
@luma/cockpit
@luma/cockpit/runtime
@luma/cockpit/designer
@luma/cockpit/registry
@luma/cockpit/style.css
~~~

runtime 和 designer 应保持独立构建入口，确保只读驾驶舱应用可以避免同步加载 Designer。

## 19. 推荐实施顺序

1. 建立 packages/cockpit 包、构建入口和发布边界。
2. 定义配置、注册表、消息和渲染上下文类型。
3. 实现配置标准化、校验和注册表。
4. 实现基础画布、左右区域、中央 Host 和模块 Host。
5. 实现分类、页面及容器模式。
6. 实现消息总线和 useCockpitContext。
7. 实现 Designer 草稿和布局编辑能力。
8. 在 Admin 添加路由、Header 入口、权限和 Mock API。
9. 在 Admin App 中添加中性 StubCenter 与 StubWidget 验证注册机制。
10. 新增独立 apps/luma-cockpit。
11. 完成单元、集成和 E2E 测试。
12. 更新构建、发布检查和文档。

每一阶段先通过对应测试，再进入下一阶段。不得先加入地图或具体业务模块来反向定义通用接口。

## 20. 完成标准

只有同时满足以下条件才视为完成：

- @luma/cockpit 源码不包含具体地图、行业模块和固定业务分类。
- App 可以不修改包源码注册任意中央组件和模块。
- App 可以不修改包源码定义任意数量和名称的分类及页面。
- 左右区域可以配置列数、列宽、列高、容器高度和模块数量。
- single、combined、tabs 均正常工作。
- 相同模块支持多个独立实例。
- Designer 只编辑布局，不编辑模块业务参数。
- 消息总线支持中央组件与模块双向通信，但不理解业务消息。
- Admin 独立路由集成完成并继续受认证权限保护。
- 独立 apps/luma-cockpit 能单独构建运行。
- @luma/cockpit 不依赖 ECharts、OpenLayers、Cesium 或 @luma/charts。
- 全量 test、typecheck、build、release:boundaries 和 release:artifacts 通过。

## 21. 实现者必须遵守的最终原则

在判断代码应放入 @luma/cockpit 还是 App 时，使用以下规则：

> 如果能力只描述容器、布局、组件注册、配置编辑或消息传递，可以进入 @luma/cockpit。

> 如果代码知道中央区域渲染的具体技术、模块展示的具体数据、分类的业务名称或接口的具体字段，则必须留在 App。

当一个需求需要通过增加 if projectType、固定字符串、固定业务枚举或导入具体第三方地图库才能实现时，说明它不属于 @luma/cockpit。
