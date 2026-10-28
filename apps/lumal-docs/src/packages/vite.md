# @lumal/vite

候选 `0.1.0-beta.0`：自动px→vw、组件resolver、工作区alias、可选Devtools。尚未发布npm。

```bash
pnpm add -D @lumal/vite@0.1.0-beta.0
```

## 统一转换

```ts
import { createViewportTransformPlugin } from '@lumal/vite'

const viewport = createViewportTransformPlugin({
  enabled: true,
  include: ['src/**'],
  viewportWidth: 1920,
  dependencies: ['element-plus'],
})
```

加入现有Vite plugins。业务正常写CSS/SCSS/模板style的px，输出 `P / D * 100 vw`；
高度也按宽度，字号和有单位行高同步。无需main安装、页面包装器或业务单位变量。
同一配置注入框架动态token/数字工具，公共CSS在消费者构建时转换，不在发布包写死1920。

| 配置 | 默认与边界 |
| --- | --- |
| enabled / include / exclude | 默认关闭；明确源码范围，排除优先 |
| frameworkStyles | true，自有公共CSS；第三方仅精确dependencies白名单 |
| includeProperties / excludeProperties | 属性glob；黑名单优先 |
| excludeSelectors | 子串或正则，分组/嵌套祖先命中整体保留 |
| fontSize / minSize / inlineStyles | 默认true；字体关闭同时保护font、font-size、line-height |
| customProperties / variableFallbacks | 业务默认false，保留var/min/max/clamp已有适配 |
| minPixelValue / precision | 1 / 6，细边框保留 |

声明前`/*! lumal-viewport-ignore-next */`或后`/* lumal-viewport-ignore */`保护单声明，
模板`<!-- lumal-viewport-ignore -->`保护紧随元素子树。
Vue模板AST与CSS AST只分析style/:style静态部分，动态表达式不执行。
class/:class/aria/业务字符串/脚本数值不扫描；任意值原子类及生成CSS保留，普通属性选择器不误伤。
媒体/容器断点不转换，vw不能由运行时路由开关撤销。

保留既有PostCSS配置、原始Source Map及SCSS来源保护。无法证明跨文件Sass来源时跳过并警告，
不通过扫描全node_modules绕过边界。低层`createViewportPostcssPlugin`共用规则。
旧runtime输出与媒体断点切换已删除，见[统一指南](/reference/screen-viewport-guide)。

## 构建助手

```ts
import { createLumalAliases, createLumalComponentResolver } from '@lumal/vite'

const aliases = createLumalAliases({ workspaceRoot: process.cwd(), target: 'source' })
const resolver = createLumalComponentResolver({ importStyle: true })
```

alias仅用于真实Lumal工作区，npm消费者使用公开exports；生产preview读取dist。
resolver加入已有自动导入插件，不强制安装该插件或全量UI。
`resolveLumalDevtoolsPlugin({ enabled, factory })`仅开启时调用factory。
