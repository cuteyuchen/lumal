# Screen

独立大屏，不包含 Admin 菜单、标签和系统管理。默认纯静态、无 API、无认证。

首次运行 `pnpm install`，开发使用 `pnpm dev`，提交前执行 `pnpm check`。
工程规范见 [开发约定](docs/DEVELOPMENT.md)。

选择 `contain`、`width` 或容器单位 `vw` 适配时，设计宽高与运行时策略位于根目录 `viewport.config.ts`。
需要构建期 CSS 转换时，从同一 `viewportDesign.designWidth` 设置 `@lumal/vite` 的 `viewportWidth`；
该工具不会默认安装或启用。已经整体缩放的 Screen 文件必须从构建转换范围排除，不能重复缩放。
