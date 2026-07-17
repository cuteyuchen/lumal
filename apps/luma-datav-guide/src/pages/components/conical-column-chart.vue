<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { DataValueItem } from '@luma/datav'
import { LumaConicalColumnChart } from '@luma/datav'
import { reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const items: DataValueItem[] = [
  { key: 'a', label: '光伏', value: 93 },
  { key: 'b', label: '风电', value: 78 },
  { key: 'c', label: '水电', value: 66 },
  { key: 'd', label: '火电', value: 41 },
]

// 在线调试可调属性（数据 items 与 images 为数组，保持固定/略过，仅暴露标量属性）
const playModel = reactive<Record<string, unknown>>({
  unit: 'MW',
  showValue: true,
  sort: false,
  max: 0,
  fontSize: 12,
  columnColor: '#35c8ff',
  textColor: '#cfeeff',
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
  { key: 'max', label: '满刻度 max', type: 'number', min: 0, max: 200, step: 5, hint: '0 表示按数据' },
  { key: 'fontSize', label: '文字大小 fontSize', type: 'number', min: 8, max: 32, step: 1 },
  { key: 'columnColor', label: '锥柱颜色 columnColor', type: 'color' },
  { key: 'textColor', label: '文字颜色 textColor', type: 'color' },
]

const modernCode = `<script setup lang="ts">
import { LumaConicalColumnChart } from '@luma/datav'

const items = [
  { key: 'a', label: '光伏', value: 93 },
  { key: 'b', label: '风电', value: 78 },
  { key: 'c', label: '水电', value: 66 },
  { key: 'd', label: '火电', value: 41 },
]
<\/script>

<template>
  <LumaConicalColumnChart :items="items" unit="MW" show-value style="height: 260px" />
<\/template>`

const configCode = `<LumaConicalColumnChart
  :config="{
    data: [
      { name: '光伏', value: 93 },
      { name: '风电', value: 78 },
      { name: '水电', value: 66 },
    ],
    showValue: true,
    columnColor: '#35c8ff',
  }"
  style="height: 260px"
/>`

const propRows: PropRow[] = [
  { name: 'items', type: 'DataValueItem[]', description: '现代数据项：key、label、value。' },
  { name: 'config', type: 'ConicalColumnChartConfig', description: 'DataV 兼容配置，data 使用 name/value。' },
  { name: 'max', type: 'number', description: '满刻度基准值。' },
  { name: 'unit', type: 'string', description: '数值单位。' },
  { name: 'sort', type: "false | 'asc' | 'desc'", description: '排序方式。' },
  { name: 'showValue', type: 'boolean', description: '是否显示数值。' },
  { name: 'images', type: 'string[]', description: '锥柱贴图数组。' },
  { name: 'imageSideLength', type: 'number', description: '贴图边长。' },
  { name: 'fontSize', type: 'number', description: '文字大小。' },
  { name: 'columnColor', type: 'string', description: '锥柱颜色。' },
  { name: 'textColor', type: 'string', description: '文字颜色。' },
]
</script>

<template>
  <ComponentDoc
    title="ConicalColumnChart 锥形柱图"
    component-name="LumaConicalColumnChart"
    datav-name="conicalColumnChart"
    intro="锥形柱状对比图，适合少量分类的量级展示，可选贴图与数值标签。"
  >
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaConicalColumnChart"
      :controls="playControls"
      :model-value="playModel"
      :min-height="300"
    >
      <LumaConicalColumnChart
        :items="items"
        :unit="playModel.unit as string"
        :show-value="playModel.showValue as boolean"
        :sort="(playModel.sort as 'asc' | 'desc') || false"
        :max="(playModel.max as number) || undefined"
        :font-size="playModel.fontSize as number"
        :column-color="playModel.columnColor as string"
        :text-color="playModel.textColor as string"
        style="height: 260px; width: 360px;"
      />
    </Playground>

    <DemoBlock
      title="现代 props"
      description="items + unit + show-value 渲染锥形柱。"
      :code="modernCode"
      :min-height="300"
    >
      <LumaConicalColumnChart :items="items" unit="MW" show-value style="height: 260px" />
    </DemoBlock>

    <DemoBlock
      title="DataV config"
      description="沿用 DataV 的 data name/value 与 columnColor/showValue 字段。"
      :code="configCode"
      :min-height="300"
    >
      <LumaConicalColumnChart
        :config="{
          data: [
            { name: '光伏', value: 93 },
            { name: '风电', value: 78 },
            { name: '水电', value: 66 },
          ],
          showValue: true,
          columnColor: '#35c8ff',
        }"
        style="height: 260px"
      />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>
