# @lumal/vite

## 0.0.6-beta (2026-10-25)

### Minor Changes

- 新增默认关闭的 createViewportTransformPlugin / createViewportPostcssPlugin，显式限定 CSS 转换范围。
- Dev/Build 使用同一转换逻辑，默认排除依赖；支持显式依赖白名单、字体和自定义属性策略。
- 保护 Windows/pnpm 路径、SFC/SCSS/CSS 来源边界，不转换脚本普通数字、内联 style 或 URL。
- 工作区 alias 增加 @lumal/viewport；公共包版本同步为 0.0.6-beta。

## 0.0.5-beta (2026-10-20)

### Patch Changes

- 新增 Vben 兼容层 v5、v5/router、legacy 和 style.css 的源码/产物 alias，并验证最长子入口优先。
- 与 fixed-group 公共包同步为 0.0.5-beta，无新增运行时依赖。

## 0.0.4-beta (2026-10-20)

### Patch Changes

- 工作区 alias 补齐 @lumal/icons/morph 的源码与 ESM 产物入口，并增加映射回归测试。
- 与其他 Lumal 公共包保持同版。

## 0.0.3-beta (2026-10-16)

### Patch Changes

- 工作区 alias 补齐 `@lumal/core/minimal` 的源码与产物入口。
- 组件 resolver 补齐 Breadcrumb、GlobalSearch、AccessControl、ThemeSettingsPanel，并对照公开组件清单验收。

## 0.0.2-beta (2026-08-01)

### Minor Changes

- Add the Vue 3 cockpit visualization component package and expose source and distribution aliases for its root and stylesheet entries.
