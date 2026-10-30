# Lumal 统一 vw 适配

本文对应 `0.1.1-beta` 候选版本，尚未发布 npm。它是对旧 Beta 多模式体系的破坏性替换。
上一版正式标签、逐包与 registry 消费者证据见 [0.0.7-beta 发布记录](./npm-release-0.0.7-beta.md)，不替代本轮验收。
`@lumal/viewport` 仅以 Vue 为 peer；不依赖 Core、Element Plus、地图、图表或 Cockpit。

## 一个宽度规则

业务继续写普通 px。设计宽度 D 默认1920，只在项目 Vite 接入处填写一次：

```ts
import { createViewportTransformPlugin } from '@lumal/vite'

const viewport = createViewportTransformPlugin({
  enabled: true,
  viewportWidth: 1920,
  include: ['src/**'],
  dependencies: ['element-plus'],
})
```

把它加入现有 plugins，保留 Vue 插件。也可将该普通对象放进 `viewport.config.ts`；
配置文件不导入 Vue/Vite/PostCSS，浏览器不导入构建包。

- CSS：`Ppx → P / D * 100 vw`。
- 数字 API：`P * W / D`，W 测量实际 CSS `100vw`，不读取物理 screen 或乘 DPR。
- 高度、行高、纵向间距也按宽度。相同宽度、不同高度不改变比例。
- 不使用整页 transform、CSS zoom、按高度缩小、居中完整容纳或宽高拉伸。
- 高度不足正常滚动；明确需要裁切时由页面设置 overflow。默认不静默隐藏内容。

以192px为例，D1920下W1280/1920/2560分别为128/192/256实际CSS像素。
浏览器原生 zoom 会改变布局视口 W，普通 vw 自然重算；细边框、忽略项、原子类不承诺同比变化。
这不是任意页面无需审查即可像素级一致的承诺。

## 应用与公共包

Admin/Screen 脚手架默认启用，`--no-viewport` 可关闭，`--design-width 1440` 改设计宽度。
Blank 默认只含 Vue，不强制 Vite 转换包、Viewport、UI 或其他 Lumal 包。
局部高级接入用 `include: ['src/screen/**']`，或 exclude/选择器/声明忽略。
构建范围无法由运行时路由开关撤销，不再提供适配模式菜单或必需页面包装器。
开关与设计宽度为项目级配置。局部 include/exclude 只控制编译来源；
`frameworkStyles:false` 只关闭框架静态 CSS 接入，不撤销框架动态设计尺寸的项目级换算。

Admin Demo 的 Header 另提供 VW 开关用于对比：它在同源 `/`（启用）与 `/px/`（关闭）
两份独立编译的入口间重载导航，保留当前 hash 路由和登录存储，不在运行时改写已编译 CSS。
这只属于 Demo；业务接入仍使用单一构建开关，不需要安装额外模式或提供双份产物。

`frameworkStyles:true` 默认让 Lumal 自有 CSS 与应用一起在消费者构建时转换。
公共包发布产物仍保留 px，改 D1440也会重新换算。第三方只授权经验证的精确包名，
不是扫描整个 node_modules。Core 的主题 CSS 保留逐文件来源，未知混合 Sass 没有可靠 map 时跳过并诊断。

Core 动态 Header/Tabbar/侧栏、字号、间距、图标及数字表格/表单输入在内部换算。
主题切换与恢复仍走相同路径，Teleport 到 body 不依赖父包装器，Popper 的屏幕坐标不再缩放。
第三方库任意 JS 内联值不会被编译器覆盖，不能把普通 CSS 转换描述成全量第三方适配。

## 普通样式与例外

```vue
<template>
  <div class="panel" style="padding: 24px" :style="{ top: '48px' }">示例</div>
</template>

<style scoped>
.panel {
  width: 382px;
  height: 210px;
  font-size: 14px;
  line-height: 20px;
  min-width: 192px;
  border: 1px solid currentColor;
}
</style>
```

字体与有单位行高默认同步，最小尺寸默认参与，1px细边框保留。
`fontSize:false` 同时保留 font/font-size/line-height；属性黑名单优先于白名单。
真正的可操作下限用 `/*! lumal-viewport-ignore-next */` 保留单条声明，
模板 `<!-- lumal-viewport-ignore -->` 保留紧随元素子树。
已有 var/min/max/clamp、vw/rem 等业务表达式默认保护，按需显式授权设计 fallback。
框架拥有的 token 由框架处理，不要求业务手写 Lumal 尺寸变量。

`w-[192px]`、动态 class 和其生成的转义规则保留；普通属性选择器和显式 inline style 不受误伤。
断点不转换；纯 vw Admin 的桌面断点重排显式关闭，关闭适配后仍保留原响应式布局。
不是全局删除媒体查询，reduced-motion等偏好规则仍有效。

## 动态数字与测量

```ts
import { useViewportWidth, viewportLength } from '@lumal/viewport'
import { computed } from 'vue'

const viewport = useViewportWidth()
const option = computed(() => ({
  title: { textStyle: { fontSize: viewport.pixels(18) } },
}))
const dialogWidth = viewportLength(520)
```

普通 CSS/静态模板值自动转换；不能静态分析的 :style 与外部动态脚本不扫描。
ECharts 字号、设计边距是数字工具的使用对象；业务数据、经纬度、索引、比例不转换。
`useElementSize` 获取的实际尺寸直接给图表 resize/地图 updateSize，容器宽度不是新缩放基准。
缩放不重建地图、不重请求数据、不丢失选中状态。

## DataV 与 Cockpit

`LumalFullScreenContainer` 是普通内容容器，数字 width/height 为设计 px；
width默认项目D，height默认自然高度，overflow默认auto，可显式hidden，嵌入用embedded。
指定设计高度只控制内容高度，不作缩放除数。没有mode、screen推断或整画布transform。

`LumalCockpit` 的 baseWidth/baseHeight 是内容设计尺寸，左右面板、列宽、间距按同一D换算，
行高百分比保持语义。外套DataV容器不增加第二层缩放，也不需要外部缩放选项。
多布局、左右区域、Tab、模块注册、Designer拖拽、保存/取消功能保留。
Designer保存设计数值；屏幕测量与指针坐标不二次换算。
SVG viewBox、Canvas局部绘制和装饰图形transform仍是组件自身图形功能，不是页面适配模式。

## 迁移与证据

移除旧 Viewport 策略插件、策略解析、画布组件、缩放/字号下限算法及全部模式配置，
删除Admin旧模式localStorage键，不清理登录、主题或业务数据。
旧 runtime 输出、媒体断点切换配置也删除，不保留别名、包装器或双轨实现。

使用当前 tarball 验证，不用已发布旧版替代候选源码。
验收命令以根package.json为准：`pnpm test:vite-consumer`、`pnpm test:create-consumer`、
`pnpm test:create-projects`、`pnpm test:viewport`及生产E2E。
字符串、SSR、浏览器布局和原生zoom是不同证据，实际执行结果见
[本轮工作记录](pure-vw-refactor-2026-10-28.md)。
