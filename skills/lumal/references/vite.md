# @lumal/vite

## 什么时候用

需要 Lumal 组件自动导入 resolver、Lumal monorepo 源码/产物 alias，或可选 Devtools 接线时使用。它是配置助手，不是替代 `@vitejs/plugin-vue` 的编译器。

## 组件 resolver

```ts
import { createLumalComponentResolver } from '@lumal/vite'

const resolver = createLumalComponentResolver({ importStyle: true })
```

把 resolver 放到应用已经安装的组件自动导入插件中，例如 `unplugin-vue-components` 的 `resolvers`。本包不安装该插件；没有自动导入需求就手动 import。

- 内置映射覆盖 Core、Icons Vue 和 Charts 的常见组件。
- 不自动覆盖所有 DataV/Cockpit 组件。它们优先显式导入；确需自动导入时通过 `customComponents` 指定公开入口。
- `importStyle: true` 为已知包提供 CSS sideEffects，不会替应用准备 SCSS 主题和所有 peer。
- 自定义组件映射不自动推导额外样式，应用显式导入。

## 工作区 alias

只在存在 Lumal `packages/*` 目录的仓库开发/联调中使用：

```ts
import { createLumalAliases } from '@lumal/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: createLumalAliases({
      workspaceRoot: process.cwd(),
      target: 'source',
      packages: ['core', 'icons', 'icons-vue'],
    }),
  },
})
```

- `workspaceRoot` 必须是 Lumal 仓库根，不是任意消费项目目录。
- `target: 'source'` 供 HMR；`target: 'dist'` 需要先构建依赖包。
- 结果是按更长 specifier 优先的 alias 数组，保留顺序，不转成会覆盖子入口的宽泛 alias。
- 当前 DataV alias 只有根入口与样式等显式登记项；独立 DataV 子入口源码联调前核对 `aliases.ts`，不能假设自动映射所有 exports。
- npm 消费项目用包原生 exports，不加指向 monorepo 源码的 alias。

## Devtools 与非职责

`resolveLumalDevtoolsPlugin({ enabled, factory })` 只在开启时调用 factory，Devtools 实现由应用安装并提供。关闭时返回 `undefined`，按 Vite 插件列表用法处理。

本包不强制安装 Devtools、自动导入或打包完整行业预设。静态 SVG 插件属于 `@lumal/icons/vite`。

## 视口转换

`0.0.6-beta` 已提供 `createViewportTransformPlugin` / `createViewportPostcssPlugin`；
以下精细控制、行内样式和原子化保护属于未发布源码，须使用候选 tarball，
不能用历史 registry 包验证。默认关闭，启用必须明确 `include`，例如 `src/screen/**`。

```ts
import { createViewportTransformPlugin } from '@lumal/vite'

const viewport = createViewportTransformPlugin({
  enabled: true,
  include: ['src/screen/**'],
  exclude: ['src/screen/canvas/**', '**/map/**'],
  viewportWidth: 1920,
  fontSize: false,
  minSize: false,
  includeProperties: ['width', 'height', 'padding*', '*gap'],
  excludeProperties: ['border*', 'margin*'],
  excludeSelectors: ['.runtime-canvas', /\.el-(?:dialog|popper)\b/],
  inlineStyles: false,
})
```

- 属性使用 CSS 连字符形式与 glob；白名单默认全部，`[]` 不转换，黑名单始终优先。
- `fontSize:false` 同时保留 font/font-size/line-height；minSize默认false，保护物理及逻辑最小宽高。
  白名单不绕过这些开关。边框、间距按属性名单独立控制；<=1px默认保留。
- 默认保留自定义属性，`--lumal-viewport-*` 始终保留。默认含var/env/attr/min/max/clamp、
  已有视口/容器/字体相对单位的整条声明保留，不转换表达式旁的px。
- `excludeSelectors` 字符串按子串、正则按选择器匹配，分组或嵌套祖先命中则整条声明保留。
  紧邻前置 `/* lumal-viewport-ignore-next */` 或后置 `/* lumal-viewport-ignore */`
  保护单条声明；Sass压缩时使用 `/*! ... */`。
- `inlineStyles:true` 才用Vue模板AST+CSS AST处理静态style及可静态分析的:style对象/数组。
  支持无插值模板字符串与CSS fallback字符串数组，不遍历条件/逻辑表达式。
  动态值不求值；class/:class/aria和其他属性、JS数字/业务字符串不修改。
  配置selector排除且class/id、data等非style属性动态绑定时，保守跳过该元素子树。
  模板 `<!-- lumal-viewport-ignore -->` 跳过紧随元素及子树。
- 原子化任意值class和对应生成CSS规则保留，普通属性选择器不误伤；原子class本身不阻止显式inline style转换。
- Dev/Build共用转换规则，保留已有PostCSS配置、source map和文件边界。
  node_modules默认排除，仅精确包名dependencies白名单允许加入。
  无可靠map的跨文件Sass导入、无法解析语法或函数additionalData让该style跳过并警告；
  独立安全CSS/SCSS块仍可转换。低层PostCSS处理预编译SCSS/SFC也需原始map。

默认 `output:'vw'` 直接输出浏览器vw，可独立使用，不能与画布transform叠加。
可选 `output:'runtime'` 将设计px输出为 `calc(192 * var(--lumal-viewport-unit, 1px))`，
LumalViewport在vw下设置浏览器宽度单位，其余模式恢复1px，无包装器/外部Teleport回退1px。
切换协作模式不二次缩放；外部transform或已有raw vw仍需要显式隔离。无法自动推断跨组件缩放，
显式排除画布文件/selector/声明。项目级普通 `viewport.config.ts` 可共享设计对象：
运行时policy展开designWidth/designHeight，Vite使用viewportWidth=designWidth；
不增加两个包间依赖。vw宽高统一相对浏览器宽度，实际容器测量仍独立。
Screen仅--viewport vw自动安装并启用协作转换，其他模式不增加构建依赖。
局部适配不要把Admin/地图/Teleport浮层纳入宽泛转换；ECharts与动态尺寸继续显式使用运行时API。
新选项默认关闭或保守保护，旧最小尺寸如需继续缩放必须显式minSize:true。

## 整页 vw（未发布源码）

仅转换内容间距不能保证浏览器页面缩放后视觉一致。整页 opt-in 必须统一 Header、侧栏、
字体/行高、最小尺寸、细边框、主题变量、CSS/JS断点及Teleport单位：

- 显式开启fontSize/minSize/customProperties/inlineStyles，minPixelValue:0；
  dependencies仅列明确UI包，不放开全部node_modules。
- 新 `variableFallbacks:true` 转换普通var fallback和min/max/clamp中的px，
  仍服从属性开关；视口变量、已有相对单位、env/attr/constant、URL/字符串仍保护。
  先确认普通变量没有经其他机制缩放。
- 新 `mediaQueries:{ runtimeSelector:'html[data-app-viewport="vw"]' }` 只接受runtime输出和
  单个html复合选择器。顶层media/container宽高查询保留px分支、复制vw分支，用零优先级根条件切换。
  支持传统/范围/双边语法；嵌套、原子化、排除规则和混合范围外来源的查询保守跳过。
  motion/pointer等其他条件不改。
- 根单位由应用设置vw/1px并在卸载恢复。Core主题用runtime.cssLength，Layout/Tabs用responsive:false
  同步JS断点。默认行为不变，不是仅切换一个prop就完成适配。
- 根主题变量不能靠内层包装器重置；进入自管理画布路由需整页回退或隔离主题定义。
  表格列宽/弹窗size等数值协议仍显式计算，原子px规则仍由原子工具适配。

Admin Demo已采用此接线；本仓库scripts/check-admin-viewport-zoom.mjs验证真实页面zoom，
而非CSS zoom或DPR模拟。不承诺手机pinch zoom或任意未接入业务脚本的视觉一致。
完整配置见docs/screen-viewport-guide.md。

仓库核对位置：`packages/vite/src/{index,component-resolver,aliases,devtools,viewport-transform}.ts`。
