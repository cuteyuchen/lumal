# @lumal/cockpit

## 0.1.0-beta (2026-10-28)

- Breaking：删除 `CockpitViewportMode`、`viewportMode`、`useCanvasScale` 及整画布适配分支。
- 面板/列宽/间距按项目设计宽度换算，百分比行高和业务布局语义不变。
- DataV 嵌套不再二次缩放，Designer 继续保存原始设计数值。
- 纳入 Designer 布局名称即时输入与最终保存值同步修复，保留草稿隔离和取消不保存。

## 0.0.7-beta (2026-10-26)

### Patch Changes

- 修复 Designer 布局名称输入被旧值覆盖及保存旧名称的问题，保留草稿隔离、取消和保存前提交。
- 同步 Core、图标与视口依赖至 0.0.7-beta；Runtime/Designer 隔离及 external 缩放契约不变。

## 0.0.6-beta (2026-10-25)

### Patch Changes

- 复用 @lumal/viewport 的纯缩放算法与尺寸监听，保留 computeCanvasScale 和设计器坐标契约。
- external 模式由外层负责缩放，不重复注册内部尺寸监听；runtime 与 Designer 继续隔离。
- 同步 Core、图标及视口依赖至 0.0.6-beta。

## 0.0.5-beta (2026-10-20)

### Patch Changes

- 同步 Core、图标依赖与 fixed-group 版本至 0.0.5-beta，不增加驾驶舱强制依赖。

## 0.0.4-beta (2026-10-20)

### Patch Changes

- 同步 Core 与图标依赖至 0.0.4-beta，保持 runtime/designer 分离及地图、图表引擎由应用接入的边界。

## 0.0.3-beta (2026-10-16)

### Patch Changes

- 注册表使用浅响应式 Map，动态注册和移除会更新已求值的 Host，组件定义不做深代理。
- 消息总线隔离异步订阅的 Promise rejection，增加 `onError` 错误观察入口。
- 同步 Core 与图标依赖版本，保持地图和图表引擎由应用按需接入。

## 0.0.2-beta (2026-08-01)

### Minor Changes

- Upgrade cockpit configuration and designer/runtime behavior to schema v3, and export the reusable `LumalCockpitCard` component and card contracts.

### Patch Changes

- Fix the runtime center region collapsing to a 2px sliver. The v3 grid rule redeclared `.lumal-cockpit-canvas__center` without restating its absolute positioning, so the later rule won on equal specificity and the center pane shrank to its content height instead of filling the canvas body.
