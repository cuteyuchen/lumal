# @lumal/datav

面向 Lumal 驾驶舱的 Vue 3 DataV 组件包。当前版本以 DataV 2.10.0（MIT）为基准，提供 15 个导出组件，含边框/装饰变体共 38 种形态，重构其默认几何、动效和 `config` 协议，同时提供更明确的现代 props API。

## 安装

下列命令为历史 `0.0.5-beta` 的接入示例；本轮新增能力使用本地构建或候选 tarball，
不能通过重新安装历史同版本取得，也不根据本文推断 npm 的当前 dist-tag。

```bash
pnpm add @lumal/datav@0.0.5-beta vue echarts@^6
```

开发分支将 ECharts 改为可选 peer：仅 ECharts 图表模式与 `LumalActiveRingChart`
需要安装，纯数字、边框和列表子入口不要求引擎。Vue 仍为必需 peer。
DataV 与 Cockpit 共享轻量 `@lumal/viewport`，保留既有全屏缩放 API 与组件行为。

```ts
import { createApp } from 'vue'
import LumalDatav from '@lumal/datav'
import '@lumal/datav/style.css'

createApp(App).use(LumalDatav).mount('#app')
```

组件支持根入口和独立子入口按需导入：

```ts
import LumalBorderBox from '@lumal/datav/border-box'
import LumalFlylineChart from '@lumal/datav/flyline-chart'
import '@lumal/datav/style.css'
```

### DataV 原生 Charts 与 ECharts 扩展

`config` 直接交给 DataV 2.10.0 使用的 `@jiaminghi/charts` Canvas 运行时：

```vue
<LumalCharts :config="{ xAxis: { data: ['一', '二'] }, yAxis: { data: 'value' }, series: [{ type: 'line', data: [10, 20] }] }" />
```

为兼容既有项目，未传 `config` 时仍可用 ECharts 原生 `option`：

```vue
<LumalCharts
  :option="option"
  theme="dark"
  :init-options="{ renderer: 'canvas', devicePixelRatio: 2 }"
  :set-option-options="{ notMerge: false, lazyUpdate: true }"
  :events="{ legendselectchanged: handleLegendChange }"
  @click="handleChartClick"
/>
```

`autoResize` 对两种运行时都有效；`theme`、事件、loading 与 ECharts 实例方法仅属于 `option` 扩展模式。组件 ref 提供 `getInstance()`、`getNativeInstance()`、`setConfig()`、`setOption()` 与 `resize()`。

两套引擎按当前模式动态加载，实例在加载完成后创建；切换模式或卸载会使旧加载失效。`LumalActiveRingChart` 使用 ECharts 模式，不应视为无引擎组件。其他纯 SVG/数字/列表子入口不引入图表引擎；需要实例的方法应在实例创建后调用。

## 两套 API

DataV 原生配置可以直接迁移：

```vue
<LumalDigitalFlop :config="{ number: [1286], content: '{nt} 台', toFixed: 0 }" />
<LumalScrollBoard :config="{ header: ['区域', '数量'], data: [['甲区', 20]], rowNum: 5 }" />
```

也可以使用类型更明确的现代 props：

```vue
<LumalBorderBox :variant="8" :duration="3000">
  <LumalDigitalFlop :value="1286" suffix=" 台" />
</LumalBorderBox>
```

同一字段同时出现时，优先级为：显式现代 props > DataV `config` > DataV 上游默认值。为了避免注入风险，滚动表中的 HTML 字符串按普通文本渲染，不恢复上游 `v-html`；除此之外保留上游公开视觉、几何、动画和事件语义。

## 实现说明

- BorderBox、Decoration、Loading、PercentPond、Flyline 等使用响应式 SVG、CSS 与 SMIL 重构。
- `LumalWaterLevelPond` 使用响应式 SVG 波浪、裁剪与渐变实现，不依赖 Canvas 运行时。
- `LumalCharts` 的 `config` 使用 DataV 官方 `@jiaminghi/charts`；既有 `option` API 保留为 ECharts 扩展，两套配置不互转。
- `LumalActiveRingChart` 在 ECharts 兼容层中模拟每个数据项独立半径，保持上游固定线宽与切换几何。
- 连续动画支持页面隐藏、离开视口、悬停、键盘焦点和 `prefers-reduced-motion` 暂停。
- ResizeObserver 通过 `requestAnimationFrame` 合并；数字动画和定时器会在更新或卸载时立即清理。
- 滚动组件使用循环窗口索引，不复制整份数据；现代单行滚动最多渲染 `visibleRows + 1` 行。

## 38 个 DataV 组件映射

| DataV 2.10.0 | @lumal/datav |
| --- | --- |
| borderBox1 | `LumalBorderBox variant=1` |
| borderBox2 | `LumalBorderBox variant=2` |
| borderBox3 | `LumalBorderBox variant=3` |
| borderBox4 | `LumalBorderBox variant=4` |
| borderBox5 | `LumalBorderBox variant=5` |
| borderBox6 | `LumalBorderBox variant=6` |
| borderBox7 | `LumalBorderBox variant=7` |
| borderBox8 | `LumalBorderBox variant=8` |
| borderBox9 | `LumalBorderBox variant=9` |
| borderBox10 | `LumalBorderBox variant=10` |
| borderBox11 | `LumalBorderBox variant=11` |
| borderBox12 | `LumalBorderBox variant=12` |
| borderBox13 | `LumalBorderBox variant=13` |
| decoration1 | `LumalDecoration variant=1` |
| decoration2 | `LumalDecoration variant=2` |
| decoration3 | `LumalDecoration variant=3` |
| decoration4 | `LumalDecoration variant=4` |
| decoration5 | `LumalDecoration variant=5` |
| decoration6 | `LumalDecoration variant=6` |
| decoration7 | `LumalDecoration variant=7` |
| decoration8 | `LumalDecoration variant=8` |
| decoration9 | `LumalDecoration variant=9` |
| decoration10 | `LumalDecoration variant=10` |
| decoration11 | `LumalDecoration variant=11` |
| decoration12 | `LumalDecoration variant=12` |
| fullScreenContainer | `LumalFullScreenContainer` |
| loading | `LumalLoading` |
| charts | `LumalCharts` |
| activeRingChart | `LumalActiveRingChart` |
| capsuleChart | `LumalCapsuleChart` |
| waterLevelPond | `LumalWaterLevelPond` |
| percentPond | `LumalPercentPond` |
| digitalFlop | `LumalDigitalFlop` |
| flylineChart | `LumalFlylineChart` |
| flylineChartEnhanced | `LumalFlylineChartEnhanced` |
| conicalColumnChart | `LumalConicalColumnChart` |
| scrollBoard | `LumalScrollBoard` |
| scrollRankingBoard | `LumalScrollRankingBoard` |

15 个独立入口分别为 `border-box`、`decoration`、`full-screen-container`、`loading`、`charts`、`active-ring-chart`、`capsule-chart`、`water-level-pond`、`percent-pond`、`digital-flop`、`flyline-chart`、`flyline-chart-enhanced`、`conical-column-chart`、`scroll-board` 和 `scroll-ranking-board`。

## 主题变量

组件默认值与 DataV 一致，应用仍可通过 `--lumal-datav-*` 语义变量调整现代 API 外观。Cockpit 应在应用层将这些变量映射到 `--lumal-cockpit-*` 浅色/深色主题。

DataV 仅作为 MIT 许可下的源码、功能和视觉重构基准，版权声明见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
