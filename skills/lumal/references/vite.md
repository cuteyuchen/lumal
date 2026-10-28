# @lumal/vite

候选 `0.1.0-beta.0`，尚未发布。消费项目使用公开exports，不使用工作区源码alias。

```ts
import { createViewportTransformPlugin } from '@lumal/vite'

const viewport = createViewportTransformPlugin({
  enabled: true,
  include: ['src/**'],
  viewportWidth: 1920,
  dependencies: ['element-plus'],
})
```

加入现有Vite plugins并保留Vue插件。业务写普通px，CSS/SCSS预处理输出与Vue静态style、
可分析:style字符串/对象/数组共用PostCSS规则，输出普通vw。
唯一D同时注入Core/DataV/Cockpit/Viewport动态数值；不要求main或页面重新配置。
未启用时保留px；静态CSS项目不需要运行时包。

- 默认字体/有单位行高、最小尺寸、模板样式转换；`fontSize:false`保护font/font-size/line-height。
- `includeProperties/excludeProperties`为属性glob，黑名单优先。`excludeSelectors`为子串/正则。
- 声明前`/*! lumal-viewport-ignore-next */`、后`/* lumal-viewport-ignore */`保护单声明。
- 模板`<!-- lumal-viewport-ignore -->`保护紧随元素子树；动态表达式不执行。
- `inlineStyles:false`独立关闭模板处理；class/:class/aria/普通属性/业务脚本不扫描。
- 任意值原子class及生成的转义CSS规则保留，普通属性选择器不误伤，原子class不阻止显式style转换。
- `minPixelValue`默认1，物理细边框保留；`precision`默认6。无单位行高及rem/em/%/vh不改。
- 业务var/min/max/clamp与已有适配单位默认保护，`customProperties/variableFallbacks`可显式授权普通设计token。
- `frameworkStyles`默认true，在消费者构建时接入自有CSS和源码alias，公共包不写死1920。
- 第三方只精确包名`dependencies`白名单；Core主题逐CSS文件导入保留Element Plus来源。
- 原始map逐声明定位；无法证明跨文件Sass/additionalData来源时跳过并警告，不能扩大全依赖绕过。
- 媒体/容器断点不转换，已编译vw不能由路由开关撤销。

低层`createViewportPostcssPlugin(options, root)`规则一致，预编译Sass/SFC需原始map。
Dev/Build、幂等、映射、D1920/1440由tarball消费者验证。运行时数字见[Viewport](viewport.md)。

其他API：`createLumalComponentResolver({ importStyle:true })`接入已有组件自动导入插件；
`createLumalAliases({ workspaceRoot, target:'source' })`只用于真实Lumal工作区；
`resolveLumalDevtoolsPlugin({ enabled, factory })`按需调用factory，不强制安装Devtools。
旧runtime输出/媒体断点切换已删除，不保留兼容选项。
