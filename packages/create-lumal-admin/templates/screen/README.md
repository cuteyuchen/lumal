# Screen

独立大屏，不包含 Admin 菜单、标签和系统管理。默认纯静态、无 API、无认证。

首次运行 `pnpm install`，开发使用 `pnpm dev`，提交前执行 `pnpm check`。
工程规范见 [开发约定](docs/DEVELOPMENT.md)。

选择 `contain`、`width` 或 `vw` 适配时，设计宽高与运行时策略位于根目录 `viewport.config.ts`。
`contain/width` 按实际容器缩放设计画布，不启用构建转换。
`vw` 保持流式布局，自动接入 `@lumal/vite`，仅转换 `src/screen/**` 的 CSS 和 Vue 行内样式；
尺寸按浏览器宽度 / `viewportDesign.designWidth` 变化，不取侧栏扣除后的容器宽度。
构建与运行时共享设计配置；协作输出在其他模式下恢复 px，不额外叠加画布缩放。
默认保留字号、行高、最小尺寸和细边框，更多控制位于生成的 `vite.config.ts`。
动态数值与 ECharts 使用 `useViewportScale` 等公开 API 显式计算，不扫描业务脚本或 class。
