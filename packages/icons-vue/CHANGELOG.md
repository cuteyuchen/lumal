# @lumal/icons-vue

## 0.0.6-beta (2026-10-25)

### Patch Changes

- 同步内部图标依赖与十包 fixed-group 至 0.0.6-beta，保持既有公开 API 和静态加载边界。

## 0.0.5-beta (2026-10-20)

### Patch Changes

- 同步内部图标依赖和 fixed-group 版本至 0.0.5-beta，保持现有公开 API。

## 0.0.4-beta (2026-10-20)

### Minor Changes

- LumalIcon 增加 morph 和 morphSpring，复用通用转换并动态加载官方 Vue 绑定；SSR、减少动画或加载失败时保留静态图标。
- 图标选择器及弹窗公开 group-select 插槽与类型，允许消费应用接入 UI 分组控件，不在图标包中依赖 Element Plus。

### Patch Changes

- 修复名称换行、弹窗分页与尺寸布局，补充选择回写、组件复用和动画清理测试。
- 同步 @lumal/icons 至 0.0.4-beta，保持静态图标不加载 Morphicons 引擎。

## 0.0.3-beta (2026-10-16)

### Patch Changes

- 修复直接传入 component、Iconify 和 local-svg 图标定义时的分支解析。
- 图标选择弹窗增加 Teleport、键盘焦点约束与焦点恢复，并使用 useTemplateRef。
- 明确 SVG 仅接受可信静态资源，格式校验不等于安全净化。

## 0.0.2-beta (2026-08-01)

- Version bump only, to stay in lockstep with the other @lumal packages.
