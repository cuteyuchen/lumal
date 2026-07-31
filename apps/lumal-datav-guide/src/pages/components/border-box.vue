<script setup lang="ts">
import type { BorderBoxVariant } from '@lumal/datav'
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumalBorderBox, LumalDigitalFlop } from '@lumal/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const variants = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const

/** 使用 duration 动效的变体（与 LumalBorderBox DEFAULT_DURATION 一致）。 */
const DURATION_VARIANTS = new Set<BorderBoxVariant>([1, 8, 9, 11, 12])
/** reverse 实际影响绘制/路径的变体。 */
const REVERSE_VARIANTS = new Set<BorderBoxVariant>([4, 5, 8])

const playModel = reactive<Record<string, unknown>>({
  variant: 1,
  title: '区域负载',
  titleWidth: 200,
  duration: 1000,
  reverse: false,
  // demo 拆成色值 + 透明度，运行时组装为 backgroundColor，不改组件 props。
  backgroundColor: '#08162c',
  backgroundOpacity: 60,
  color1: '#4fd2dd',
  color2: '#235fa7',
})

function asVariant(model: Record<string, unknown>): BorderBoxVariant {
  const value = Number(model.variant)
  return (variants.includes(value as BorderBoxVariant) ? value : 1) as BorderBoxVariant
}

/** 将 #rrggbb + 0–100 透明度组装为组件可消费的 css 颜色字符串。 */
function composeBackgroundColor(hex: unknown, opacityPercent: unknown): string {
  const raw = typeof hex === 'string' ? hex.trim() : ''
  const match = /^#?([0-9a-f]{6})$/i.exec(raw)
  const r = match ? Number.parseInt(match[1]!.slice(0, 2), 16) : 8
  const g = match ? Number.parseInt(match[1]!.slice(2, 4), 16) : 22
  const b = match ? Number.parseInt(match[1]!.slice(4, 6), 16) : 44
  const alpha = Math.min(100, Math.max(0, Number(opacityPercent) || 0)) / 100
  return `rgb(${r} ${g} ${b} / ${alpha})`
}

const playControls = computed<PlaygroundControl[]>(() => [
  {
    key: 'variant',
    label: '变体 variant',
    type: 'select',
    options: variants.map(v => ({ label: `variant ${v}`, value: v })),
  },
  {
    key: 'title',
    label: '标题 title',
    type: 'text',
    hint: '仅 variant 11',
    hidden: model => asVariant(model) !== 11,
  },
  {
    key: 'titleWidth',
    label: '标题宽 titleWidth',
    type: 'number',
    min: 80,
    max: 400,
    step: 10,
    hint: '仅 variant 11',
    hidden: model => asVariant(model) !== 11,
  },
  {
    key: 'duration',
    label: '动画时长 duration',
    type: 'number',
    min: 0,
    max: 12000,
    step: 200,
    hint: '毫秒；variant 1 / 8 / 9 / 11 / 12',
    hidden: model => !DURATION_VARIANTS.has(asVariant(model)),
  },
  {
    key: 'reverse',
    label: '反转 reverse',
    type: 'boolean',
    hint: 'variant 4 / 5 / 8',
    hidden: model => !REVERSE_VARIANTS.has(asVariant(model)),
  },
  { key: 'backgroundColor', label: '内容背景色', type: 'color', omitFromCode: true },
  {
    key: 'backgroundOpacity',
    label: '背景透明度 %',
    type: 'number',
    min: 0,
    max: 100,
    step: 1,
    omitFromCode: true,
  },
  { key: 'color1', label: '主色 colors[0]', type: 'color', omitFromCode: true },
  { key: 'color2', label: '辅色 colors[1]', type: 'color', omitFromCode: true },
])

const currentVariant = computed(() => asVariant(playModel))
const showTitle = computed(() => currentVariant.value === 11)
const showDuration = computed(() => DURATION_VARIANTS.has(currentVariant.value))
const showReverse = computed(() => REVERSE_VARIANTS.has(currentVariant.value))
const resolvedBackgroundColor = computed(() =>
  composeBackgroundColor(playModel.backgroundColor, playModel.backgroundOpacity),
)

function generatePlaygroundCode(model: Record<string, unknown>): string {
  const variant = asVariant(model)
  const attrs = [`:variant="${variant}"`]
  if (variant === 11) {
    if (typeof model.title === 'string' && model.title)
      attrs.push(`title="${model.title}"`)
    if (model.titleWidth !== undefined && model.titleWidth !== null && model.titleWidth !== '')
      attrs.push(`:title-width="${Number(model.titleWidth)}"`)
  }
  if (DURATION_VARIANTS.has(variant) && model.duration !== undefined && model.duration !== null && model.duration !== '')
    attrs.push(`:duration="${Number(model.duration)}"`)
  if (REVERSE_VARIANTS.has(variant) && model.reverse)
    attrs.push(':reverse="true"')
  attrs.push(`background-color="${composeBackgroundColor(model.backgroundColor, model.backgroundOpacity)}"`)
  const c1 = typeof model.color1 === 'string' ? model.color1 : '#4fd2dd'
  const c2 = typeof model.color2 === 'string' ? model.color2 : '#235fa7'
  attrs.push(`:colors="['${c1}', '${c2}']"`)
  const inner = '  <LumalDigitalFlop :value="1286" suffix=" 台" :font-size="34" />'
  return `<LumalBorderBox\n  ${attrs.join('\n  ')}\n>\n${inner}\n</LumalBorderBox>`
}

const basicCode = `<LumalBorderBox :variant="1">
  <div class="panel-body">驾驶舱面板内容</div>
</LumalBorderBox>`

const colorCode = `<!-- 现代 props：colors 为两段渐变色 -->
<LumalBorderBox :variant="1" :colors="['#6ff7cd', '#235fa7']">
  <LumalDigitalFlop :value="1286" suffix=" 台" :font-size="34" />
</LumalBorderBox>

<!-- DataV 原生 props：color 数组同样兼容 -->
<LumalBorderBox :variant="1" :color="['#6ff7cd', '#235fa7']" background-color="rgb(8 22 44 / 60%)">
  <LumalDigitalFlop :value="1286" suffix=" 台" :font-size="34" />
</LumalBorderBox>`

const titleCode = `<LumalBorderBox :variant="11" title="区域负载" :title-width="200">
  <div class="panel-body">带标题的边框（variant 11 支持标题）</div>
</LumalBorderBox>`

const propRows: PropRow[] = [
  { name: 'variant', type: 'BorderBoxVariant (1–13)', default: '1', description: '边框样式编号，对应 DataV borderBox1–13。' },
  { name: 'colors', type: '[string, string]', default: '按 variant 内置', description: '现代 props：两段渐变边框色。' },
  { name: 'color', type: 'string[]', default: '按 variant 内置', description: 'DataV 原生 props：边框色数组，等价 colors。' },
  { name: 'background', type: 'string', default: '\'transparent\'', description: '内容区背景色（现代 props）。' },
  { name: 'backgroundColor', type: 'string', default: '\'transparent\'', description: 'DataV 原生背景色 prop。' },
  { name: 'duration', type: 'number', default: '按 variant', description: '动效时长（毫秒），对 variant 1 / 8 / 9 / 11 / 12 生效。' },
  { name: 'dur', type: 'number', default: '按 variant', description: 'DataV 原生动画时长（秒），主要兼容 borderBox8。' },
  { name: 'reverse', type: 'boolean', default: 'false', description: '反转方向；对 variant 4 / 5 / 8 生效。' },
  { name: 'title', type: 'string', default: '\'\'', description: '标题文本（仅 variant 11）。' },
  { name: 'titleWidth', type: 'number', default: '250', description: '标题栏宽度，像素（仅 variant 11）。' },
]
</script>

<template>
  <ComponentDoc
    title="BorderBox 边框"
    component-name="LumalBorderBox"
    datav-name="borderBox1–13"
    intro="科技感边框容器，共 13 种变体。作为面板外壳包裹任意内容，部分变体带描边流光动画。"
  >
    <Playground
      v-model="playModel"
      title="在线调试"
      description="按当前变体仅展示该边框支持的属性。背景色与透明度仅在 demo 中组装为 backgroundColor。"
      component-name="LumalBorderBox"
      :controls="playControls"
      :min-height="220"
      :code-gen="generatePlaygroundCode"
      slot-code="<LumalDigitalFlop :value=&quot;1286&quot; suffix=&quot; 台&quot; :font-size=&quot;34&quot; />"
    >
      <LumalBorderBox
        :variant="currentVariant"
        :title="showTitle ? playModel.title as string : undefined"
        :title-width="showTitle ? playModel.titleWidth as number : undefined"
        :duration="showDuration ? playModel.duration as number : undefined"
        :reverse="showReverse ? playModel.reverse as boolean : undefined"
        :background-color="resolvedBackgroundColor"
        :colors="[playModel.color1 as string, playModel.color2 as string]"
        style="width: 380px; height: 180px;"
      >
        <div class="panel-body">
          <LumalDigitalFlop :value="1286" suffix=" 台" :font-size="34" />
        </div>
      </LumalBorderBox>
    </Playground>

    <DemoBlock
      title="全部 13 种变体"
      description="variant 1–13 的默认样式一览。"
      :code="basicCode"
      :min-height="360"
    >
      <div class="variant-grid">
        <div v-for="v in variants" :key="v" class="variant-grid__cell">
          <LumalBorderBox :variant="v">
            <div class="panel-body">
              variant {{ v }}
            </div>
          </LumalBorderBox>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="自定义配色"
      description="现代 colors 与 DataV color 数组都可覆盖内置配色。"
      :code="colorCode"
    >
      <LumalBorderBox :variant="1" :colors="['#6ff7cd', '#235fa7']" style="width: 320px; height: 160px;">
        <div class="panel-body">
          <LumalDigitalFlop :value="1286" suffix=" 台" :font-size="34" />
        </div>
      </LumalBorderBox>
    </DemoBlock>

    <DemoBlock
      title="带标题边框"
      description="variant 11 支持 title / titleWidth，标题居中显示在顶部缺口。"
      :code="titleCode"
    >
      <LumalBorderBox :variant="11" title="区域负载" :title-width="200" style="width: 360px; height: 170px;">
        <div class="panel-body">
          带标题的边框
        </div>
      </LumalBorderBox>
    </DemoBlock>

    <h2>属性</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>

<style scoped>
.variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
}

.variant-grid__cell {
  height: 180px;
}

.panel-body {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 12px;
  font-size: 13px;
  color: var(--lumal-datav-text, #edf9ff);
}
</style>
