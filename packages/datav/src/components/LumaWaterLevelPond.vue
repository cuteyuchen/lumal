<script setup lang="ts">
import type { WaterLevelPondConfig } from '../types'
import { computed, useId, useTemplateRef } from 'vue'
import { useElementSize } from '../composables/useElementSize'
import { useSvgAnimationPause } from '../composables/useSvgAnimationPause'
import { clampPercent, positiveInteger } from '../utils'

type WaterShape = 'circle' | 'rect' | 'round' | 'rounded' | 'roundRect'
type WaterFormatter = string | ((value: number) => string)
type Point = readonly [number, number]

const props = defineProps<{
  config?: WaterLevelPondConfig
  value?: number
  data?: readonly number[]
  values?: readonly number[]
  colors?: readonly string[]
  shape?: WaterShape
  formatter?: WaterFormatter
  waveCount?: number
  waveNum?: number
  waveHeight?: number
  waveOpacity?: number
  duration?: number
}>()

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const svgRef = useTemplateRef<SVGSVGElement>('svgRef')
const size = useElementSize(rootRef)
const animation = useSvgAnimationPause(rootRef, svgRef)
const id = useId().replaceAll(':', '')
const borderGradientId = `water-border-${id}`
const waterGradientId = `water-fill-${id}`
const clipId = `water-clip-${id}`

const width = computed(() => size.value.width)
const height = computed(() => size.value.height)
const innerWidth = computed(() => Math.max(0, width.value - 16))
const innerHeight = computed(() => Math.max(0, height.value - 16))
const normalizedShape = computed<'rect' | 'round' | 'roundRect'>(() => {
  const shape = props.shape ?? props.config?.shape ?? 'rect'
  if (shape === 'circle' || shape === 'round')
    return 'round'
  if (shape === 'rounded' || shape === 'roundRect')
    return 'roundRect'
  return 'rect'
})
const shapeClass = computed(() => normalizedShape.value === 'round' ? 'is-circle' : normalizedShape.value === 'roundRect' ? 'is-rounded' : 'is-rect')
const colors = computed(() => props.colors ?? props.config?.colors ?? ['#3DE7C9', '#00BAFF'])
const waveNum = computed(() => positiveInteger(props.waveNum ?? props.waveCount ?? props.config?.waveNum ?? 3, 3))
const waveHeight = computed(() => Math.max(0, props.waveHeight ?? props.config?.waveHeight ?? 40))
const waveOpacity = computed(() => Math.min(1, Math.max(0, props.waveOpacity ?? props.config?.waveOpacity ?? 0.4)))
const levels = computed(() => {
  const source = props.data ?? props.values ?? (props.value === undefined ? props.config?.data : [props.value]) ?? []
  return source.map(clampPercent)
})
const displayValue = computed(() => levels.value.length ? Math.max(...levels.value) : 0)
const details = computed(() => {
  if (!levels.value.length)
    return ''
  const formatter = props.formatter ?? props.config?.formatter ?? '{value}%'
  return typeof formatter === 'function' ? formatter(displayValue.value) : formatter.replace('{value}', String(displayValue.value))
})
const stops = computed(() => {
  const values = colors.value.length ? colors.value : ['#3DE7C9', '#00BAFF']
  const gap = values.length > 1 ? 100 / (values.length - 1) : 0
  return values.map((color, index) => ({ color, offset: index * gap }))
})
const duration = computed(() => `${Math.max(1, props.duration ?? 5000)}ms`)

function controlPoints(points: readonly Point[], index: number): readonly [Point, Point] {
  const previous = points[Math.max(0, index - 1)]!
  const current = points[index]!
  const next = points[Math.min(points.length - 1, index + 1)]!
  const following = points[Math.min(points.length - 1, index + 2)]!
  return [
    [current[0] + 0.25 * (next[0] - previous[0]), current[1] + 0.25 * (next[1] - previous[1])],
    [next[0] - 0.25 * (following[0] - current[0]), next[1] - 0.25 * (following[1] - current[1])],
  ]
}

function wavePath(level: number): string {
  const w = innerWidth.value
  const h = innerHeight.value
  if (!w || !h)
    return ''
  const gap = w / waveNum.value / 2
  const startY = (1 - level / 100) * h
  const points = Array.from({ length: waveNum.value * 4 + 4 }, (_, index): Point => [
    8 + w - gap * index + gap * 2,
    8 + (index % 2 ? startY - waveHeight.value : startY),
  ])
  const segments = points.slice(0, -1).map((_, index) => {
    const [first, second] = controlPoints(points, index)
    const end = points[index + 1]!
    return `C ${first[0]} ${first[1]} ${second[0]} ${second[1]} ${end[0]} ${end[1]}`
  })
  const first = points[0]!
  const last = points.at(-1)!
  return `M ${first[0]} ${first[1]} ${segments.join(' ')} L ${last[0]} ${8 + h} L ${first[0]} ${8 + h} Z`
}

const waves = computed(() => levels.value.map((level, index) => ({ key: index, path: wavePath(level) })))
defineExpose({ getWavePaths: () => waves.value.map(wave => wave.path) })
</script>

<template>
  <div
    ref="rootRef"
    class="dv-water-pond-level luma-water-level-pond"
    :class="[shapeClass, { 'is-animation-paused': animation.paused }]"
    role="meter"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="displayValue"
    :aria-valuetext="details"
    @focusin="animation.onFocusIn"
    @focusout="animation.onFocusOut"
    @mouseenter="animation.onMouseEnter"
    @mouseleave="animation.onMouseLeave"
  >
    <svg ref="svgRef" :viewBox="`0 0 ${Math.max(1, width)} ${Math.max(1, height)}`" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient :id="borderGradientId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop v-for="stop in stops" :key="stop.offset" :offset="`${stop.offset}%`" :stop-color="stop.color" />
        </linearGradient>
        <linearGradient :id="waterGradientId" gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" :y2="8 + innerHeight">
          <stop v-for="stop in stops" :key="stop.offset" :offset="`${stop.offset}%`" :stop-color="stop.color" />
        </linearGradient>
        <clipPath :id="clipId">
          <ellipse v-if="normalizedShape === 'round'" :cx="width / 2" :cy="height / 2" :rx="innerWidth / 2" :ry="innerHeight / 2" />
          <rect v-else x="8" y="8" :width="innerWidth" :height="innerHeight" :rx="normalizedShape === 'roundRect' ? 10 : 0" />
        </clipPath>
      </defs>
      <g class="luma-water-level-pond__water" :clip-path="`url(#${clipId})`">
        <path v-for="wave in waves" :key="wave.key" :d="wave.path" :fill="`url(#${waterGradientId})`" :opacity="waveOpacity">
          <animateTransform attributeName="transform" type="translate" :values="`0 0; ${innerWidth} 0`" :dur="duration" repeatCount="indefinite" />
        </path>
      </g>
      <text class="luma-water-level-pond__label" :stroke="`url(#${borderGradientId})`" :fill="`url(#${borderGradientId})`" :x="width / 2" :y="height / 2">{{ details }}</text>
      <ellipse v-if="normalizedShape === 'round'" class="luma-water-level-pond__border" :cx="width / 2" :cy="height / 2" :rx="innerWidth / 2 + 5" :ry="innerHeight / 2 + 5" :stroke="`url(#${borderGradientId})`" />
      <rect v-else class="luma-water-level-pond__border" x="2" y="2" :rx="normalizedShape === 'roundRect' ? 10 : 0" :width="innerWidth + 12" :height="innerHeight + 12" :stroke="`url(#${borderGradientId})`" />
    </svg>
  </div>
</template>

<style scoped>
.dv-water-pond-level { position: relative; }
.dv-water-pond-level svg { width: 100%; height: 100%; }
.dv-water-pond-level text { font-size: 25px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
.dv-water-pond-level ellipse,
.dv-water-pond-level rect { fill: none; stroke-width: 3; }
</style>
