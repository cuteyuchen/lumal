# @lumal/vite

## 0.0.7-beta (2026-10-26)

### Minor Changes

- 增加属性白名单/黑名单、选择器排除、声明忽略标记与最小尺寸开关。
- `fontSize: false` 同时保护 `font-size`、`font`、`line-height`；默认保护物理和逻辑最小尺寸。
- 使用独立 `inlineStyles` 开关，经 Vue 模板 AST 与 CSS AST 转换静态行内样式及可分析的绑定对象/数组，不扫描脚本或其他模板属性。
- 识别原子化任意值类名对应的 CSS 规则，保留视口变量、动态尺寸及已有适配表达式，避免重复转换。
- 保留来源和第三方依赖边界、SCSS source map 与既有 PostCSS 配置；修复混合 SCSS 连带阻止同 SFC 独立 CSS 块转换的问题。
- 修复行内样式的静态值、属性存在和祖先选择器排除，绑定值不求值；新增独立 tarball 消费者与双平台门禁。

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
