# @lumal/datav

面向驾驶舱的 Vue 3 DataV 组件包。以 DataV 2.10.0（MIT）为基准重构，支持 DataV `config` 与现代 props 双套 API。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/datav` |
| 本地路径 | `packages/datav` |
| 在线文档 | https://lumal-docs-cf.pages.dev/packages/datav |
| 正式地址（上线后） | `https://www.npmjs.com/package/@lumal/datav` |
| 示例 | [DataV 示例](/reference/datav-examples)、`apps/lumal-datav-guide` |

## 安装

```bash
pnpm add @lumal/datav vue echarts
```

## 公开入口

根入口与按需子入口（节选）：

| 入口 | 组件 |
| --- | --- |
| `@lumal/datav` | 全量 + 插件式 `use` |
| `@lumal/datav/border-box` | `LumalBorderBox` |
| `@lumal/datav/decoration` | `LumalDecoration` |
| `@lumal/datav/digital-flop` | `LumalDigitalFlop` |
| `@lumal/datav/scroll-board` | `LumalScrollBoard` |
| `@lumal/datav/flyline-chart` | `LumalFlylineChart` |
| `@lumal/datav/charts` | `LumalCharts` |
| … | 见 `package.json` `exports` |
| `@lumal/datav/style.css` | 样式 |

## 全量注册

```ts
import { createApp } from 'vue'
import LumalDatav from '@lumal/datav'
import '@lumal/datav/style.css'

createApp(App).use(LumalDatav).mount('#app')
```

## 按需导入

```ts
import LumalBorderBox from '@lumal/datav/border-box'
import LumalFlylineChart from '@lumal/datav/flyline-chart'
import '@lumal/datav/style.css'
```

## 两套 API

DataV 原生配置：

```vue
<LumalDigitalFlop :config="{ number: [1286], content: '{nt} 台', toFixed: 0 }" />
<LumalScrollBoard :config="{ header: ['区域', '数量'], data: [['甲区', 20]], rowNum: 5 }" />
```

现代 props（优先级：显式 props > `config` > 上游默认）：

```vue
<LumalBorderBox :variant="8" :duration="3000">
  <LumalDigitalFlop :value="1286" suffix=" 台" />
</LumalBorderBox>
```

滚动表中的 HTML 字符串按**普通文本**渲染，不恢复上游 `v-html`。

## DataV 原生 Charts（`LumalCharts`）

```vue
<LumalCharts
  :config="{
    xAxis: { data: ['一', '二', '三'] },
    yAxis: { data: 'value' },
    series: [{ type: 'line', data: [120, 200, 150] }],
  }"
/>
```

`config` 由 DataV 使用的 `@jiaminghi/charts` 直接解释。既有 ECharts 调用继续通过 `option` 扩展兼容：

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

`autoResize` 对两种模式生效；`theme`、事件、loading 和 ECharts 实例方法只在 `option` 模式生效。

## 组件映射（DataV → Lumal）

| DataV | Lumal |
| --- | --- |
| borderBox1–13 | `LumalBorderBox variant=1..13` |
| decoration1–12 | `LumalDecoration variant=1..12` |
| fullScreenContainer | `LumalFullScreenContainer` |
| loading | `LumalLoading` |
| charts | `LumalCharts` |
| activeRingChart | `LumalActiveRingChart` |
| capsuleChart | `LumalCapsuleChart` |
| waterLevelPond | `LumalWaterLevelPond` |
| percentPond | `LumalPercentPond` |
| digitalFlop | `LumalDigitalFlop` |
| flylineChart / Enhanced | `LumalFlylineChart` / `LumalFlylineChartEnhanced` |
| conicalColumnChart | `LumalConicalColumnChart` |
| scrollBoard | `LumalScrollBoard` |
| scrollRankingBoard | `LumalScrollRankingBoard` |

## 主题

现代 API 可通过 `--lumal-datav-*` 语义变量调整。与 `@lumal/cockpit` 联用时，在应用层映射到 `--lumal-cockpit-*`。

## 边界

- 仅 peer：`vue`、`echarts`
- **不**依赖 `@lumal/core` / charts / cockpit
- 不得引入业务接口、状态码或字段映射
- 版权说明见包内 `THIRD_PARTY_NOTICES.md`
