# DataV 组件示例

`@luma/datav` 是面向驾驶舱的 Vue 3 可视化组件包，以 DataV 2.10.0（MIT）为基准重构 38 个组件，提供 15 个可导入组件。每个组件同时支持 DataV `config` 协议和类型更明确的现代 props；同一字段同时出现时优先级为 **显式现代 props > DataV `config` > DataV 上游默认值**。

本文覆盖全部 15 个组件的最小示例、主题变量、原生 ECharts 封装，以及在 Admin 中以外链形式嵌入独立示例页的接线方式。可运行的组件文档站见 `apps/luma-datav-guide`（仿 DataV guide 结构，含实时预览与属性表）。

## 安装与注册

```bash
pnpm add @luma/datav vue echarts
```

`vue` 和 `echarts` 是 peer dependency，需要应用侧安装。只有 `LumaCharts` 用到 `echarts`，其余组件不加载图表运行时。

全量注册：

```ts
import { createApp } from 'vue'
import LumaDatav from '@luma/datav'
import '@luma/datav/style.css'
import App from './App.vue'

createApp(App).use(LumaDatav).mount('#app')
```

按需导入（根入口或独立子入口，样式入口只需引入一次）：

```ts
import { LumaBorderBox, LumaDigitalFlop } from '@luma/datav'
// 或独立子入口
import LumaScrollBoard from '@luma/datav/scroll-board'
import '@luma/datav/style.css'
```

15 个独立子入口：`active-ring-chart`、`border-box`、`capsule-chart`、`charts`、`conical-column-chart`、`decoration`、`digital-flop`、`flyline-chart`、`flyline-chart-enhanced`、`full-screen-container`、`loading`、`percent-pond`、`scroll-board`、`scroll-ranking-board`、`water-level-pond`。

## 容器与装饰

### LumaFullScreenContainer

按 `1920 × 1080` 设计稿等比缩放铺满全屏，适合作为驾驶舱根容器。

```vue
<LumaFullScreenContainer :width="1920" :height="1080">
  <!-- 驾驶舱内容 -->
</LumaFullScreenContainer>
```

### LumaBorderBox

`variant` 对应 DataV 的 `borderBox1`–`borderBox13`。现代 props 用 `colors`（二元组）、`background`、`duration`；DataV 写法用 `color`（数组）、`backgroundColor`、`dur`。

```vue
<!-- 现代 props -->
<LumaBorderBox :variant="8" :colors="['#4fd2dd', '#235fa7']" :duration="3000">
  <LumaDigitalFlop :value="1286" suffix=" 台" />
</LumaBorderBox>

<!-- DataV config 迁移 -->
<LumaBorderBox :variant="1" :color="['#4fd2dd', '#235fa7']" background-color="#1a2b4a" />
```

### LumaDecoration

`variant` 对应 `decoration1`–`decoration12`。支持 `colors`/`color`、`duration`/`dur`、`scanDur`、`haloDur`、`reverse`。

```vue
<LumaDecoration :variant="10" :colors="['#35c8ff', '#796cff']" :duration="3000" />
```

### LumaLoading

```vue
<LumaLoading label="加载中" :size="60" :colors="['#02bcfe', '#3be6cb']" />
```

## 数值与占比

### LumaDigitalFlop

数字翻牌。现代 props 用 `value` / `numbers`、`suffix` / `prefix`、`precision`、`duration`；DataV 写法用 `config.number`、`config.content`、`config.toFixed`。

```vue
<!-- 现代 props -->
<LumaDigitalFlop :value="1286" suffix=" 台" :precision="0" :duration="420" />

<!-- DataV config 迁移 -->
<LumaDigitalFlop :config="{ number: [1286], content: '{nt} 台', toFixed: 0 }" />
```

### LumaPercentPond

百分比水位/胶囊。`shape` 取 `bar` 或 `capsule`。

```vue
<LumaPercentPond :value="68" shape="capsule" :colors="['#35c8ff', '#6ff7cd']" />
<LumaPercentPond :config="{ value: 68, colors: ['#00c0ff', '#4dfffe'], borderRadius: 5 }" />
```

### LumaWaterLevelPond

SVG 波浪水位图，`shape` 取 `rect` / `round` / `roundRect`。多个值渲染多层波浪。

```vue
<LumaWaterLevelPond :value="55" shape="roundRect" :colors="['#3de7c9', '#00bcd4']" />
<LumaWaterLevelPond :config="{ data: [55, 45], shape: 'round', waveNum: 3 }" />
```

## 分类与排名

### LumaCapsuleChart

胶囊条形图。现代 props 用 `items`（`{ key, label, value }`），`sort` 取 `asc` / `desc` / `false`。

```vue
<LumaCapsuleChart
  :items="[
    { key: 'east', label: '华东', value: 128 },
    { key: 'south', label: '华南', value: 96 },
  ]"
  unit="台"
  show-value
/>

<LumaCapsuleChart :config="{ data: [{ name: '华东', value: 128 }], unit: '台' }" />
```

### LumaConicalColumnChart

锥形柱图，支持 `images` 图标柱。

```vue
<LumaConicalColumnChart
  :items="[
    { key: 'a', label: '一区', value: 80 },
    { key: 'b', label: '二区', value: 62 },
  ]"
  unit="%"
  show-value
/>
```

### LumaActiveRingChart

活动环图，中心翻牌显示当前扇区。`v-model:activeKey` 可双向绑定当前扇区，`autoplay` 控制自动轮播。

```vue
<LumaActiveRingChart
  v-model:active-key="activeKey"
  :items="[
    { key: 'ok', label: '正常', value: 60 },
    { key: 'warn', label: '告警', value: 30 },
    { key: 'down', label: '离线', value: 10 },
  ]"
  :interval="2500"
  @select="handleSelect"
/>
```

## 滚动列表

### LumaScrollBoard

滚动数据表。现代 props 用 `columns` + `rows`，`step` 支持逐行或 `'page'` 整页滚动；DataV 写法用 `config.header` + `config.data`。滚动表中的 HTML 字符串按普通文本渲染，不恢复上游 `v-html`，避免注入。

```vue
<!-- 现代 props -->
<LumaScrollBoard
  :columns="[
    { key: 'region', title: '区域' },
    { key: 'count', title: '数量', align: 'right' },
  ]"
  :rows="rows"
  :visible-rows="5"
  :interval="2000"
  @row-click="handleRowClick"
/>

<!-- DataV config 迁移 -->
<LumaScrollBoard
  :config="{
    header: ['区域', '数量'],
    data: [['甲区', 20], ['乙区', 18]],
    rowNum: 5,
    index: true,
  }"
/>
```

### LumaScrollRankingBoard

滚动排名榜，自动计算占比条。

```vue
<LumaScrollRankingBoard
  :items="[
    { key: 'a', label: '甲区', value: 200 },
    { key: 'b', label: '乙区', value: 160 },
  ]"
  unit="次"
  :visible-rows="5"
/>

<LumaScrollRankingBoard :config="{ data: [{ name: '甲区', value: 200 }], rowNum: 5, unit: '次' }" />
```

## 飞线图

### LumaFlylineChart

基于中心点的飞线图，`config.points` 支持坐标或 `{ position, text }`。

```vue
<LumaFlylineChart
  :config="{
    centerPoint: [0.5, 0.5],
    points: [
      { position: [0.1, 0.2], text: '北京' },
      { position: [0.8, 0.3], text: '上海' },
    ],
    flylineColor: '#35c8ff',
  }"
/>
```

### LumaFlylineChartEnhanced

增强版飞线图，`lines` 显式声明 `source` / `target`，可为每个点配置图标与文本。

```vue
<LumaFlylineChartEnhanced
  :config="{
    points: [
      { name: 'center', coordinate: [0.5, 0.5] },
      { name: 'bj', coordinate: [0.2, 0.3] },
    ],
    lines: [{ source: 'bj', target: 'center' }],
  }"
/>
```

## 原生 ECharts

### LumaCharts

`option` 类型即 ECharts 原生 `EChartsOption`，不过滤或转换任何属性。

```vue
<script setup lang="ts">
import type { LumaChartsOption } from '@luma/datav'
import { LumaCharts } from '@luma/datav'
import { shallowRef } from 'vue'

const option = shallowRef<LumaChartsOption>({
  xAxis: { type: 'category', data: ['一', '二', '三'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [120, 200, 150] }],
})
</script>

<template>
  <LumaCharts
    :option="option"
    theme="dark"
    :init-options="{ renderer: 'canvas', devicePixelRatio: 2 }"
    :set-option-options="{ notMerge: false, lazyUpdate: true }"
    :events="{ legendselectchanged: handleLegendChange }"
    @click="handleChartClick"
  />
</template>
```

组件默认 `autoResize`；通过 ref 可取得 `getInstance()`，并直接调用 `setOption`、`resize`、`dispatchAction`、`convertToPixel`、`convertFromPixel`、`containPixel`、`appendData`、`getDataURL`、`getConnectedDataURL`、`showLoading`、`hideLoading`、`on`、`off`、`clear` 与 `dispose`。

## 主题变量

组件默认值与 DataV 一致；现代 API 外观通过 `--luma-datav-*` 语义变量调整。在容器上覆盖变量即可换肤：

```css
.my-cockpit {
  --luma-datav-primary: #35c8ff;
  --luma-datav-secondary: #796cff;
  --luma-datav-accent: #6ff7cd;
  --luma-datav-surface: rgb(16 39 66 / 76%);
  --luma-datav-text: #edf9ff;
  --luma-datav-border: rgb(95 206 255 / 42%);
  --luma-datav-radius: 10px;
  --luma-datav-duration: 2800ms;
}
```

可用变量：`--luma-datav-primary`、`--luma-datav-secondary`、`--luma-datav-accent`、`--luma-datav-background`、`--luma-datav-surface`、`--luma-datav-surface-muted`、`--luma-datav-text`、`--luma-datav-text-muted`、`--luma-datav-border`、`--luma-datav-shadow`、`--luma-datav-radius`、`--luma-datav-duration`、`--luma-datav-focus-ring`、`--luma-datav-font-mono`。Cockpit 应在应用层把这些变量映射到 `--luma-cockpit-*` 浅色/深色主题。

## 无障碍与动画

- 连续动画在页面隐藏、离开视口、悬停、键盘聚焦以及 `prefers-reduced-motion` 时暂停。
- 图表和滚动组件均提供 `ariaLabel`（默认中文标签），可按业务覆盖。
- ResizeObserver 通过 `requestAnimationFrame` 合并；数字动画与定时器在更新或卸载时立即清理。

## 在 Admin 中以外链形式嵌入示例页

`@luma/datav` 是独立可视化包，不依赖 `@luma/core`，因此驾驶舱示例通常作为独立页面构建部署，再由 Admin 通过菜单外链引用，避免把可视化运行时打进后台主包。

Admin 的菜单支持两种外链目标：`externalTarget: '_blank'` 在新窗口打开，`externalTarget: '_self'` 配合内嵌页面组件在 Admin 壳层内以 `iframe` 呈现（参见 `apps/luma-admin/src/views/shared/ExternalFrameView.vue`）。

在菜单记录中声明一个内嵌页：

```ts
// 独立部署的 DataV 组件文档站地址
{
  externalLink: 'https://your-host.example.com/datav-guide/',
  component: 'shared/external-frame',
  name: 'DatavGuide',
  path: 'datav',
  meta: {
    externalTarget: '_self',
    icon: 'app:examples',
    order: 1,
    title: 'DataV 组件',
  },
}
```

`ExternalFrameView` 读取当前路由 `meta.externalLink` 作为 `iframe` 的 `src`，并用 `meta.title` 作为标题，无需为每个外链页写单独组件。若只想在新标签打开而不内嵌，去掉 `component` 并把 `externalTarget` 设为 `_blank` 即可。

本仓库的 `apps/luma-datav-guide` 是一个可运行的组件文档站（仿 DataV guide 结构），提供全部 15 个组件的实时预览、`config` 与现代 props 用法及属性表。它只依赖 `@luma/datav`、`vue`、`echarts`，构建后是纯静态资源，可独立托管到任意路径并作为上面 `externalLink` 的目标：

```bash
pnpm --filter @luma/datav build          # 指南站消费 datav 的构建产物
pnpm --filter luma-datav-guide dev       # 本地开发预览
pnpm --filter luma-datav-guide build     # 产出静态站点到 apps/luma-datav-guide/dist
```

指南站使用 hash 路由（`createWebHashHistory`）与相对 `base`，因此部署到子路径或嵌入 `iframe` 时无需额外配置服务器重写。

## 组件与 DataV 2.10.0 映射

完整的 38 个 DataV 组件到 15 个 `Luma*` 组件的映射表，见 [`packages/datav/README.md`](../packages/datav/README.md)。DataV 仅作为 MIT 许可下的重构基准，版权声明见 [`packages/datav/THIRD_PARTY_NOTICES.md`](../packages/datav/THIRD_PARTY_NOTICES.md)。
