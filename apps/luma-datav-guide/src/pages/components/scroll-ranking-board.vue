<script setup lang="ts">
import type { PropRow } from '@/components/PropsTable.vue'
import type { RankingItem, ScrollRankingBoardConfig } from '@luma/datav'
import { LumaScrollRankingBoard } from '@luma/datav'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import PropsTable from '@/components/PropsTable.vue'

const items: RankingItem[] = [
  { key: 'a', label: '数据中心 A', value: 9820 },
  { key: 'b', label: '数据中心 B', value: 8610 },
  { key: 'c', label: '数据中心 C', value: 7430 },
  { key: 'd', label: '数据中心 D', value: 6120 },
  { key: 'e', label: '数据中心 E', value: 4980 },
  { key: 'f', label: '数据中心 F', value: 3720 },
]

const config: ScrollRankingBoardConfig = {
  data: [
    { name: '数据中心 A', value: 9820 },
    { name: '数据中心 B', value: 8610 },
    { name: '数据中心 C', value: 7430 },
    { name: '数据中心 D', value: 6120 },
    { name: '数据中心 E', value: 4980 },
  ],
  rowNum: 4,
  unit: '次',
}

const modernCode = `<script setup lang="ts">
import { LumaScrollRankingBoard } from '@luma/datav'

const items = [
  { key: 'a', label: '数据中心 A', value: 9820 },
  { key: 'b', label: '数据中心 B', value: 8610 },
  { key: 'c', label: '数据中心 C', value: 7430 },
  { key: 'd', label: '数据中心 D', value: 6120 },
]
<\/script>

<template>
  <LumaScrollRankingBoard :items="items" unit="次" :visible-rows="4" style="height: 240px" />
<\/template>`

const configCode = `<LumaScrollRankingBoard
  :config="{
    data: [
      { name: '数据中心 A', value: 9820 },
      { name: '数据中心 B', value: 8610 },
    ],
    rowNum: 4,
    unit: '次',
  }"
  style="height: 240px"
/>`

const propRows: PropRow[] = [
  { name: 'items', type: 'RankingItem[]', description: '现代 API 数据源（label/value/key）。' },
  { name: 'config', type: 'ScrollRankingBoardConfig', description: 'DataV 原生配置（data/rowNum/unit）。' },
  { name: 'visibleRows', type: 'number', description: '可见行数（等价 rowNum）。' },
  { name: 'interval', type: 'number', description: '轮播间隔（ms）。' },
  { name: 'autoplay', type: 'boolean', default: 'true', description: '是否自动轮播。' },
  { name: 'sort', type: "false | 'asc' | 'desc'", description: '排序方式。' },
  { name: 'unit', type: 'string', description: '数值单位。' },
  { name: 'formatter', type: '(value, item, index) => string', description: '数值格式化。' },
]

const configRows: PropRow[] = [
  { name: 'data', type: 'ScrollRankingDataItem[]', description: 'name + value 数据数组。' },
  { name: 'rowNum', type: 'number', description: '可见行数。' },
  { name: 'unit', type: 'string', description: '数值单位。' },
  { name: 'sort', type: 'boolean', description: '是否按值排序。' },
  { name: 'carousel', type: "'page' | 'single'", description: '整页或单行轮播。' },
  { name: 'waitTime', type: 'number', description: '轮播间隔（ms）。' },
  { name: 'valueFormatter', type: '(item) => string | number', description: '数值格式化。' },
]
</script>

<template>
  <ComponentDoc
    title="ScrollRankingBoard 排名轮播"
    component-name="LumaScrollRankingBoard"
    datav-name="scrollRankingBoard"
    intro="按数值排名的横向进度条轮播，自动计算占比与名次。支持现代 items 与 DataV 原生 config。"
  >
    <DemoBlock
      title="现代 items 用法"
      description="items 使用 label/value，自动排序并计算占比条。"
      :code="modernCode"
      :min-height="280"
    >
      <LumaScrollRankingBoard :items="items" unit="次" :visible-rows="4" style="height: 240px" />
    </DemoBlock>

    <DemoBlock
      title="config 用法"
      description="data 使用 name/value，与 DataV 原生写法一致。"
      :code="configCode"
      :min-height="280"
    >
      <LumaScrollRankingBoard :config="config" style="height: 240px" />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />

    <h2>config 字段</h2>
    <PropsTable :rows="configRows" name-label="字段" />
  </ComponentDoc>
</template>
