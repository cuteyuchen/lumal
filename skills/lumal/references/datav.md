# @lumal/datav

## 什么时候用

数据大屏需要 DataV 风格边框、装饰、数字翻牌、水位、飞线、滚动表和榜单时使用。该包独立于 `@lumal/core`，不负责后台布局或驾驶舱模块编排。

## 接入与入口

peer 为 Vue 3.5+、ECharts 6。组件优先独立子入口导入，样式统一引入：

```vue
<script setup lang="ts">
import LumalBorderBox from '@lumal/datav/border-box'
import LumalDigitalFlop from '@lumal/datav/digital-flop'
import '@lumal/datav/style.css'
</script>

<template>
  <LumalBorderBox :variant="8" style="height: 160px">
    <LumalDigitalFlop :value="1286" suffix=" 台" />
  </LumalBorderBox>
</template>
```

独立子入口默认导出组件；根入口提供命名导出和全量安装插件。只用一个装饰组件不要安装全量插件。

| 类别 | 导出组件 / 子入口 |
| --- | --- |
| 边框与装饰 | `LumalBorderBox` / `border-box`（variant 1～13）；`LumalDecoration` / `decoration`（1～12） |
| 容器与加载 | `LumalFullScreenContainer` / `full-screen-container`；`LumalLoading` / `loading` |
| 数字和比例 | `LumalDigitalFlop` / `digital-flop`；`LumalPercentPond` / `percent-pond` |
| 图形 | `LumalCapsuleChart` / `capsule-chart`；`LumalWaterLevelPond` / `water-level-pond`；`LumalConicalColumnChart` / `conical-column-chart` |
| 飞线 | `LumalFlylineChart` / `flyline-chart`；`LumalFlylineChartEnhanced` / `flyline-chart-enhanced` |
| 滚动列表 | `LumalScrollBoard` / `scroll-board`；`LumalScrollRankingBoard` / `scroll-ranking-board` |
| 引擎图表 | `LumalCharts` / `charts`；`LumalActiveRingChart` / `active-ring-chart` |

不要生成上游 `dv-border-box-1` 等全局组件名；本包通过 `variant` 表达变体。

## 两套配置协议

- 迁移上游 DataV 配置时使用 `config`。
- 新代码优先使用类型明确的现代 props。同一字段优先级为：显式现代 props > `config` > 上游默认值。
- `LumalCharts :config="..."` 使用 `@jiaminghi/charts` Canvas 引擎；`LumalCharts :option="..."` 使用 ECharts。**两套配置不互转，不能同时混写 series 语法。**
- ECharts 模式支持 `theme/initOptions/setOptionOptions/events` 和实例 API；这些不是 DataV config 模式的通用能力。

```vue
<LumalCharts
  :config="{
    xAxis: { data: ['一', '二'] },
    yAxis: { data: 'value' },
    series: [{ type: 'line', data: [10, 20] }],
  }"
/>
```

上例是 DataV 协议，不是 ECharts option。不要为了类型通过而强行断言成 `EChartsOption`。

## 轻量与生命周期

- 纯 SVG、数字和列表子入口不加载图表引擎；`LumalActiveRingChart` 使用 ECharts，不能当成无引擎组件。
- `LumalCharts` 按当前模式动态加载引擎，切换模式和卸载会使旧加载失效。`onMounted` 不保证异步引擎已创建。
- 组件 ref 使用 `useTemplateRef`；`getInstance/getNativeInstance/setConfig/setOption/resize` 应在对应实例就绪后调用，并处理暂未就绪。
- 给组件及其父容器明确的宽高；画布空白时先查尺寸、模式和实例时机。
- 内置离屏、页面隐藏、焦点/悬停和 reduced-motion 暂停。新增动画保持这些行为，不额外叠加永不清理的 interval。
- 滚动表的 HTML 字符串按文本渲染，这是安全边界，不通过 `v-html` 恢复旧行为。
- `LumalFullScreenContainer` 与 Cockpit 不要重复缩放；组合时 Cockpit 选择 `viewport-mode="external"`。
- 主题使用 `--lumal-datav-*` 语义变量，行业皮肤放应用层。

仓库核对位置：`packages/datav/src/index.ts`、`types.ts`、各组件与测试；上游版权说明在包内 `THIRD_PARTY_NOTICES.md`。
