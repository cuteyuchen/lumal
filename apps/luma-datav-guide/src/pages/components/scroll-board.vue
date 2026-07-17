<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { ScrollBoardConfig } from '@luma/datav'
import { LumaScrollBoard } from '@luma/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const config: ScrollBoardConfig = {
  header: ['区域', '任务', '完成率'],
  data: [
    ['华东', '1286', '92%'],
    ['华南', '934', '88%'],
    ['华北', '712', '81%'],
    ['西部', '508', '76%'],
    ['东北', '361', '69%'],
    ['西南', '297', '64%'],
  ],
  index: true,
  rowNum: 4,
  headerBGC: 'rgb(53 200 255 / 24%)',
  oddRowBGC: 'rgb(16 39 66 / 60%)',
  evenRowBGC: 'rgb(24 56 90 / 40%)',
}

// 在线调试可调属性（header/data 等复杂数据保持固定，仅暴露标量/开关型配置字段）
const playModel = reactive<Record<string, unknown>>({
  rowNum: 4,
  waitTime: 2000,
  hoverPause: true,
  carousel: 'single',
  index: true,
})

const playControls: PlaygroundControl[] = [
  { key: 'rowNum', label: '可见行数 rowNum', type: 'number', min: 1, max: 6, step: 1 },
  { key: 'waitTime', label: '轮播间隔 waitTime', type: 'number', min: 0, max: 6000, step: 200, hint: '毫秒，0 停止轮播' },
  { key: 'hoverPause', label: '悬停暂停 hoverPause', type: 'boolean' },
  {
    key: 'carousel',
    label: '轮播模式 carousel',
    type: 'select',
    options: [
      { label: '单行 single', value: 'single' },
      { label: '整页 page', value: 'page' },
    ],
  },
  { key: 'index', label: '序号列 index', type: 'boolean' },
]

// 把固定数据与可调字段合并成一份 config 传给组件
const playConfig = computed<ScrollBoardConfig>(() => ({
  ...config,
  rowNum: playModel.rowNum as number,
  waitTime: playModel.waitTime as number,
  hoverPause: playModel.hoverPause as boolean,
  carousel: playModel.carousel as 'single' | 'page',
  index: playModel.index as boolean,
}))

const configCode = `<script setup lang="ts">
import { LumaScrollBoard } from '@luma/datav'

const config = {
  header: ['区域', '任务', '完成率'],
  data: [
    ['华东', '1286', '92%'],
    ['华南', '934', '88%'],
    ['华北', '712', '81%'],
    ['西部', '508', '76%'],
    ['东北', '361', '69%'],
  ],
  index: true,
  rowNum: 4,
}
<\/script>

<template>
  <LumaScrollBoard :config="config" style="height: 240px" />
<\/template>`

const modernCode = `<LumaScrollBoard
  :rows="rows"
  :columns="[
    { key: 'area', label: '区域' },
    { key: 'count', label: '任务', align: 'right' },
    { key: 'rate', label: '完成率', align: 'right' },
  ]"
  row-key="area"
  :visible-rows="4"
  :interval="2000"
/>`

// 生成 config 用法代码（属性无法平铺表达，改为渲染完整 config 对象）
function playCodeGen(model: Record<string, unknown>): string {
  return `<LumaScrollBoard
  :config="{
    header: ['区域', '任务', '完成率'],
    data: [/* ... */],
    index: ${model.index},
    rowNum: ${model.rowNum},
    waitTime: ${model.waitTime},
    hoverPause: ${model.hoverPause},
    carousel: '${model.carousel}',
  }"
  style="height: 240px"
/>`
}

const propRows: PropRow[] = [
  { name: 'config', type: 'ScrollBoardConfig', description: 'DataV 原生配置（header/data/rowNum 等）。' },
  { name: 'rows', type: 'T[]', description: '现代 API 数据源（对象数组）。' },
  { name: 'columns', type: 'ScrollBoardColumn<T>[]', description: '现代 API 列定义（key/label/align/formatter）。' },
  { name: 'rowKey', type: 'keyof T | fn', description: '行唯一键。' },
  { name: 'visibleRows', type: 'number', description: '可见行数（等价 rowNum）。' },
  { name: 'interval', type: 'number', description: '轮播间隔（ms）。' },
  { name: 'step', type: "number | 'page'", description: '每次滚动行数或整页。' },
  { name: 'autoplay', type: 'boolean', default: 'true', description: '是否自动轮播。' },
]

const configRows: PropRow[] = [
  { name: 'header', type: 'string[]', description: '表头文案。' },
  { name: 'data', type: 'unknown[][]', description: '二维数据数组。' },
  { name: 'rowNum', type: 'number', description: '可见行数。' },
  { name: 'index', type: 'boolean', description: '是否显示序号列。' },
  { name: 'columnWidth', type: 'number[]', description: '各列宽度。' },
  { name: 'align', type: 'Align[]', description: '各列对齐。' },
  { name: 'headerBGC', type: 'string', description: '表头背景色。' },
  { name: 'oddRowBGC / evenRowBGC', type: 'string', description: '奇偶行背景色。' },
  { name: 'waitTime', type: 'number', description: '轮播间隔（ms）。' },
  { name: 'hoverPause', type: 'boolean', description: '悬停暂停。' },
  { name: 'carousel', type: "'page' | 'single'", description: '整页或单行轮播。' },
]
</script>

<template>
  <ComponentDoc
    title="ScrollBoard 轮播表"
    component-name="LumaScrollBoard"
    datav-name="scrollBoard"
    intro="表格行自动轮播，使用循环窗口索引不复制整份数据。支持 DataV 原生 config 与对象数组 + 列定义的现代 API。"
  >
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaScrollBoard"
      :controls="playControls"
      :model-value="playModel"
      :min-height="300"
      :code-gen="playCodeGen"
    >
      <LumaScrollBoard :config="playConfig" style="height: 240px; width: 100%;" />
    </Playground>

    <DemoBlock
      title="config 用法"
      description="header + 二维 data，与 DataV 原生写法一致。悬停可暂停。"
      :code="configCode"
      :min-height="280"
    >
      <LumaScrollBoard :config="config" style="height: 240px" />
    </DemoBlock>

    <h2>现代 API</h2>
    <p>使用对象数组与列定义，类型更明确，支持 <code>formatter</code> 与对齐：</p>
    <DemoBlock
      title="rows + columns 用法"
      description="见「查看代码」，columns 提供 key/label/align/formatter。"
      :code="modernCode"
      surface="plain"
      :min-height="80"
    >
      <p style="margin: 0; color: var(--guide-text-muted); font-size: 13px;">
        现代 API 用对象数组替代二维数组，配合 columns 声明列。
      </p>
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />

    <h2>config 字段</h2>
    <PropsTable :rows="configRows" name-label="字段" />

    <p class="guide-doc__note">
      注意：滚动表中的 HTML 字符串按普通文本渲染，不恢复上游 <code>v-html</code>，以避免注入风险。
    </p>
  </ComponentDoc>
</template>
