# @lumal/vite

## 可选的局部 px → vw

以下 API 属于 `0.0.6-beta`，实际版本可用性以 registry 为准；发布核验前使用候选 tarball：

```ts
import { createViewportTransformPlugin } from '@lumal/vite'

const viewport = createViewportTransformPlugin({
  enabled: true,
  include: ['src/screen/**'],
  exclude: ['**/map/**'],
  viewportWidth: 1920,
  fontSize: false,
  customProperties: false,
})
// 将 viewport 加入已有 Vite plugins。
```

默认 `enabled=false`，开启必须指定 include。Dev/Build 共用 PostCSS 声明转换，
保留已有 inline 或文件 PostCSS 配置；SCSS 在预处理后转换，SFC仅转换style。
默认不转换 node_modules，仅 `dependencies: ['明确的包名']` 可白名单加入。
默认保留 <=1px、font/font-size 和 CSS 自定义属性；已有vw、URL、var引用、
引号字符串和普通数字不变，重复执行幂等。

预处理器有原始 source map 时，按每条声明的真实来源判断范围，而非入口文件名。
没有可靠 source map 时，跨文件 `@use` / `@forward` / Sass `@import`、
无法解析的预处理语法或函数形式 `additionalData` 会使该 style 整体跳过并警告。
这是对转换边界的保护：请把第三方/Shared 样式与需要转换的 Screen 声明分开；
同一 SFC 的独立安全 style 块仍可转换。纯 SCSS 声明不受此限制。
直接使用 `createViewportPostcssPlugin` 处理预编译的 SCSS/SFC 输出时，
必须传入原始 source map，否则保守保留 px，不能根据入口路径猜测来源。

不转换模板内联 style、TS/JS 字符串或坐标；动态数值布局使用响应式 viewport Composable。
不提供旧插件的全依赖/全脚本扫描开关。不要将本插件与同一画布的 transform 双重缩放，
也不要让转换范围覆盖 Admin、Element Plus 或地图引擎样式。
解析依赖仅供 Node 构建工具使用，不进入应用运行时。

Lumal 的轻量 Vite 配置助手，提供组件 resolver、工作区源码/产物 alias 和可选 Devtools 接线。

```ts
import { createLumalAliases, createLumalComponentResolver } from '@lumal/vite'

const aliases = createLumalAliases({ workspaceRoot: process.cwd() })
const resolver = createLumalComponentResolver({ importStyle: true })
```

本包不提供全局 viewport 转换，也不强制安装自动导入或 Devtools 插件。
