<script setup lang="ts">
import type { EChartsOption, PieSeriesOption } from 'echarts'
import type { CSSProperties } from 'vue'
import type {
  ActiveRingChartConfig,
  ActiveRingChartDataItem,
  DataValueItem,
  DataValueKey,
  DigitalFlopConfig,
  DigitalFlopStyle,
} from '../types'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { useElementSize } from '../composables/useElementSize'
import { usePausableAutoplay } from '../composables/usePausableAutoplay'
import { useReducedMotion } from '../composables/useReducedMotion'
import LumaCharts from './LumaCharts.vue'
import LumaDigitalFlop from './LumaDigitalFlop.vue'

const DEFAULT_COLORS = ['#37a2da', '#32c5e9', '#67e0e3', '#9fe6b8', '#ffdb5c', '#ff9f7f', '#fb7293'] as const

const props = withDefaults(defineProps<{
  items?: readonly DataValueItem[]
  config?: ActiveRingChartConfig
  interval?: number
  autoplay?: boolean
  ariaLabel?: string
}>(), {
  ariaLabel: '活动环图',
  autoplay: true,
  config: () => ({}),
  interval: undefined,
  items: undefined,
})

const emit = defineEmits<{ select: [item: DataValueItem] }>()
const activeKey = defineModel<DataValueKey>('activeKey')
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const chartHostRef = useTemplateRef<HTMLElement>('chartHostRef')
const size = useElementSize(chartHostRef)
const reducedMotion = useReducedMotion()
const activeIndex = shallowRef(0)

interface RingEntry { data: ActiveRingChartDataItem, item: DataValueItem }

const entries = computed<RingEntry[]>(() => props.items !== undefined
  ? props.items.map(item => ({ data: { name: item.label, value: item.value }, item }))
  : (props.config.data ?? [{ name: '', value: 0 }]).map((data, index) => ({
      data: { ...data },
      item: {
        key: typeof data.key === 'string' || typeof data.key === 'number' ? data.key : data.name || index,
        label: data.name,
        value: data.value,
      },
    })))

const colors = computed(() => props.config.color
  ?? props.items?.map((item, index) => item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]!)
  ?? DEFAULT_COLORS)
const lineWidth = computed(() => props.config.lineWidth ?? 20)
const currentEntry = computed(() => entries.value[activeIndex.value])
const displayValue = computed(() => {
  const value = currentEntry.value?.data.value ?? 0
  if (props.config.showOriginValue)
    return value
  const total = entries.value.reduce((sum, entry) => sum + entry.data.value, 0)
  return total ? value / total * 100 : 0
})
const digitalStyle = computed<DigitalFlopStyle & { fill: string, fontSize: number }>(() => ({
  fill: '#fff',
  fontSize: 25,
  ...props.config.digitalFlopStyle,
}))
const digitalFlopConfig = computed<DigitalFlopConfig>(() => ({
  animationCurve: props.config.animationCurve ?? 'easeOutCubic',
  animationFrame: props.config.animationFrame ?? 50,
  content: props.config.showOriginValue
    ? `{nt}${props.config.digitalFlopUnit ?? ''}`
    : `{nt}${props.config.digitalFlopUnit || '%'}`,
  number: [displayValue.value],
  style: digitalStyle.value,
  toFixed: props.config.digitalFlopToFixed ?? 0,
}))
const nameStyle = computed<CSSProperties>(() => ({ fontSize: `${digitalStyle.value.fontSize}px` }))

function radiusPixels(radius: number | string | undefined, fallback: string): number {
  const value = radius ?? fallback
  const maxRadius = Math.min(size.value.width, size.value.height) / 2
  return typeof value === 'number' ? value : Number.parseFloat(value) / 100 * maxRadius
}

const chartOption = computed<EChartsOption>(() => {
  const normal = radiusPixels(props.config.radius, '50%')
  const active = radiusPixels(props.config.activeRadius, '55%')
  const half = lineWidth.value / 2
  const baseData = entries.value.map((entry, index) => ({
    name: entry.data.name,
    value: entry.data.value,
    itemStyle: { color: colors.value[index % colors.value.length] },
  }))
  const activeData = baseData.map((item, index) => ({
    ...item,
    itemStyle: { ...item.itemStyle, opacity: index === activeIndex.value ? 1 : 0 },
  }))
  const common: PieSeriesOption = {
    animation: !reducedMotion.value,
    center: ['50%', '50%'],
    label: { show: false },
    labelLine: { show: false },
    silent: true,
    type: 'pie',
  }
  return {
    animation: !reducedMotion.value,
    color: [...colors.value],
    series: [
      { ...common, data: baseData, radius: [Math.max(0, normal - half), normal + half] },
      { ...common, data: activeData, radius: [Math.max(0, active - half), active + half], z: 2 },
    ],
  }
})

function activate(index: number, userInitiated = false): void {
  const entry = entries.value[index]
  if (!entry)
    return
  activeIndex.value = index
  activeKey.value = entry.item.key
  if (userInitiated)
    emit('select', entry.item)
}

function selectNext(): void {
  if (entries.value.length > 1)
    activate((activeIndex.value + 1) % entries.value.length)
}

function resetActiveIndex(): void {
  const requested = entries.value.findIndex(entry => entry.item.key === activeKey.value)
  activeIndex.value = requested >= 0 ? requested : 0
}

const autoplay = usePausableAutoplay({
  element: rootRef,
  enabled: computed(() => props.autoplay && (props.interval ?? props.config.activeTimeGap ?? 3000) > 0 && entries.value.length > 1),
  interval: computed(() => props.interval ?? props.config.activeTimeGap ?? 3000),
  tick: selectNext,
})

watch(() => activeKey.value, (key) => {
  const index = entries.value.findIndex(entry => entry.item.key === key)
  if (index >= 0)
    activeIndex.value = index
})
watch([() => props.config, () => props.items], resetActiveIndex)
</script>

<template>
  <div
    ref="rootRef"
    class="dv-active-ring-chart"
    role="group"
    :aria-label="ariaLabel"
    :data-active-index="activeIndex"
    @mouseenter="autoplay.onMouseEnter"
    @mouseleave="autoplay.onMouseLeave"
    @focusin="autoplay.onFocusIn"
    @focusout="autoplay.onFocusOut"
  >
    <div ref="chartHostRef" class="active-ring-chart-container">
      <LumaCharts :option="chartOption" :aria-label="ariaLabel" />
    </div>
    <div class="active-ring-info">
      <LumaDigitalFlop class="dv-digital-flop" :config="digitalFlopConfig" />
      <div class="active-ring-name" :style="nameStyle">{{ currentEntry?.item.label ?? '' }}</div>
    </div>
    <div class="luma-active-ring-controls" role="listbox" :aria-label="`${ariaLabel}数据项`">
      <button
        v-for="(entry, index) in entries"
        :key="entry.item.key"
        type="button"
        role="option"
        :aria-label="`${entry.item.label} ${entry.item.value}`"
        :aria-selected="index === activeIndex"
        @click="activate(index, true)"
      >{{ entry.item.label }}</button>
    </div>
  </div>
</template>

<style scoped>
.dv-active-ring-chart { position: relative; }
.active-ring-chart-container { width: 100%; height: 100%; }
.active-ring-info { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
.active-ring-info .dv-digital-flop { width: 100px; height: 30px; min-height: 0; }
.active-ring-name { width: 100px; height: 30px; overflow: hidden; color: #fff; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.luma-active-ring-controls { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); border: 0; white-space: nowrap; }
</style>
