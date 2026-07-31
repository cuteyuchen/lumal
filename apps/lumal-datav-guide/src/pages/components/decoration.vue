<script setup lang="ts">
import type { DecorationVariant } from '@lumal/datav'
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumalDecoration } from '@lumal/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const variants = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

/** 官方文档与实现中 reverse 有实际效果的变体。 */
const REVERSE_VARIANTS = new Set<DecorationVariant>([2, 4, 8, 9, 12])
/** 官方文档单独声明 duration / dur 的变体；其余仍有内置时长。 */
const DURATION_VARIANTS = new Set<DecorationVariant>([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12])
/** 官方展示尺寸（宽 × 高），与 datav.jiaminghi.com 一致。 */
const VARIANT_SIZE: Record<DecorationVariant, { width: string, height: string }> = {
  1: { width: '200px', height: '50px' },
  2: { width: '200px', height: '5px' },
  3: { width: '250px', height: '30px' },
  4: { width: '5px', height: '150px' },
  5: { width: '300px', height: '40px' },
  6: { width: '300px', height: '30px' },
  7: { width: '150px', height: '30px' },
  8: { width: '300px', height: '50px' },
  9: { width: '150px', height: '150px' },
  10: { width: '90%', height: '5px' },
  11: { width: '200px', height: '60px' },
  12: { width: '150px', height: '150px' },
}

const playModel = reactive<Record<string, unknown>>({
  variant: 1,
  reverse: false,
  duration: 2000,
  scanDur: 3,
  haloDur: 2,
  color1: '#ffffff',
  color2: '#0de7c2',
})

function asVariant(model: Record<string, unknown>): DecorationVariant {
  const value = Number(model.variant)
  return (variants.includes(value as DecorationVariant) ? value : 1) as DecorationVariant
}

function stageSize(variant: DecorationVariant, reverse: boolean): { width: string, height: string } {
  // 官方 reverse 示例会交换 2/4 的横纵尺寸
  if (reverse && variant === 2)
    return { width: '5px', height: '150px' }
  if (reverse && variant === 4)
    return { width: '250px', height: '5px' }
  return VARIANT_SIZE[variant]
}

const playControls = computed<PlaygroundControl[]>(() => [
  {
    key: 'variant',
    label: '变体 variant',
    type: 'select',
    options: variants.map(v => ({ label: `variant ${v}`, value: v })),
  },
  {
    key: 'reverse',
    label: '反转 reverse',
    type: 'boolean',
    hint: 'variant 2 / 4 / 8 / 9 / 12',
    hidden: model => !REVERSE_VARIANTS.has(asVariant(model)),
  },
  {
    key: 'duration',
    label: '动画时长 duration',
    type: 'number',
    min: 0,
    max: 12000,
    step: 200,
    hint: '毫秒',
    hidden: model => !DURATION_VARIANTS.has(asVariant(model)) || asVariant(model) === 12,
  },
  {
    key: 'scanDur',
    label: '扫描时长 scanDur',
    type: 'number',
    min: 0.1,
    max: 20,
    step: 0.1,
    hint: '秒；仅 variant 12',
    hidden: model => asVariant(model) !== 12,
  },
  {
    key: 'haloDur',
    label: '光晕时长 haloDur',
    type: 'number',
    min: 0.1,
    max: 20,
    step: 0.1,
    hint: '秒；仅 variant 12',
    hidden: model => asVariant(model) !== 12,
  },
  { key: 'color1', label: '主色 colors[0]', type: 'color', omitFromCode: true },
  { key: 'color2', label: '辅色 colors[1]', type: 'color', omitFromCode: true },
])

const currentVariant = computed(() => asVariant(playModel))
const showReverse = computed(() => REVERSE_VARIANTS.has(currentVariant.value))
const showDuration = computed(() => DURATION_VARIANTS.has(currentVariant.value) && currentVariant.value !== 12)
const showScan = computed(() => currentVariant.value === 12)
const playStageStyle = computed(() => {
  const size = stageSize(currentVariant.value, Boolean(playModel.reverse) && showReverse.value)
  return { width: size.width, height: size.height }
})

function generatePlaygroundCode(model: Record<string, unknown>): string {
  const variant = asVariant(model)
  const reverse = Boolean(model.reverse) && REVERSE_VARIANTS.has(variant)
  const size = stageSize(variant, reverse)
  const attrs = [`:variant="${variant}"`]
  if (reverse)
    attrs.push(':reverse="true"')
  if (DURATION_VARIANTS.has(variant) && variant !== 12 && model.duration !== undefined && model.duration !== null && model.duration !== '')
    attrs.push(`:duration="${Number(model.duration)}"`)
  if (variant === 12) {
    if (model.scanDur !== undefined && model.scanDur !== null && model.scanDur !== '')
      attrs.push(`:scan-dur="${Number(model.scanDur)}"`)
    if (model.haloDur !== undefined && model.haloDur !== null && model.haloDur !== '')
      attrs.push(`:halo-dur="${Number(model.haloDur)}"`)
  }
  const c1 = typeof model.color1 === 'string' ? model.color1 : '#ffffff'
  const c2 = typeof model.color2 === 'string' ? model.color2 : '#0de7c2'
  attrs.push(`:colors="['${c1}', '${c2}']"`)
  const style = `style="width: ${size.width}; height: ${size.height};"`
  const slot = variant === 7
    ? 'Decoration'
    : variant === 9
      ? '66%'
      : variant === 11
        ? 'Decoration'
        : ''
  if (slot)
    return `<LumalDecoration\n  ${attrs.join('\n  ')}\n  ${style}\n>${slot}</LumalDecoration>`
  return `<LumalDecoration\n  ${attrs.join('\n  ')}\n  ${style}\n/>`
}

const basicCode = `<div style="width:200px;height:50px">
  <LumalDecoration :variant="1" />
</div>`

const colorCode = `<div style="width:200px;height:5px">
  <LumalDecoration :variant="2" :colors="['#6ff7cd', '#796cff']" />
</div>`

const propRows: PropRow[] = [
  { name: 'variant', type: 'DecorationVariant (1–12)', default: '1', description: '装饰样式编号，对应 DataV decoration1–12。' },
  { name: 'colors', type: '[string, string]', default: '按 variant 内置', description: '现代 props：两段主色。' },
  { name: 'color', type: '[string, string]', default: '按 variant 内置', description: 'DataV 原生配色 prop。' },
  { name: 'background', type: 'string', default: 'undefined', description: '背景色（部分变体支持）。' },
  { name: 'duration', type: 'number', default: '按 variant', description: '主动画时长，毫秒。' },
  { name: 'dur', type: 'number', default: '按 variant', description: 'DataV 原生动画时长，单位秒。' },
  { name: 'scanDur', type: 'number', default: '3', description: '扫描线动画时长（秒，仅 variant 12）。' },
  { name: 'haloDur', type: 'number', default: '2', description: '光晕动画时长（秒，仅 variant 12）。' },
  { name: 'reverse', type: 'boolean', default: 'false', description: '反转方向；variant 2 / 4 / 8 / 9 / 12 支持。' },
]
</script>

<template>
  <ComponentDoc
    title="Decoration 装饰"
    component-name="LumalDecoration"
    datav-name="decoration1–12"
    intro="氛围装饰件，共 12 种变体。多用于面板标题旁、分隔线或角落点缀，自带循环动画。展示尺寸对齐官方文档。"
  >
    <Playground
      v-model="playModel"
      title="在线调试"
      description="按当前变体仅展示支持的属性；预览区高度与官方文档一致（约 200px 容器）。"
      component-name="LumalDecoration"
      :controls="playControls"
      :min-height="200"
      :code-gen="generatePlaygroundCode"
    >
      <div class="deco-stage" :style="playStageStyle">
        <LumalDecoration
          :variant="currentVariant"
          :reverse="showReverse ? playModel.reverse as boolean : undefined"
          :duration="showDuration ? playModel.duration as number : undefined"
          :scan-dur="showScan ? playModel.scanDur as number : undefined"
          :halo-dur="showScan ? playModel.haloDur as number : undefined"
          :colors="[playModel.color1 as string, playModel.color2 as string]"
        >
          <template v-if="currentVariant === 7 || currentVariant === 11">
            Decoration
          </template>
          <template v-else-if="currentVariant === 9">
            66%
          </template>
        </LumalDecoration>
      </div>
    </Playground>

    <DemoBlock
      title="全部 12 种变体"
      description="尺寸参考官方文档默认示例；预览容器高度约 200px。"
      :code="basicCode"
      :min-height="200"
    >
      <div class="deco-grid">
        <div v-for="v in variants" :key="v" class="deco-grid__cell">
          <span class="deco-grid__label">variant {{ v }}</span>
          <div class="deco-grid__stage">
            <div class="deco-stage" :style="VARIANT_SIZE[v]">
              <LumalDecoration :variant="v">
                <template v-if="v === 7 || v === 11">
                  Decoration
                </template>
                <template v-else-if="v === 9">
                  66%
                </template>
              </LumalDecoration>
            </div>
          </div>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="自定义配色"
      description="通过 colors 覆盖内置主色。"
      :code="colorCode"
      :min-height="200"
    >
      <div class="deco-stage" style="width: 200px; height: 5px;">
        <LumalDecoration :variant="2" :colors="['#6ff7cd', '#796cff']" />
      </div>
    </DemoBlock>

    <h2>属性</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>

<style scoped>
.deco-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
}

.deco-grid__cell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
}

.deco-grid__label {
  font-size: 12px;
  color: rgb(207 238 255 / 78%);
}

.deco-grid__stage {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}

.deco-stage {
  display: block;
  max-width: 100%;
  color: #7ec699;
  font-weight: 700;
}

.deco-stage :deep(.lumal-decoration) {
  width: 100%;
  height: 100%;
}
</style>
