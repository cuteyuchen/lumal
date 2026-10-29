# Screen

独立大屏，不包含 Admin 菜单、标签和系统管理。默认纯静态、无 API、无认证。

首次运行 `pnpm install`，开发使用 `pnpm dev`，提交前执行 `pnpm check`。
工程规范见 [开发约定](docs/DEVELOPMENT.md)。

默认启用 px→vw，`--no-viewport` 可生成普通 px 项目。
启用时设计宽度只在根目录 `viewport.config.ts` 配置一次，默认1920。
业务正常写 px，CSS/SCSS与模板静态style由Vite转换；高度也按宽度，不取容器宽度，不作整画布transform。
字号/有单位行高、设计最小尺寸同步；细边框、原子化类/生成规则、明确忽略项与未知依赖保留。
高度不足正常滚动；静态Screen不需要Viewport运行时。
ECharts等必须接收数字的设计尺寸，可显式使用 `@lumal/viewport` 的 `useViewportWidth().pixels()`；
业务数据、地图经纬度及实际测量不处理，不扫描脚本或class。
