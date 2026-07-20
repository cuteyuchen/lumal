<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { ConicalColumnChartConfig, DataValueItem } from '@lumal/datav'
import { LumalConicalColumnChart } from '@lumal/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const officialData = [
  { name: '周口', value: 55 },
  { name: '南阳', value: 120 },
  { name: '西峡', value: 71 },
  { name: '驻马店', value: 66 },
  { name: '新乡', value: 80 },
  { name: '信阳', value: 35 },
  { name: '漯河', value: 15 },
] as const

const officialImages = Array.from(
  { length: officialData.length },
  (_, index) => `/img/conicalColumnChart/${index + 1}st.png`,
)

const officialConfig: ConicalColumnChartConfig = {
  data: officialData,
  img: officialImages,
}

const officialValueConfig: ConicalColumnChartConfig = {
  ...officialConfig,
  showValue: true,
}

const energyItems: DataValueItem[] = [
  { key: 'a', label: '光伏', value: 93 },
  { key: 'b', label: '风电', value: 78 },
  { key: 'c', label: '水电', value: 66 },
  { key: 'd', label: '火电', value: 41 },
]

const playModel = reactive<Record<string, unknown>>({
  ariaLabel: 'DataV 官方排名锥形柱图',
  itemCount: officialData.length,
  unit: '',
  showValue: true,
  sort: 'desc',
  max: 0,
  showImages: true,
  imageUrls: officialImages.join(', '),
  imageSideLength: 30,
  fontSize: 12,
  columnColor: 'rgba(0, 194, 255, 0.4)',
  textColor: '#ffffff',
})

const playControls: PlaygroundControl[] = [
  { key: 'ariaLabel', label: '无障碍标签 ariaLabel', type: 'text' },
  { key: 'itemCount', label: '数据数量 items', type: 'number', min: 1, max: officialData.length, step: 1, omitFromCode: true },
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
  { key: 'max', label: '满刻度 max', type: 'number', min: 0, max: 200, step: 5, hint: '0 表示按当前数据最大值自动计算。' },
  { key: 'showImages', label: '显示柱顶图片 images', type: 'boolean', omitFromCode: true },
  {
    key: 'imageUrls',
    label: '图片地址 images',
    type: 'text',
    hint: '多个地址使用英文逗号分隔，排序后按名次依次使用。',
    omitFromCode: true,
    hidden: model => !model.showImages,
  },
  {
    key: 'imageSideLength',
    label: '图片边长 imageSideLength',
    type: 'number',
    min: 0,
    max: 80,
    step: 1,
    hidden: model => !model.showImages,
  },
  { key: 'fontSize', label: '文字大小 fontSize', type: 'number', min: 8, max: 32, step: 1 },
  {
    key: 'columnColor',
    label: '锥柱颜色 columnColor',
    type: 'text',
    hint: '支持 rgba() 等带透明度的 CSS 颜色，DataV 默认透明度为 0.4。',
  },
  { key: 'textColor', label: '文字颜色 textColor', type: 'color' },
]

function normalizeItemCount(value: unknown): number {
  const count = Number(value)
  if (!Number.isFinite(count))
    return officialData.length
  return Math.min(officialData.length, Math.max(1, Math.round(count)))
}

function normalizePositive(value: unknown, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

function parseImageUrls(value: unknown): string[] {
  if (typeof value !== 'string')
    return []
  return value.split(',').map(url => url.trim()).filter(Boolean)
}

function escapeAttribute(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

const playItems = computed<DataValueItem[]>(() => officialData
  .slice(0, normalizeItemCount(playModel.itemCount))
  .map((item, index) => ({ key: `${item.name}-${index}`, label: item.name, value: item.value })))

const playImages = computed(() => playModel.showImages ? parseImageUrls(playModel.imageUrls) : [])
const playMax = computed(() => {
  const value = Number(playModel.max)
  return Number.isFinite(value) && value > 0 ? value : undefined
})

function formatItems(items: readonly DataValueItem[]): string {
  return items
    .map(item => `  { key: ${JSON.stringify(item.key)}, label: ${JSON.stringify(item.label)}, value: ${item.value} },`)
    .join('\n')
}

function formatData(data: typeof officialData): string {
  return data.map(item => `    { name: ${JSON.stringify(item.name)}, value: ${item.value} },`).join('\n')
}

function formatImages(images: readonly string[], indent = '  '): string {
  return images.map(url => `${indent}${JSON.stringify(url)},`).join('\n')
}

function buildPlaygroundCode(model: Record<string, unknown>): string {
  const itemCount = normalizeItemCount(model.itemCount)
  const items = officialData.slice(0, itemCount).map((item, index) => ({
    key: `${item.name}-${index}`,
    label: item.name,
    value: item.value,
  }))
  const images = model.showImages ? parseImageUrls(model.imageUrls) : []
  const sort = model.sort === 'asc' || model.sort === 'desc' ? model.sort : false
  const max = Number(model.max)
  const fontSize = normalizePositive(model.fontSize, 12)
  const imageSideLength = normalizePositive(model.imageSideLength, 30)
  const scriptLines = [
    '<script setup lang="ts">',
    "import { LumalConicalColumnChart } from '@lumal/datav'",
    '',
    'const items = [',
    formatItems(items),
    ']',
  ]

  if (images.length) {
    scriptLines.push('', 'const images = [', formatImages(images), ']')
  }
  scriptLines.push('<\/script>')

  const attributes = [
    ':items="items"',
    ...(images.length ? [':images="images"'] : []),
    ...(model.unit ? [`unit="${escapeAttribute(model.unit)}"`] : []),
    `:show-value="${Boolean(model.showValue)}"`,
    sort ? `sort="${sort}"` : ':sort="false"',
    ...(Number.isFinite(max) && max > 0 ? [`:max="${max}"`] : []),
    `:font-size="${fontSize}"`,
    ...(images.length ? [`:image-side-length="${imageSideLength}"`] : []),
    `column-color="${escapeAttribute(model.columnColor)}"`,
    `text-color="${escapeAttribute(model.textColor)}"`,
    `aria-label="${escapeAttribute(model.ariaLabel)}"`,
    'style="width: min(100%, 420px); height: 260px"',
  ]

  return `${scriptLines.join('\n')}\n\n<template>\n  <LumalConicalColumnChart\n    ${attributes.join('\n    ')}\n  />\n<\/template>`
}

const officialBasicCode = `<script setup lang="ts">
import { LumalConicalColumnChart } from '@lumal/datav'

const config = {
  data: [
${formatData(officialData)}
  ],
  img: [
${formatImages(officialImages, '    ')}
  ],
}
<\/script>

<template>
  <LumalConicalColumnChart :config="config" style="width: 400px; height: 200px" />
<\/template>`

const officialValueCode = officialBasicCode
  .replace('\n}\n<\/script>', '\n  showValue: true,\n}\n<\/script>')

const modernCode = `<script setup lang="ts">
import { LumalConicalColumnChart } from '@lumal/datav'

const items = [
  { key: 'a', label: '光伏', value: 93 },
  { key: 'b', label: '风电', value: 78 },
  { key: 'c', label: '水电', value: 66 },
  { key: 'd', label: '火电', value: 41 },
]
<\/script>

<template>
  <LumalConicalColumnChart :items="items" unit="MW" show-value style="width: 400px; height: 260px" />
<\/template>`

const propRows: PropRow[] = [
  { name: 'items', type: 'readonly DataValueItem[]', default: 'undefined', description: '现代数据项：key、label、value，可用 color 覆盖单柱颜色。' },
  { name: 'config', type: 'ConicalColumnChartConfig', default: '{}', description: 'DataV 兼容配置，data 使用 name/value。' },
  { name: 'max', type: 'number', default: '数据最大值', description: '满刻度基准值；非正值或小于数据最大值时按数据最大值计算。' },
  { name: 'unit', type: 'string', default: "''", description: '数值单位。' },
  { name: 'sort', type: "false | 'asc' | 'desc'", default: "'desc'", description: '排序方式；DataV 原版固定降序。' },
  { name: 'showValue', type: 'boolean', default: 'false', description: '是否显示数值。' },
  { name: 'images', type: 'readonly string[]', default: '[]', description: '柱顶图片数组，排序后按名次依次使用。' },
  { name: 'imageSideLength', type: 'number', default: '30', description: '柱顶图片边长。' },
  { name: 'fontSize', type: 'number', default: '12', description: '文字大小。' },
  { name: 'columnColor', type: 'string', default: "'rgba(0, 194, 255, 0.4)'", description: '锥柱颜色，支持 rgba() 透明度。' },
  { name: 'textColor', type: 'string', default: "'#fff'", description: '文字颜色。' },
  { name: 'ariaLabel', type: 'string', default: "'锥形柱图'", description: '图表无障碍标签。' },
]

const configRows: PropRow[] = [
  { name: 'data', type: 'readonly { name: string, value: number }[]', default: '[]', description: '锥柱数据，按 value 自动降序。' },
  { name: 'img', type: 'readonly string[]', default: '[]', description: '柱顶图片 URL，排序后按名次依次使用。' },
  { name: 'fontSize', type: 'number', default: '12', description: '文字大小。' },
  { name: 'imgSideLength', type: 'number', default: '30', description: '柱顶图片边长。' },
  { name: 'columnColor', type: 'string', default: "'rgba(0, 194, 255, 0.4)'", description: '锥柱颜色。' },
  { name: 'textColor', type: 'string', default: "'#fff'", description: '文字颜色。' },
  { name: 'showValue', type: 'boolean', default: 'false', description: '是否显示柱数值。' },
]
</script>

<template>
  <ComponentDoc
    title="ConicalColumnChart 锥形柱图"
    component-name="LumalConicalColumnChart"
    datav-name="conicalColumnChart"
    intro="锥形柱图会根据数值大小降序排列锥形柱，适合排名类数据展示。"
  >
    <Playground
      v-model="playModel"
      title="官方数据 · 全属性在线调试"
      description="实时修改数据数量、排序、数值、柱顶图片、透明颜色及无障碍标签；预览效果与代码同步更新。"
      component-name="LumalConicalColumnChart"
      :controls="playControls"
      :code-gen="buildPlaygroundCode"
      :min-height="300"
    >
      <LumalConicalColumnChart
        :items="playItems"
        :images="playImages"
        :unit="playModel.unit as string"
        :show-value="playModel.showValue as boolean"
        :sort="(playModel.sort as 'asc' | 'desc') || false"
        :max="playMax"
        :image-side-length="playModel.imageSideLength as number"
        :font-size="playModel.fontSize as number"
        :column-color="playModel.columnColor as string"
        :text-color="playModel.textColor as string"
        :aria-label="playModel.ariaLabel as string"
        style="width: min(100%, 420px); height: 260px;"
      />
    </Playground>

    <DemoBlock
      title="DataV 官方基本示例"
      description="还原官方 7 条排名数据与 1st–7st 柱顶图片，组件按数值降序后匹配名次图片。"
      :code="officialBasicCode"
      :min-height="240"
    >
      <LumalConicalColumnChart :config="officialConfig" style="width: min(100%, 400px); height: 200px;" />
    </DemoBlock>

    <DemoBlock
      title="DataV 官方数值显示"
      description="在官方基本示例上开启 showValue，显示每个锥柱对应数值。"
      :code="officialValueCode"
      :min-height="240"
    >
      <LumalConicalColumnChart :config="officialValueConfig" style="width: min(100%, 400px); height: 200px;" />
    </DemoBlock>

    <DemoBlock
      title="现代 props"
      description="使用 items、unit 与 showValue 的类型安全写法。"
      :code="modernCode"
      :min-height="300"
    >
      <LumalConicalColumnChart :items="energyItems" unit="MW" show-value style="width: min(100%, 400px); height: 260px;" />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />

    <h2>config 字段</h2>
    <PropsTable name-label="字段" :rows="configRows" />
  </ComponentDoc>
</template>
