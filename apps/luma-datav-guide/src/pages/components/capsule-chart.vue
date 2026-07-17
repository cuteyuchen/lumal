<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { DataValueItem } from '@luma/datav'
import { LumaCapsuleChart } from '@luma/datav'
import { reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const items: DataValueItem[] = [
  { key: 'east', label: '华东', value: 128 },
  { key: 'south', label: '华南', value: 92 },
  { key: 'north', label: '华北', value: 74 },
  { key: 'west', label: '西部', value: 51 },
]

// 在线调试可调属性（数据 items 与 colors 为数组，保持固定/略过，仅暴露标量属性）
const playModel = reactive<Record<string, unknown>>({
  unit: '次',
  showValue: true,
  sort: false,
  max: 0,
})

const playControls: PlaygroundControl[] = [
  { key: 'unit', label: '单位 unit', type: 'text' },
  { key: 'showValue', label: '显示数值 showValue', type: 'boolean' },
  {
    key: 'sort',
    label: '排序 sort',
    type: 'select',
    options: [
      { label: '不排序 false', value: '' },
      { label: '升序 asc', value: 'asc' },
      { label: '降序 desc', value: 'desc' },
    ],
  },
  { key: 'max', label: '满刻度 max', type: 'number', min: 0, max: 500, step: 10, hint: '0 表示取最大值' },
]

const modernCode = `<script setup lang="ts">
import { LumaCapsuleChart } from '@luma/datav'

const items = [
  { key: 'east', label: '华东', value: 128 },
  { key: 'south', label: '华南', value: 92 },
  { key: 'north', label: '华北', value: 74 },
  { key: 'west', label: '西部', value: 51 },
]
<\/script>

<template>
  <LumaCapsuleChart :items="items" unit="次" show-value />
<\/template>`

const configCode = `<LumaCapsuleChart
  :config="{
    data: [
      { name: '华东', value: 128 },
      { name: '华南', value: 92 },
      { name: '华北', value: 74 },
    ],
    unit: '次',
    showValue: true,
  }"
/>`

const propRows: PropRow[] = [
  { name: 'items', type: 'DataValueItem[]', description: '现代数据项：key、label、value。' },
  { name: 'config', type: 'CapsuleChartConfig', description: 'DataV 兼容配置，data 使用 name/value。' },
  { name: 'colors', type: 'string[]', description: '胶囊配色数组。' },
  { name: 'max', type: 'number', description: '满刻度基准值，默认取最大值。' },
  { name: 'unit', type: 'string', description: '数值单位。' },
  { name: 'sort', type: "false | 'asc' | 'desc'", description: '排序方式。' },
  { name: 'showValue', type: 'boolean', description: '是否显示数值。' },
  { name: 'ariaLabel', type: 'string', default: "'胶囊图'", description: '无障碍标签。' },
]
</script>

<template>
  <ComponentDoc
    title="CapsuleChart 胶囊图"
    component-name="LumaCapsuleChart"
    datav-name="capsuleChart"
    intro="横向胶囊排行图，按数值绘制填充比例，适合区域或指标对比。"
  >
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaCapsuleChart"
      :controls="playControls"
      :model-value="playModel"
      :min-height="200"
    >
      <LumaCapsuleChart
        :items="items"
        :unit="playModel.unit as string"
        :show-value="playModel.showValue as boolean"
        :sort="(playModel.sort as 'asc' | 'desc') || false"
        :max="(playModel.max as number) || undefined"
        style="height: 240px; width: 360px;"
      />
    </Playground>

    <DemoBlock
      title="现代 props"
      description="items + unit + show-value 即可渲染排行胶囊。"
      :code="modernCode"
      :min-height="200"
    >
      <LumaCapsuleChart :items="items" unit="次" show-value />
    </DemoBlock>

    <DemoBlock
      title="DataV config"
      description="沿用 DataV 的 data name/value 与 unit/showValue 字段。"
      :code="configCode"
      :min-height="200"
    >
      <LumaCapsuleChart
        :config="{
          data: [
            { name: '华东', value: 128 },
            { name: '华南', value: 92 },
            { name: '华北', value: 74 },
          ],
          unit: '次',
          showValue: true,
        }"
      />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>
