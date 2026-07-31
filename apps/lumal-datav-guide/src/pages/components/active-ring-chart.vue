<script setup lang="ts">
import type { DataValueItem } from '@lumal/datav'
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumalActiveRingChart } from '@lumal/datav'
import { computed, reactive } from 'vue'
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
  radius: 55,
  activeRadius: 65,
  lineWidth: 20,
  unit: '台',
  showOriginValue: false,
})

const playControls: PlaygroundControl[] = [
  { key: 'interval', label: '切换间隔 interval', type: 'number', min: 500, max: 6000, step: 250, hint: '毫秒' },
  { key: 'autoplay', label: '自动轮播 autoplay', type: 'boolean' },
  { key: 'radius', label: '基础半径 radius(%)', type: 'number', min: 30, max: 80, step: 1, omitFromCode: true },
  { key: 'activeRadius', label: '激活半径 activeRadius(%)', type: 'number', min: 20, max: 90, step: 1, hint: '可小于基础半径，激活项会向内收缩', omitFromCode: true },
  { key: 'lineWidth', label: '线宽 lineWidth', type: 'number', min: 4, max: 40, step: 1, omitFromCode: true },
  { key: 'unit', label: '中心单位 unit', type: 'text', omitFromCode: true },
  { key: 'showOriginValue', label: '显示原值 showOriginValue', type: 'boolean', omitFromCode: true },
]

const playConfig = computed(() => ({
  radius: `${playModel.radius}%`,
  activeRadius: `${playModel.activeRadius}%`,
  lineWidth: playModel.lineWidth as number,
  digitalFlopUnit: playModel.unit as string,
  showOriginValue: playModel.showOriginValue as boolean,
  activeTimeGap: playModel.interval as number,
}))

const modernCode = `<script setup lang="ts">
import { LumalActiveRingChart } from '@lumal/datav'

const items = [
  { key: 'online', label: '在线', value: 620 },
  { key: 'idle', label: '空闲', value: 240 },
  { key: 'offline', label: '离线', value: 90 },
]
<\/script>

<template>
  <LumalActiveRingChart :items="items" :interval="2500" style="height: 240px" />
<\/template>`

const configCode = `<LumalActiveRingChart
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
  { name: 'interval', type: 'number', default: 'undefined', description: '活动扇区自动切换间隔（毫秒），优先于 config.activeTimeGap。' },
  { name: 'autoplay', type: 'boolean', default: 'true', description: '是否自动轮播活动扇区。' },
  { name: 'v-model:activeKey', type: 'DataValueKey', description: '当前激活项的受控绑定。' },
  { name: 'ariaLabel', type: 'string', default: '\'活动环图\'', description: '无障碍标签。' },
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
    component-name="LumalActiveRingChart"
    datav-name="activeRingChart"
    intro="对齐 DataV 活动环几何：每个扇区保持固定线宽，当前项按 activeRadius 向外放大或向内收缩，中心数字同步显示占比。"
  >
    <Playground
      v-model="playModel"
      title="在线调试"
      description="实时修改基础半径与激活半径；将 activeRadius 调到 radius 以下可验证向内收缩行为。"
      component-name="LumalActiveRingChart"
      :controls="playControls"
      :min-height="280"
    >
      <LumalActiveRingChart
        :items="items"
        :interval="playModel.interval as number"
        :autoplay="playModel.autoplay as boolean"
        :config="playConfig"
        style="height: 240px; width: 360px;"
      />
    </Playground>

    <DemoBlock
      title="现代 props"
      description="传入 items 即可，组件自动轮播高亮扇区并联动中心数字。"
      :code="modernCode"
      :min-height="280"
    >
      <LumalActiveRingChart :items="items" :interval="2500" style="height: 240px" />
    </DemoBlock>

    <DemoBlock
      title="DataV config"
      description="沿用 DataV 的 data name/value 结构与 digitalFlop* 系列字段。"
      :code="configCode"
      :min-height="280"
    >
      <LumalActiveRingChart
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
