# create-lumal-admin

## 0.0.2-beta (2026-08-01)

### Minor Changes

- Add the unified static and remote menu route runtime, navigation discovery components, permission access control, and persisted navigation and font-size preferences. Nested route guards enforce ancestor permissions and roles, and generated admin projects now use the same menu runtime.

### Patch Changes

- 补齐生成项目所需的 `@iconify/vue` 与 `sass-embedded` 依赖，并新增打包后生成、安装和生产构建的独立消费检查。
- 修复应用插件安装顺序和脚手架发布后的依赖版本同步，并统一多包版本发布策略。
