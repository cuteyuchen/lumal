# @lumal/cockpit

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
