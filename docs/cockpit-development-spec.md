# Luma 驾驶舱 v3 开发规格

## 1. 职责边界

`@luma/cockpit` 是通用布局和组件编排框架：

- 提供 v3 配置模型、左右区域运行时、Designer、模块注册表和消息总线。
- 不提供分类、页面、中央组件注册表或中央组件业务配置。
- 不依赖 ECharts、Cesium、OpenLayers、地图 SDK 或业务请求模块。
- 不包含固定行业名称、业务图片、Logo、背景和皮肤。

消费应用负责：

- 布局导航和 `activeLayoutId`。
- 中心组件及其数据、第三方运行时和销毁逻辑。
- 业务模块、可选缩略图、主题皮肤、权限、API 和持久化。
- 决定 Designer 使用全屏、弹窗、抽屉或独立路由承载。

## 2. 配置模型

```ts
interface CockpitConfig {
  schemaVersion: 3
  id: string
  title: string
  activeLayoutId?: string
  layouts: CockpitLayoutConfig[]
}

interface CockpitLayoutConfig {
  id: string
  title: string
  left: CockpitRegionConfig
  right: CockpitRegionConfig
}

interface CockpitRegionConfig {
  columns: Array<{ id: string, width: number }>
  rows: CockpitGridRowConfig[]
}

interface CockpitGridRowConfig {
  id: string
  height: number
  mode: 'grid' | 'tabs'
  cells: CockpitGridCellConfig[]
  widgets: CockpitWidgetInstance[]
  activeWidgetId?: string
}
```

约束：

- 新布局默认左右各一行一列空槽。
- 列宽保存为正整数像素，不设置框架上限。
- 行高保存为百分比，编辑后按原比例自动分配，其总和始终为 `100%`。
- `grid` 行的 cell 数必须与列数一致，每个 cell 最多一个模块。
- `tabs` 行跨满全部列，`cells` 为空，模块按 `widgets` 顺序显示为 Tab。
- 模块实例 id 在整个配置中唯一；相同 type 可以创建多个实例。
- v1/v2 不迁移，消费应用遇到旧持久化配置时丢弃并创建 v3 默认配置。

## 3. 运行时

- `LumaCockpit` 使用 `v-model:activeLayoutId`，不渲染内置布局导航。
- 中心通过 `#center="{ context, layout }"` 提供，位于全宽底层画布。
- 左右区域定位在中心内容上层两侧，宽度为区域各列像素宽度之和。
- 普通模块和 Tab 行各使用一个视觉 Card；Tab 行只显示激活模块，但保留全部模块实例。
- Tab 默认项来自 `activeWidgetId`，失效时回退到第一个模块。
- `scale` 模式使用基准画布等比缩放；`vwvh` 模式把设计尺寸转换为视口单位。
- 框架提供 context prop 和 `useCockpitContext()`，上下文只包含框架 id、模式和消息总线。

## 4. Designer

### 布局管理

- 顶部提供布局选择、重命名、新增、复制和删除。
- 至少保留一个布局；删除当前布局后选择相邻布局。
- 所有修改发生在深拷贝草稿中，取消不污染运行配置。
- 重置恢复本次打开 Designer 时的配置。
- 保存前执行标准化和校验，成功事件为 `{ config, layout }`。

### 左右区域

- 左右区域完全独立，不提供同时修改两侧的全局行列控制。
- 每侧区域头部常驻展示行数、列数及各列像素宽度设置，无需悬浮或点击展开。
- Designer 按列宽比例预览，运行时使用真实像素宽度。
- 每行头部常驻展示百分比高度和是否合并为 Tab 行的设置。
- 缩减会删除模块时拒绝操作，要求先迁移或删除模块。

### Tab 行

- 一个合并行只显示一个 Tab Card。
- Tab 头部支持激活、拖拽排序、选择移动和删除；主体只实时预览激活模块。
- 普通行合并时按从左到右顺序转为 Tab。
- 拖入或移动到 Tab 行的新模块立即激活。
- 删除非激活 Tab 保持当前项；删除激活项切换到相邻项。
- Tab 数超过列数时禁止解除合并，避免模块丢失。

### 拖拽和键盘

- 库模块使用 Sortable clone，不从模块库删除定义。
- 已放置模块支持跨侧、跨行、普通槽与 Tab 行之间移动。
- 占用普通槽必须确认替换。
- 模块库按钮可以选择待添加模块，并连续创建多个实例。
- 已放置模块的移动按钮选择移动源；空槽、占用槽和 Tab 行提供明确目标按钮。
- 已放置模块移动成功后清除移动选择，按 `Escape` 可随时取消。
- 选中状态必须同时使用文字、ARIA 和焦点样式，不能只依赖颜色。

### 实时预览

- Designer 装配区仅保留左右两侧网格，不再渲染中央大屏预览。
- 已放置模块共享设计态消息总线，可验证双向联动。
- 模块库预览使用独立总线，不能参与当前布局联动。
- 注册定义存在 `thumbnail` 时显示消费方图片，否则实时渲染组件。
- 单个预览异常由错误边界隔离，不阻断布局编辑。

## 5. 主题和资源

- 包提供布局、空状态、拖放、焦点和基础 Element Plus 结构样式。
- 深浅主题的具体颜色、标题背景、Card 和业务组件样式由消费应用提供。
- 包与示例不得复制其他项目的地图、模块截图或业务素材。
- Designer 面向桌面大屏，不实现移动端布局。

## 6. 验收要求

- 单元测试覆盖配置标准化、左右独立调整、行高分配、缩减保护、Tab 合并/解除和激活项维护。
- 组件测试覆盖单 Card Tab、列宽比例、中心设计态上下文、共享消息总线和键盘移动替换。
- E2E 覆盖库模块复制、跨区域移动、替换确认、Tab 切换、保存持久化及中心/模块联动。
- 浏览器检查 `1440px`、`1263×793`、`1024px` 的深浅主题，不要求移动端。
- `@luma/cockpit`、独立应用和 Admin 必须通过测试、类型检查和生产构建。
