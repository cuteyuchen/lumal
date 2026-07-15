<script setup lang="ts">
import type { PercentPondConfig } from '../types'
import { computed, useId, useTemplateRef } from 'vue'
import { useElementSize } from '../composables/useElementSize'
import { clampPercent } from '../utils'

type PercentFormatter = string | ((value: number) => string)

const props = withDefaults(defineProps<{
  config?: PercentPondConfig
  value?: number
  colors?: readonly string[]
  shape?: 'bar' | 'capsule'
  formatter?: PercentFormatter
  showLabel?: boolean
  borderWidth?: number
  borderGap?: number
  lineDash?: readonly number[]
  textColor?: string
  borderRadius?: number
  localGradient?: boolean
}>(), {
  localGradient: undefined,
  showLabel: undefined,
})

const root = useTemplateRef<HTMLElement>('root')
const size = useElementSize(root)
const instanceId = useId().replaceAll(':', '')
const borderGradientId = `luma-percent-pond-border-${instanceId}`
const progressGradientId = `luma-percent-pond-progress-${instanceId}`

const percent = computed(() => clampPercent(props.value ?? props.config?.value ?? 0))
const width = computed(() => size.value.width)
const height = computed(() => size.value.height)
const colors = computed(() => props.colors ?? props.config?.colors ?? ['#3DE7C9', '#00BAFF'])
const shape = computed(() => props.shape ?? 'bar')
const formatter = computed(() => props.formatter ?? props.config?.formatter ?? '{value}%')
const showLabel = computed(() => props.showLabel ?? true)
const lineDash = computed(() => props.lineDash ?? props.config?.lineDash ?? [5, 1])
const textColor = computed(() => props.textColor ?? props.config?.textColor ?? '#fff')
const localGradient = computed(() => props.localGradient ?? props.config?.localGradient ?? false)
const safeBorderWidth = computed(() => Math.max(0, props.borderWidth ?? props.config?.borderWidth ?? 3))
const safeBorderGap = computed(() => Math.max(0, props.borderGap ?? props.config?.borderGap ?? 3))
const rectWidth = computed(() => Math.max(0, width.value - safeBorderWidth.value))
const rectHeight = computed(() => Math.max(0, height.value - safeBorderWidth.value))
const borderRadius = computed(() => shape.value === 'capsule'
  ? Math.max(0, height.value / 2)
  : Math.max(0, props.borderRadius ?? props.config?.borderRadius ?? 5))
const polylineWidth = computed(() => Math.max(
  0,
  height.value - (safeBorderWidth.value + safeBorderGap.value) * 2,
))
const points = computed(() => {
  const start = safeBorderWidth.value + safeBorderGap.value
  const available = Math.max(0, width.value - start * 2)
  const end = start + available / 100 * percent.value
  const halfHeight = height.value / 2
  return `${start},${halfHeight} ${end},${halfHeight + 0.001}`
})
const gradientStops = computed(() => {
  const resolvedColors = colors.value.length ? colors.value : ['#3DE7C9', '#00BAFF']
  const gap = resolvedColors.length > 1 ? 100 / (resolvedColors.length - 1) : 0
  return resolvedColors.map((color, index) => ({ color, offset: gap * index }))
})
const polylineGradientId = computed(() => localGradient.value ? borderGradientId : progressGradientId)
const progressGradientEnd = computed(() => `${200 - percent.value}%`)
const details = computed(() => {
  if (typeof formatter.value === 'function')
    return formatter.value(percent.value)
  return formatter.value.replace('{value}', String(percent.value))
})
const viewBox = computed(() => `0 0 ${Math.max(1, width.value)} ${Math.max(1, height.value)}`)
</script>

<template>
  <div
    ref="root"
    class="luma-percent-pond"
    :class="`is-${shape}`"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="percent"
    :aria-valuetext="details"
  >
    <svg
      class="luma-percent-pond__svg"
      :viewBox="viewBox"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient :id="borderGradientId" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            v-for="stop in gradientStops"
            :key="`${stop.offset}-${stop.color}`"
            :offset="`${stop.offset}%`"
            :stop-color="stop.color"
          />
        </linearGradient>
        <linearGradient :id="progressGradientId" x1="0%" y1="0%" :x2="progressGradientEnd" y2="0%">
          <stop
            v-for="stop in gradientStops"
            :key="`${stop.offset}-${stop.color}`"
            :offset="`${stop.offset}%`"
            :stop-color="stop.color"
          />
        </linearGradient>
      </defs>

      <rect
        class="luma-percent-pond__border"
        :x="safeBorderWidth / 2"
        :y="safeBorderWidth / 2"
        :rx="borderRadius"
        :ry="borderRadius"
        fill="transparent"
        :stroke-width="safeBorderWidth"
        :stroke="`url(#${borderGradientId})`"
        :width="rectWidth"
        :height="rectHeight"
      />
      <polyline
        class="luma-percent-pond__progress"
        fill="none"
        :stroke-width="polylineWidth"
        :stroke-dasharray="lineDash.join(',')"
        :stroke="`url(#${polylineGradientId})`"
        :points="points"
      />
      <text
        v-if="showLabel"
        class="luma-percent-pond__label"
        :stroke="textColor"
        :fill="textColor"
        :x="width / 2"
        :y="height / 2"
      >{{ details }}</text>
    </svg>
  </div>
</template>
