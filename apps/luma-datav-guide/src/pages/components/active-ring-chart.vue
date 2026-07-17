<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { DataValueItem } from '@luma/datav'
import { LumaActiveRingChart } from '@luma/datav'
import { reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const items: DataValueItem[] = [
  { key: 'online', label: '在线', value: 620 },
  { key: 'idle', label: '空闲', value: 240 },
  { key: 'offline', label: '离线', value: 90 },
]

// 在线调试可调属性（数据 items 为数组，保持固定，仅暴露标量属性）
const playModel = reactive<Record<string, unknown>>({
  interval: 2500,
  autoplay: true,
})

const playControls: PlaygroundControl[] = [
  { key: 'interval', label: '切换间隔 interval', type: 'number', min: 500, max: 6000, step: 250, hint: '毫秒' },
  { key: 'autoplay', label: '自动轮播 autoplay', type: 'boolean' },
]

const modernCode = `<script setup lang="ts">
import { LumaActiveRingChart } from '@luma/datav'

const items = [
  { key: 'online', label: '在线', value: 620 },
  { key: 'idle', label: '空闲', value: 240 },
  { key: 'offline', label: '离线', value: 90 },
]
<\/script>

<template>
  <LumaActiveRingChart :items="items" :interval="2500" style="height: 240px" />
<\/template>`

const configCode = `<LumaActiveRingChart
  :config="{
    data: [
      { name: '在线', value: 620 },
      { name: '空闲', value: 240 },
      { name: '离线', value: 90 },
    ],
    radius: '60%',
    activeRadius: '68%',
    digitalFlopUnit: '台',
  }"
  style="height: 240px"
/>`

const propRows: PropRow[] = [
  { name: 'items', type: 'DataValueItem[]', description: '现代数据项：key、label、value、可选 color。' },
  { name: 'config', type: 'ActiveRingChartConfig', description: 'DataV 兼容配置，data 使用 name/value 结构。' },
  { name: 'interval', type: 'number', default: '2000', description: '活动扇区自动切换间隔（毫秒）。' },
  { name: 'autoplay', type: 'boolean', default: 'true', description: '是否自动轮播活动扇区。' },
  { name: 'v-model:activeKey', type: 'DataValueKey', description: '当前激活项的受控绑定。' },
  { name: 'ariaLabel', type: 'string', default: "'活动环图'", description: '无障碍标签。' },
]

const configRows: PropRow[] = [
  { name: 'data', type: 'ActiveRingChartDataItem[]', description: 'name/value 数据项。' },
  { name: 'radius', type: 'number | string', description: '环形基础半径。' },
  { name: 'activeRadius', type: 'number | string', description: '激活扇区放大后的半径。' },
  { name: 'lineWidth', type: 'number', description: '环形线宽。' },
  { name: 'activeTimeGap', type: 'number', description: '扇区切换间隔（毫秒）。' },
  { name: 'digitalFlopStyle', type: 'DigitalFlopStyle', description: '中心数字翻牌样式。' },
  { name: 'digitalFlopToFixed', type: 'number', description: '中心数字小数位。' },
  { name: 'digitalFlopUnit', type: 'string', description: '中心数字单位。' },
  { name: 'showOriginValue', type: 'boolean', description: '中心显示原始值而非百分比。' },
  { name: 'color', type: 'string[]', description: '扇区配色。' },
]
</script>

<template>
  <ComponentDoc
    title="ActiveRingChart 活动环图"
    component-name="LumaActiveRingChart"
    datav-name="activeRingChart"
    intro="使用 ECharts 双层 Pie 实现活动扇区，自动轮播高亮当前项并在中心以数字翻牌显示占比。"
  >
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaActiveRingChart"
      :controls="playControls"
      :model-value="playModel"
      :min-height="280"
    >
      <LumaActiveRingChart
        :items="items"
        :interval="playModel.interval as number"
        :autoplay="playModel.autoplay as boolean"
        style="height: 240px; width: 360px;"
      />
    </Playground>

    <DemoBlock
      title="现代 props"
      description="传入 items 即可，组件自动轮播高亮扇区并联动中心数字。"
      :code="modernCode"
      :min-height="280"
    >
      <LumaActiveRingChart :items="items" :interval="2500" style="height: 240px" />
    </DemoBlock>

    <DemoBlock
      title="DataV config"
      description="沿用 DataV 的 data name/value 结构与 digitalFlop* 系列字段。"
      :code="configCode"
      :min-height="280"
    >
      <LumaActiveRingChart
        :config="{
          data: [
            { name: '在线', value: 620 },
            { name: '空闲', value: 240 },
            { name: '离线', value: 90 },
          ],
          radius: '60%',
          activeRadius: '68%',
          digitalFlopUnit: '台',
        }"
        style="height: 240px"
      />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />

    <h2>config 字段</h2>
    <PropsTable :rows="configRows" name-label="字段" />
  </ComponentDoc>
</template>
