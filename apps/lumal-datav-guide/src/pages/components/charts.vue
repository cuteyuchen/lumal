<script setup lang="ts">
import type { DataVChartsOption, LumalChartsOption } from '@lumal/datav'
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumalCharts } from '@lumal/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const playModel = reactive<Record<string, unknown>>({
  autoResize: true,
  chartType: 'line',
})

const playControls: PlaygroundControl[] = [
  {
    key: 'chartType',
    label: 'DataV 图表类型',
    type: 'select',
    options: [
      { label: '折线 line', value: 'line' },
      { label: '柱状 bar', value: 'bar' },
    ],
    omitFromCode: true,
  },
  { key: 'autoResize', label: '自动重绘 autoResize', type: 'boolean' },
]

const axisStyle = {
  axisLabel: { style: { fill: '#cfeeff', fontSize: 11 } },
  axisLine: { style: { stroke: '#5fceff', lineWidth: 1 } },
  axisTick: { style: { stroke: '#5fceff', lineWidth: 1 } },
}

const nativeLineConfig: DataVChartsOption = {
  color: ['#35c8ff', '#6ff7cd'],
  grid: { bottom: 32, left: 48, right: 20, top: 42 },
  title: { offset: [0, -14], style: { fill: '#cfeeff', fontSize: 16 }, text: 'DataV 原生折线图' },
  xAxis: { ...axisStyle, data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: {
    ...axisStyle,
    data: 'value',
    splitLine: { show: true, style: { stroke: 'rgba(95,206,255,0.16)', lineWidth: 1 } },
  },
  series: [{
    animationCurve: 'easeOutCubic',
    data: [820, 932, 901, 1290, 1330, 1520, 1120],
    lineArea: { gradient: ['rgba(53,200,255,0.5)', 'rgba(53,200,255,0.02)'], show: true },
    linePoint: { radius: 3, style: { fill: '#6ff7cd', stroke: '#35c8ff' } },
    lineStyle: { lineWidth: 2, stroke: '#35c8ff' },
    name: '访问量',
    smooth: true,
    type: 'line',
  }],
}

const nativeBarConfig: DataVChartsOption = {
  color: ['#35c8ff', '#6ff7cd'],
  grid: { bottom: 32, left: 48, right: 20, top: 42 },
  title: { offset: [0, -14], style: { fill: '#cfeeff', fontSize: 16 }, text: 'DataV 原生柱状图' },
  xAxis: { ...axisStyle, data: ['华东', '华南', '华北', '西部', '东北'] },
  yAxis: {
    ...axisStyle,
    data: 'value',
    splitLine: { show: true, style: { stroke: 'rgba(95,206,255,0.16)', lineWidth: 1 } },
  },
  series: [{
    barWidth: 22,
    data: [128, 92, 74, 51, 33],
    gradient: { color: ['#35c8ff', '#6ff7cd'], local: true },
    label: { position: 'top', show: true, style: { fill: '#cfeeff', fontSize: 11 } },
    name: '区域数量',
    type: 'bar',
  }],
}

const playConfig = computed(() => playModel.chartType === 'bar' ? nativeBarConfig : nativeLineConfig)

const echartsOption: LumalChartsOption = {
  grid: { bottom: 32, left: 44, right: 20, top: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    axisLine: { lineStyle: { color: '#5fceff' } },
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    type: 'category',
  },
  yAxis: {
    axisLine: { lineStyle: { color: '#5fceff' } },
    splitLine: { lineStyle: { color: 'rgba(95,206,255,0.12)' } },
    type: 'value',
  },
  series: [{
    areaStyle: { opacity: 0.24 },
    data: [820, 932, 901, 1290, 1330, 1520, 1120],
    itemStyle: { color: '#6ff7cd' },
    lineStyle: { color: '#35c8ff', width: 2 },
    smooth: true,
    type: 'line',
  }],
}

const nativeCode = `<script setup lang="ts">
import type { DataVChartsOption } from '@lumal/datav'
import { LumalCharts } from '@lumal/datav'

const config: DataVChartsOption = {
  xAxis: { data: ['周一', '周二', '周三', '周四'] },
  yAxis: { data: 'value' },
  series: [{
    type: 'line',
    data: [820, 932, 901, 1290],
    smooth: true,
    lineArea: { show: true, gradient: ['#35c8ff', 'rgba(53, 200, 255, 0)'] },
  }],
}
<\/script>

<template>
  <LumalCharts :config="config" style="height: 260px" />
<\/template>`

const echartsCode = `<script setup lang="ts">
import type { LumalChartsOption } from '@lumal/datav'

const option: LumalChartsOption = {
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [820, 932, 901, 1290] }],
}
<\/script>

<template>
  <!-- Lumal 兼容扩展，不是 DataV 原生协议 -->
  <LumalCharts :option="option" theme="dark" style="height: 260px" />
<\/template>`

const propRows: PropRow[] = [
  { name: 'config', type: 'DataVChartsOption', description: 'DataV 原生 @jiaminghi/charts 配置；传入后优先使用官方 Canvas 运行时。' },
  { name: 'option', type: 'EChartsOption', default: '{}', description: 'Lumal 兼容扩展；仅在未传 config 时启用 ECharts。' },
  { name: 'autoResize', type: 'boolean', default: 'true', description: '两种运行时均在容器变化时自动 resize。' },
  { name: 'theme', type: 'string | object | null', description: '仅 ECharts 模式：主题名或主题对象。' },
  { name: 'initOptions', type: 'EChartsInitOpts', description: '仅 ECharts 模式：echarts.init 初始化参数。' },
  { name: 'setOptionOptions', type: 'SetOptionOpts', description: '仅 ECharts 模式：setOption 参数。' },
  { name: 'events', type: 'Record<string, Handler>', default: '{}', description: '仅 ECharts 模式：批量绑定事件。' },
  { name: 'group', type: 'string', description: '仅 ECharts 模式：联动分组名。' },
  { name: 'loading', type: 'boolean', default: 'false', description: '仅 ECharts 模式：显示加载动画。' },
]

const methodRows: PropRow[] = [
  { name: 'getInstance()', type: '() => Charts | ECharts', description: '取得当前运行时实例。' },
  { name: 'getNativeInstance()', type: '() => Charts | undefined', description: '取得 DataV 官方 Charts 实例。' },
  { name: 'setConfig()', type: '(config, animationEnd?) => void', description: '更新 DataV 原生配置。' },
  { name: 'setOption()', type: '(option, opts?) => void', description: '按当前模式更新 DataV config 或 ECharts option。' },
  { name: 'resize()', type: '() => void', description: '按当前模式触发 resize。' },
  { name: 'ECharts 方法', type: 'dispatchAction / getDataURL / on / off / ...', description: '仅 ECharts 扩展模式可用。' },
]
</script>

<template>
  <ComponentDoc
    title="Charts 图表容器"
    component-name="LumalCharts"
    datav-name="charts"
    intro="同时提供两条明确协议：config 使用 DataV 官方 @jiaminghi/charts Canvas 运行时；option 保留既有 ECharts 兼容扩展。两者不做配置互转。"
  >
    <Playground
      v-model="playModel"
      title="DataV 原生运行时"
      description="切换折线与柱状示例，传入的均是 @jiaminghi/charts 原生 config。"
      component-name="LumalCharts"
      :controls="playControls"
      :min-height="300"
    >
      <LumalCharts
        :config="playConfig"
        :auto-resize="playModel.autoResize as boolean"
        style="height: 260px; width: 420px;"
      />
    </Playground>

    <DemoBlock
      title="DataV 原生 config"
      description="xAxis/yAxis 使用 data 字段，series 的 lineArea、linePoint 等字段由官方 Charts 直接解释。"
      :code="nativeCode"
      :min-height="300"
    >
      <LumalCharts :config="nativeLineConfig" style="height: 260px" />
    </DemoBlock>

    <DemoBlock
      title="ECharts 兼容扩展"
      description="旧项目可继续传 option；这是 Lumal 扩展协议，不再标注为 DataV 原生 Charts。"
      :code="echartsCode"
      :min-height="300"
    >
      <LumalCharts :option="echartsOption" theme="dark" style="height: 260px" />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />

    <h2>实例方法</h2>
    <PropsTable :rows="methodRows" name-label="方法" />
  </ComponentDoc>
</template>
