<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { LumaChartsOption } from '@luma/datav'
import { LumaCharts } from '@luma/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

// 在线调试可调属性（option 为对象无法平铺，保持固定，仅暴露标量属性 theme / autoResize）
const playModel = reactive<Record<string, unknown>>({
  theme: 'dark',
  autoResize: true,
})

const playControls: PlaygroundControl[] = [
  {
    key: 'theme',
    label: '主题 theme',
    type: 'select',
    options: [
      { label: '暗色 dark', value: 'dark' },
      { label: '默认 default', value: '' },
    ],
  },
  { key: 'autoResize', label: '自动重绘 autoResize', type: 'boolean' },
]

const lineOption = computed<LumaChartsOption>(() => ({
  grid: { left: 44, right: 20, top: 30, bottom: 32 },
  tooltip: { trigger: 'axis' },
  legend: { textStyle: { color: '#cfeeff' }, top: 0 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    axisLine: { lineStyle: { color: '#5fceff' } },
  },
  yAxis: { type: 'value', axisLine: { lineStyle: { color: '#5fceff' } }, splitLine: { lineStyle: { color: 'rgba(95,206,255,0.12)' } } },
  series: [
    {
      name: '访问量',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.24 },
      lineStyle: { color: '#35c8ff', width: 2 },
      itemStyle: { color: '#6ff7cd' },
      data: [820, 932, 901, 1290, 1330, 1520, 1120],
    },
  ],
}))

const barOption = computed<LumaChartsOption>(() => ({
  grid: { left: 44, right: 20, top: 20, bottom: 32 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: ['华东', '华南', '华北', '西部', '东北'],
    axisLine: { lineStyle: { color: '#5fceff' } },
  },
  yAxis: { type: 'value', axisLine: { lineStyle: { color: '#5fceff' } }, splitLine: { lineStyle: { color: 'rgba(95,206,255,0.12)' } } },
  series: [
    {
      type: 'bar',
      barWidth: 22,
      itemStyle: { color: '#35c8ff', borderRadius: [4, 4, 0, 0] },
      data: [128, 92, 74, 51, 33],
    },
  ],
}))

const lineCode = `<script setup lang="ts">
import type { LumaChartsOption } from '@luma/datav'
import { LumaCharts } from '@luma/datav'

const option: LumaChartsOption = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, areaStyle: {}, data: [820, 932, 901, 1290, 1330, 1520, 1120] }],
}
<\/script>

<template>
  <LumaCharts :option="option" theme="dark" style="height: 260px" />
<\/template>`

const barCode = `<LumaCharts :option="barOption" theme="dark" style="height: 240px" />`

const advancedCode = `<LumaCharts
  :option="option"
  theme="dark"
  :init-options="{ renderer: 'canvas', devicePixelRatio: 2 }"
  :set-option-options="{ notMerge: false, lazyUpdate: true }"
  :events="{ legendselectchanged: handleLegendChange }"
  @click="handleChartClick"
/>`

const instanceCode = `<script setup lang="ts">
import { ref } from 'vue'
import { LumaCharts } from '@luma/datav'

const chart = ref<InstanceType<typeof LumaCharts>>()

function exportImage() {
  const url = chart.value?.getDataURL({ type: 'png', pixelRatio: 2 })
  // 通过 ref 直接调用底层 ECharts 实例方法
}
<\/script>

<template>
  <LumaCharts ref="chart" :option="option" />
<\/template>`

const propRows: PropRow[] = [
  { name: 'option', type: 'EChartsOption', description: '原生 ECharts option，不做任何过滤或转换。' },
  { name: 'theme', type: 'string | object | null', description: '注册的主题名或主题对象。' },
  { name: 'initOptions', type: 'EChartsInitOpts', description: 'echarts.init 的初始化参数（renderer、devicePixelRatio 等）。' },
  { name: 'setOptionOptions', type: 'SetOptionOpts', description: 'setOption 的参数，如 notMerge、lazyUpdate。' },
  { name: 'autoResize', type: 'boolean', default: 'true', description: '容器尺寸变化时自动 resize。' },
  { name: 'events', type: 'Record<string, Handler>', default: '{}', description: '批量绑定 ECharts 事件。' },
  { name: 'group', type: 'string', description: '联动分组名，用于多图联动。' },
  { name: 'loading', type: 'boolean', default: 'false', description: '显示加载动画。' },
  { name: 'loadingType', type: 'string', description: '加载动画类型。' },
  { name: 'loadingOptions', type: 'object', description: '加载动画配置。' },
]

const methodRows: PropRow[] = [
  { name: 'getInstance()', type: '() => ECharts', description: '取得底层 ECharts 实例。' },
  { name: 'setOption()', type: '(option, opts?) => void', description: '手动设置 option。' },
  { name: 'resize()', type: '() => void', description: '手动触发重绘。' },
  { name: 'dispatchAction()', type: '(payload) => void', description: '派发交互行为。' },
  { name: 'getDataURL()', type: '(opts?) => string', description: '导出图表图片。' },
  { name: 'showLoading / hideLoading', type: '() => void', description: '控制加载态。' },
  { name: 'on / off / clear / dispose', type: '() => void', description: '事件绑定、清空与销毁。' },
]
</script>

<template>
  <ComponentDoc
    title="Charts 原生 ECharts"
    component-name="LumaCharts"
    datav-name="charts"
    intro="直接封装原生 ECharts。option 使用完整 EChartsOption，不过滤或转换任何图表属性，并暴露 ECharts 实例、事件与常用实例方法。"
  >
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaCharts"
      :controls="playControls"
      :model-value="playModel"
      :min-height="300"
    >
      <LumaCharts
        :option="lineOption"
        :theme="(playModel.theme as string) || undefined"
        :auto-resize="playModel.autoResize as boolean"
        style="height: 260px; width: 360px;"
      />
    </Playground>

    <DemoBlock
      title="折线面积图"
      description="option 就是原生 EChartsOption，已有的 ECharts 配置可直接迁移。"
      :code="lineCode"
      :min-height="300"
    >
      <LumaCharts :option="lineOption" theme="dark" style="height: 260px" />
    </DemoBlock>

    <DemoBlock
      title="柱状图"
      description="容器尺寸变化时默认自动 resize。"
      :code="barCode"
      :min-height="280"
    >
      <LumaCharts :option="barOption" theme="dark" style="height: 240px" />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />

    <h2>进阶用法</h2>
    <p>透传初始化参数、setOption 参数与批量事件：</p>
    <DemoBlock
      title="透传参数与事件"
      description="init-options、set-option-options 与 events 分别透传给 echarts.init、setOption 与实例事件绑定。"
      :code="advancedCode"
      surface="plain"
      :min-height="80"
    >
      <p style="margin: 0; color: var(--guide-text-muted); font-size: 13px;">
        见右侧「查看代码」，此处仅展示配置写法。
      </p>
    </DemoBlock>

    <h2>实例方法</h2>
    <p>通过组件 ref 取得实例方法，无需自行持有 ECharts 实例：</p>
    <PropsTable :rows="methodRows" name-label="方法" />
    <DemoBlock
      title="通过 ref 调用实例方法"
      description="ref 暴露 getInstance 与常用 ECharts 实例方法。"
      :code="instanceCode"
      surface="plain"
      :min-height="80"
    >
      <p style="margin: 0; color: var(--guide-text-muted); font-size: 13px;">
        见「查看代码」，导出图片等操作直接调用 ref 上的方法。
      </p>
    </DemoBlock>
  </ComponentDoc>
</template>
