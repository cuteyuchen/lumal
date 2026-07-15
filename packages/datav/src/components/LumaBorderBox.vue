<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { BorderBoxVariant } from '../types'
import {
  computed,
  nextTick,
  onMounted,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import { useAnimationPause } from '../composables/useAnimationPause'
import { useElementSize } from '../composables/useElementSize'
import { useReducedMotion } from '../composables/useReducedMotion'
import { createBorderBoxInstanceId } from './borderBoxGeometry'

const props = withDefaults(defineProps<{
  variant?: BorderBoxVariant
  /** DataV 2.10.0 prop name. */
  color?: readonly string[]
  colors?: readonly [string, string]
  /** DataV 2.10.0 prop name. */
  backgroundColor?: string
  background?: string
  /** DataV borderBox8 duration in seconds. */
  dur?: number
  duration?: number
  reverse?: boolean
  title?: string
  titleWidth?: number
}>(), {
  background: 'transparent',
  colors: undefined,
  duration: undefined,
  reverse: false,
  title: '',
  titleWidth: 250,
  variant: 1,
})

const DEFAULT_COLORS: Record<BorderBoxVariant, readonly [string, string]> = {
  1: ['#4fd2dd', '#235fa7'],
  2: ['#fff', 'rgba(255, 255, 255, 0.6)'],
  3: ['#2862b7', '#2862b7'],
  4: ['red', 'rgba(0,0,255,0.8)'],
  5: ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.20)'],
  6: ['rgba(255, 255, 255, 0.35)', 'gray'],
  7: ['rgba(128,128,128,0.3)', 'rgba(128,128,128,0.5)'],
  8: ['#235fa7', '#4fd2dd'],
  9: ['#11eefd', '#0078d2'],
  10: ['#1d48c4', '#d3e1f8'],
  11: ['#8aaafb', '#1f33a2'],
  12: ['#2e6099', '#7ce7fd'],
  13: ['#6586ec', '#2cf7fe'],
}

const DEFAULT_DURATION: Partial<Record<BorderBoxVariant, number>> = {
  1: 1000,
  8: 3000,
  9: 10000,
  11: 2000,
  12: 3000,
}

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const svgRef = useTemplateRef<SVGSVGElement>('svgRef')
const elementSize = useElementSize(rootRef)
const width = computed(() => elementSize.value.width)
const height = computed(() => elementSize.value.height)
const hovered = shallowRef(false)
const focused = shallowRef(false)
const viewportPaused = useAnimationPause(rootRef)
const reducedMotion = useReducedMotion()
const animationPaused = computed(() => viewportPaused.value || reducedMotion.value || hovered.value || focused.value)

const colors = computed<readonly [string, string]>(() => {
  const defaults = DEFAULT_COLORS[props.variant]
  const input = props.color ?? props.colors
  return [input?.[0] ?? defaults[0], input?.[1] ?? defaults[1]]
})
const primaryColor = computed(() => colors.value[0])
const secondaryColor = computed(() => colors.value[1])
const resolvedBackground = computed(() => props.backgroundColor ?? props.background)
const durationMs = computed(() => Math.max(
  1,
  props.duration
  ?? (props.variant === 8 && props.dur !== undefined ? props.dur * 1000 : undefined)
  ?? DEFAULT_DURATION[props.variant]
  ?? 3000,
))
const durationSeconds = computed(() => `${durationMs.value / 1000}s`)
const halfDurationSeconds = computed(() => `${durationMs.value / 2000}s`)
const borderLength = computed(() => (width.value + height.value - 5) * 2)
const borderPath = computed(() => props.reverse
  ? `M 2.5, 2.5 L 2.5, ${height.value - 2.5} L ${width.value - 2.5}, ${height.value - 2.5} L ${width.value - 2.5}, 2.5 L 2.5, 2.5`
  : `M2.5, 2.5 L${width.value - 2.5}, 2.5 L${width.value - 2.5}, ${height.value - 2.5} L2.5, ${height.value - 2.5} L2.5, 2.5`)

const uniqueId = createBorderBoxInstanceId(useId())
const pathId = `${uniqueId}-path`
const gradientId = `${uniqueId}-gradient`
const maskId = `${uniqueId}-mask`
const filterId = `${uniqueId}-filter`

const rootStyle = computed<CSSProperties>(() => {
  const style = {
    '--luma-datav-background': resolvedBackground.value,
    '--luma-datav-duration': `${durationMs.value}ms`,
    '--luma-datav-primary': primaryColor.value,
    '--luma-datav-secondary': secondaryColor.value,
  } as CSSProperties

  if (props.variant === 7) {
    style.backgroundColor = resolvedBackground.value
    style.border = `1px solid ${primaryColor.value}`
    style.boxShadow = `inset 0 0 40px ${primaryColor.value}`
  }
  else if (props.variant === 10) {
    style.boxShadow = `inset 0 0 25px 3px ${primaryColor.value}`
  }

  return style
})

const cornerTransforms = computed(() => [
  '',
  `translate(${width.value} 0) scale(-1 1)`,
  `translate(0 ${height.value}) scale(1 -1)`,
  `translate(${width.value} ${height.value}) scale(-1 -1)`,
])

function pulseOpacity(index: number): number {
  return [1, 0.7, 0.5][index - 1] ?? 0.5
}

function pulseMinimumOpacity(index: number): number {
  return [0.7, 0.4, 0.2][index - 1] ?? 0.2
}

function handleMouseEnter(): void {
  hovered.value = true
}

function handleMouseLeave(): void {
  hovered.value = false
}

function handleFocusIn(): void {
  focused.value = true
}

function handleFocusOut(event: FocusEvent): void {
  if (!rootRef.value?.contains(event.relatedTarget as Node | null))
    focused.value = false
}

function syncSvgAnimation(paused: boolean, svg: SVGSVGElement | null): void {
  if (!svg)
    return
  if (paused)
    svg.pauseAnimations?.()
  else
    svg.unpauseAnimations?.()
}

watch([animationPaused, svgRef], ([paused, svg]) => {
  void nextTick(() => syncSvgAnimation(paused, svg))
}, { flush: 'post' })

onMounted(() => {
  syncSvgAnimation(animationPaused.value, svgRef.value)
})
</script>

<template>
  <div
    ref="rootRef"
    class="luma-border-box"
    :class="{ 'is-animation-paused': animationPaused, 'is-reverse': reverse }"
    :data-variant="variant"
    :style="rootStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <svg
      ref="svgRef"
      aria-hidden="true"
      class="luma-border-box__svg"
      :class="{ 'is-frame-reverse': reverse && (variant === 4 || variant === 5) }"
      focusable="false"
      :height="height"
      :width="width"
    >
      <template v-if="variant === 1">
        <polygon
          :fill="resolvedBackground"
          :points="`10, 27 10, ${height - 27} 13, ${height - 24} 13, ${height - 21} 24, ${height - 11}
          38, ${height - 11} 41, ${height - 8} 73, ${height - 8} 75, ${height - 10} 81, ${height - 10}
          85, ${height - 6} ${width - 85}, ${height - 6} ${width - 81}, ${height - 10} ${width - 75}, ${height - 10}
          ${width - 73}, ${height - 8} ${width - 41}, ${height - 8} ${width - 38}, ${height - 11}
          ${width - 24}, ${height - 11} ${width - 13}, ${height - 21} ${width - 13}, ${height - 24}
          ${width - 10}, ${height - 27} ${width - 10}, 27 ${width - 13}, 25 ${width - 13}, 21
          ${width - 24}, 11 ${width - 38}, 11 ${width - 41}, 8 ${width - 73}, 8 ${width - 75}, 10
          ${width - 81}, 10 ${width - 85}, 6 85, 6 81, 10 75, 10 73, 8 41, 8 38, 11 24, 11 13, 21 13, 24`"
        />
        <g v-for="(transform, index) in cornerTransforms" :key="index" :transform="transform || undefined">
          <polygon
            :fill="primaryColor"
            points="6,66 6,18 12,12 18,12 24,6 27,6 30,9 36,9 39,6 84,6 81,9 75,9 73.2,7 40.8,7 37.8,10.2 24,10.2 12,21 12,24 9,27 9,51 7.8,54 7.8,63"
          >
            <animate
              attributeName="fill"
              begin="0s"
              :dur="halfDurationSeconds"
              repeatCount="indefinite"
              :values="`${primaryColor};${secondaryColor};${primaryColor}`"
            />
          </polygon>
          <polygon
            :fill="secondaryColor"
            points="27.599999999999998,4.8 38.4,4.8 35.4,7.8 30.599999999999998,7.8"
          >
            <animate
              attributeName="fill"
              begin="0s"
              :dur="halfDurationSeconds"
              repeatCount="indefinite"
              :values="`${secondaryColor};${primaryColor};${secondaryColor}`"
            />
          </polygon>
          <polygon
            :fill="primaryColor"
            points="9,54 9,63 7.199999999999999,66 7.199999999999999,75 7.8,78 7.8,110 8.4,110 8.4,66 9.6,66 9.6,54"
          >
            <animate
              attributeName="fill"
              begin="0s"
              :dur="durationSeconds"
              repeatCount="indefinite"
              :values="`${primaryColor};${secondaryColor};transparent`"
            />
          </polygon>
        </g>
      </template>

      <template v-else-if="variant === 2">
        <polygon :fill="resolvedBackground" :points="`7, 7 ${width - 7}, 7 ${width - 7}, ${height - 7} 7, ${height - 7}`" />
        <polyline :stroke="primaryColor" :points="`2, 2 ${width - 2}, 2 ${width - 2}, ${height - 2} 2, ${height - 2} 2, 2`" />
        <polyline :stroke="secondaryColor" :points="`6, 6 ${width - 6}, 6 ${width - 6}, ${height - 6} 6, ${height - 6} 6, 6`" />
        <circle :fill="primaryColor" cx="11" cy="11" r="1" />
        <circle :fill="primaryColor" :cx="width - 11" cy="11" r="1" />
        <circle :fill="primaryColor" :cx="width - 11" :cy="height - 11" r="1" />
        <circle :fill="primaryColor" cx="11" :cy="height - 11" r="1" />
      </template>

      <template v-else-if="variant === 3">
        <polygon :fill="resolvedBackground" :points="`23, 23 ${width - 24}, 23 ${width - 24}, ${height - 24} 23, ${height - 24}`" />
        <polyline class="luma-border-box__bb3-line1" :stroke="primaryColor" :points="`4, 4 ${width - 22}, 4 ${width - 22}, ${height - 22} 4, ${height - 22} 4, 4`" />
        <polyline class="luma-border-box__bb3-line2" :stroke="secondaryColor" :points="`10, 10 ${width - 16}, 10 ${width - 16}, ${height - 16} 10, ${height - 16} 10, 10`" />
        <polyline class="luma-border-box__bb3-line2" :stroke="secondaryColor" :points="`16, 16 ${width - 10}, 16 ${width - 10}, ${height - 10} 16, ${height - 10} 16, 16`" />
        <polyline class="luma-border-box__bb3-line2" :stroke="secondaryColor" :points="`22, 22 ${width - 4}, 22 ${width - 4}, ${height - 4} 22, ${height - 4} 22, 22`" />
      </template>

      <template v-else-if="variant === 4">
        <polygon
          :fill="resolvedBackground"
          :points="`${width - 15}, 22 170, 22 150, 7 40, 7 28, 21 32, 24
          16, 42 16, ${height - 32} 41, ${height - 7} ${width - 15}, ${height - 7}`"
        />
        <polyline class="luma-border-box__bb4-line1" :stroke="primaryColor" :points="`145, ${height - 5} 40, ${height - 5} 10, ${height - 35} 10, 40 40, 5 150, 5 170, 20 ${width - 15}, 20`" />
        <polyline class="luma-border-box__bb4-line2" :stroke="secondaryColor" :points="`245, ${height - 1} 36, ${height - 1} 14, ${height - 23} 14, ${height - 100}`" />
        <polyline class="luma-border-box__bb4-line3" :stroke="primaryColor" :points="`7, ${height - 40} 7, ${height - 75}`" />
        <polyline class="luma-border-box__bb4-line4" :stroke="primaryColor" points="28, 24 13, 41 13, 64" />
        <polyline class="luma-border-box__bb4-line5" :stroke="primaryColor" points="5, 45 5, 140" />
        <polyline class="luma-border-box__bb4-line6" :stroke="secondaryColor" points="14, 75 14, 180" />
        <polyline class="luma-border-box__bb4-line7" :stroke="secondaryColor" points="55, 11 147, 11 167, 26 250, 26" />
        <polyline class="luma-border-box__bb4-line8" :stroke="secondaryColor" points="158, 5 173, 16" />
        <polyline class="luma-border-box__bb4-line9" :stroke="primaryColor" :points="`200, 17 ${width - 10}, 17`" />
        <polyline class="luma-border-box__bb4-line10" :stroke="secondaryColor" :points="`385, 17 ${width - 10}, 17`" />
      </template>

      <template v-else-if="variant === 5">
        <polygon :fill="resolvedBackground" :points="`10, 22 ${width - 22}, 22 ${width - 22}, ${height - 86} ${width - 84}, ${height - 24} 10, ${height - 24}`" />
        <polyline class="luma-border-box__bb5-line1" :stroke="primaryColor" :points="`8, 5 ${width - 5}, 5 ${width - 5}, ${height - 100} ${width - 100}, ${height - 5} 8, ${height - 5} 8, 5`" />
        <polyline class="luma-border-box__bb5-line2" :stroke="secondaryColor" :points="`3, 5 ${width - 20}, 5 ${width - 20}, ${height - 60} ${width - 74}, ${height - 5} 3, ${height - 5} 3, 5`" />
        <polyline class="luma-border-box__bb5-line3" :stroke="secondaryColor" :points="`50, 13 ${width - 35}, 13`" />
        <polyline class="luma-border-box__bb5-line4" :stroke="secondaryColor" :points="`15, 20 ${width - 35}, 20`" />
        <polyline class="luma-border-box__bb5-line5" :stroke="secondaryColor" :points="`15, ${height - 20} ${width - 110}, ${height - 20}`" />
        <polyline class="luma-border-box__bb5-line6" :stroke="secondaryColor" :points="`15, ${height - 13} ${width - 110}, ${height - 13}`" />
      </template>

      <template v-else-if="variant === 6">
        <polygon :fill="resolvedBackground" :points="`9, 7 ${width - 9}, 7 ${width - 9}, ${height - 7} 9, ${height - 7}`" />
        <circle :fill="secondaryColor" cx="5" cy="5" r="2" />
        <circle :fill="secondaryColor" :cx="width - 5" cy="5" r="2" />
        <circle :fill="secondaryColor" :cx="width - 5" :cy="height - 5" r="2" />
        <circle :fill="secondaryColor" cx="5" :cy="height - 5" r="2" />
        <polyline :stroke="primaryColor" :points="`10, 4 ${width - 10}, 4`" />
        <polyline :stroke="primaryColor" :points="`10, ${height - 4} ${width - 10}, ${height - 4}`" />
        <polyline :stroke="primaryColor" :points="`5, 70 5, ${height - 70}`" />
        <polyline :stroke="primaryColor" :points="`${width - 5}, 70 ${width - 5}, ${height - 70}`" />
        <polyline :stroke="primaryColor" points="3, 10 3, 50" />
        <polyline :stroke="primaryColor" points="7, 30 7, 80" />
        <polyline :stroke="primaryColor" :points="`${width - 3}, 10 ${width - 3}, 50`" />
        <polyline :stroke="primaryColor" :points="`${width - 7}, 30 ${width - 7}, 80`" />
        <polyline :stroke="primaryColor" :points="`3, ${height - 10} 3, ${height - 50}`" />
        <polyline :stroke="primaryColor" :points="`7, ${height - 30} 7, ${height - 80}`" />
        <polyline :stroke="primaryColor" :points="`${width - 3}, ${height - 10} ${width - 3}, ${height - 50}`" />
        <polyline :stroke="primaryColor" :points="`${width - 7}, ${height - 30} ${width - 7}, ${height - 80}`" />
      </template>

      <template v-else-if="variant === 7">
        <polyline class="luma-border-box__bb7-line2" :stroke="primaryColor" points="0, 25 0, 0 25, 0" />
        <polyline class="luma-border-box__bb7-line2" :stroke="primaryColor" :points="`${width - 25}, 0 ${width}, 0 ${width}, 25`" />
        <polyline class="luma-border-box__bb7-line2" :stroke="primaryColor" :points="`${width - 25}, ${height} ${width}, ${height} ${width}, ${height - 25}`" />
        <polyline class="luma-border-box__bb7-line2" :stroke="primaryColor" :points="`0, ${height - 25} 0, ${height} 25, ${height}`" />
        <polyline class="luma-border-box__bb7-line5" :stroke="secondaryColor" points="0, 10 0, 0 10, 0" />
        <polyline class="luma-border-box__bb7-line5" :stroke="secondaryColor" :points="`${width - 10}, 0 ${width}, 0 ${width}, 10`" />
        <polyline class="luma-border-box__bb7-line5" :stroke="secondaryColor" :points="`${width - 10}, ${height} ${width}, ${height} ${width}, ${height - 10}`" />
        <polyline class="luma-border-box__bb7-line5" :stroke="secondaryColor" :points="`0, ${height - 10} 0, ${height} 10, ${height}`" />
      </template>

      <template v-else-if="variant === 8">
        <defs>
          <path :id="pathId" :d="borderPath" fill="transparent" />
          <radialGradient :id="gradientId" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff" stop-opacity="1" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </radialGradient>
          <mask :id="maskId">
            <circle cx="0" cy="0" r="150" :fill="`url(#${gradientId})`">
              <animateMotion :dur="durationSeconds" :path="borderPath" repeatCount="indefinite" rotate="auto" />
            </circle>
          </mask>
        </defs>
        <polygon :fill="resolvedBackground" :points="`5, 5 ${width - 5}, 5 ${width - 5}, ${height - 5} 5, ${height - 5}`" />
        <use :href="`#${pathId}`" :stroke="primaryColor" stroke-width="1" />
        <use :href="`#${pathId}`" :mask="`url(#${maskId})`" :stroke="secondaryColor" stroke-width="3">
          <animate
            attributeName="stroke-dasharray"
            :dur="durationSeconds"
            :from="`0, ${borderLength}`"
            repeatCount="indefinite"
            :to="`${borderLength}, 0`"
          />
        </use>
      </template>

      <template v-else-if="variant === 9">
        <defs>
          <linearGradient :id="gradientId" x1="0%" x2="100%" y1="0%" y2="100%">
            <animate attributeName="x1" begin="0s" :dur="durationSeconds" repeatCount="indefinite" values="0%;100%;0%" />
            <animate attributeName="x2" begin="0s" :dur="durationSeconds" repeatCount="indefinite" values="100%;0%;100%" />
            <stop offset="0%" :stop-color="primaryColor">
              <animate attributeName="stop-color" begin="0s" :dur="durationSeconds" repeatCount="indefinite" :values="`${primaryColor};${secondaryColor};${primaryColor}`" />
            </stop>
            <stop offset="100%" :stop-color="secondaryColor">
              <animate attributeName="stop-color" begin="0s" :dur="durationSeconds" repeatCount="indefinite" :values="`${secondaryColor};${primaryColor};${secondaryColor}`" />
            </stop>
          </linearGradient>
          <mask :id="maskId">
            <polyline fill="transparent" :points="`8, ${height * 0.4} 8, 3, ${width * 0.4 + 7}, 3`" stroke="#fff" stroke-width="3" />
            <polyline fill="#fff" :points="`8, ${height * 0.15} 8, 3, ${width * 0.1 + 7}, 3 ${width * 0.1}, 8 14, 8 14, ${height * 0.15 - 7}`" />
            <polyline fill="transparent" :points="`${width * 0.5}, 3 ${width - 3}, 3, ${width - 3}, ${height * 0.25}`" stroke="#fff" stroke-width="3" />
            <polyline fill="#fff" :points="`${width * 0.52}, 3 ${width * 0.58}, 3 ${width * 0.58 - 7}, 9 ${width * 0.52 + 7}, 9`" />
            <polyline fill="#fff" :points="`${width * 0.9}, 3 ${width - 3}, 3 ${width - 3}, ${height * 0.1} ${width - 9}, ${height * 0.1 - 7} ${width - 9}, 9 ${width * 0.9 + 7}, 9`" />
            <polyline fill="transparent" :points="`8, ${height * 0.5} 8, ${height - 3} ${width * 0.3 + 7}, ${height - 3}`" stroke="#fff" stroke-width="3" />
            <polyline fill="#fff" :points="`8, ${height * 0.55} 8, ${height * 0.7} 2, ${height * 0.7 - 7} 2, ${height * 0.55 + 7}`" />
            <polyline fill="transparent" :points="`${width * 0.35}, ${height - 3} ${width - 3}, ${height - 3} ${width - 3}, ${height * 0.35}`" stroke="#fff" stroke-width="3" />
            <polyline fill="#fff" :points="`${width * 0.92}, ${height - 3} ${width - 3}, ${height - 3} ${width - 3}, ${height * 0.8} ${width - 9}, ${height * 0.8 + 7} ${width - 9}, ${height - 9} ${width * 0.92 + 7}, ${height - 9}`" />
          </mask>
        </defs>
        <polygon
          :fill="resolvedBackground"
          :points="`15, 9 ${width * 0.1 + 1}, 9 ${width * 0.1 + 4}, 6 ${width * 0.52 + 2}, 6
          ${width * 0.52 + 6}, 10 ${width * 0.58 - 7}, 10 ${width * 0.58 - 2}, 6
          ${width * 0.9 + 2}, 6 ${width * 0.9 + 6}, 10 ${width - 10}, 10 ${width - 10}, ${height * 0.1 - 6}
          ${width - 6}, ${height * 0.1 - 1} ${width - 6}, ${height * 0.8 + 1} ${width - 10}, ${height * 0.8 + 6}
          ${width - 10}, ${height - 10} ${width * 0.92 + 7}, ${height - 10} ${width * 0.92 + 2}, ${height - 6}
          11, ${height - 6} 11, ${height * 0.15 - 2} 15, ${height * 0.15 - 7}`"
        />
        <rect :fill="`url(#${gradientId})`" :height="height" :mask="`url(#${maskId})`" :width="width" x="0" y="0" />
      </template>

      <template v-else-if="variant === 10">
        <polygon :fill="resolvedBackground" :points="`4, 0 ${width - 4}, 0 ${width}, 4 ${width}, ${height - 4} ${width - 4}, ${height} 4, ${height} 0, ${height - 4} 0, 4`" />
        <g v-for="(transform, index) in cornerTransforms" :key="index" :transform="transform || undefined">
          <polygon :fill="secondaryColor" points="40, 0 5, 0 0, 5 0, 16 3, 19 3, 7 7, 3 35, 3" />
        </g>
      </template>

      <template v-else-if="variant === 11">
        <defs>
          <filter :id="filterId" height="150%" width="150%" x="-25%" y="-25%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thicken" />
            <feGaussianBlur in="thicken" result="blurred" stdDeviation="3" />
            <feFlood :flood-color="secondaryColor" result="glowColor" />
            <feComposite in="glowColor" in2="blurred" operator="in" result="softGlowColored" />
            <feMerge>
              <feMergeNode in="softGlowColored" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polygon
          :fill="resolvedBackground"
          :points="`20, 32 ${width * 0.5 - titleWidth / 2}, 32 ${width * 0.5 - titleWidth / 2 + 20}, 53
          ${width * 0.5 + titleWidth / 2 - 20}, 53 ${width * 0.5 + titleWidth / 2}, 32
          ${width - 20}, 32 ${width - 8}, 48 ${width - 8}, ${height - 25} ${width - 20}, ${height - 8}
          20, ${height - 8} 8, ${height - 25} 8, 50`"
        />
        <polyline
          fill="none"
          :filter="`url(#${filterId})`"
          :points="`${(width - titleWidth) / 2}, 30
          20, 30 7, 50 7, ${50 + (height - 167) / 2}
          13, ${55 + (height - 167) / 2} 13, ${135 + (height - 167) / 2}
          7, ${140 + (height - 167) / 2} 7, ${height - 27}
          20, ${height - 7} ${width - 20}, ${height - 7} ${width - 7}, ${height - 27}
          ${width - 7}, ${140 + (height - 167) / 2} ${width - 13}, ${135 + (height - 167) / 2}
          ${width - 13}, ${55 + (height - 167) / 2} ${width - 7}, ${50 + (height - 167) / 2}
          ${width - 7}, 50 ${width - 20}, 30 ${(width + titleWidth) / 2}, 30
          ${(width + titleWidth) / 2 - 20}, 7 ${(width - titleWidth) / 2 + 20}, 7
          ${(width - titleWidth) / 2}, 30 ${(width - titleWidth) / 2 + 20}, 52
          ${(width + titleWidth) / 2 - 20}, 52 ${(width + titleWidth) / 2}, 30`"
          :stroke="primaryColor"
          stroke-width="1"
        />
        <polygon fill="transparent" :points="`${(width + titleWidth) / 2 - 5}, 30 ${(width + titleWidth) / 2 - 21}, 11 ${(width + titleWidth) / 2 - 27}, 11 ${(width + titleWidth) / 2 - 8}, 34`" :stroke="primaryColor" />
        <polygon fill="transparent" :points="`${(width - titleWidth) / 2 + 5}, 30 ${(width - titleWidth) / 2 + 22}, 49 ${(width - titleWidth) / 2 + 28}, 49 ${(width - titleWidth) / 2 + 8}, 26`" :stroke="primaryColor" />
        <polygon
          :fill="secondaryColor"
          fill-opacity="0.3"
          :filter="`url(#${filterId})`"
          :points="`${(width + titleWidth) / 2 - 11}, 37 ${(width + titleWidth) / 2 - 32}, 11
          ${(width - titleWidth) / 2 + 23}, 11 ${(width - titleWidth) / 2 + 11}, 23
          ${(width - titleWidth) / 2 + 33}, 49 ${(width + titleWidth) / 2 - 22}, 49`"
          :stroke="primaryColor"
        />
        <polygon v-for="item in 3" :key="`left-${item}`" :fill="primaryColor" :filter="`url(#${filterId})`" :opacity="pulseOpacity(item)" :points="`${(width - titleWidth) / 2 - 10 - (item - 1) * 30}, 37 ${(width - titleWidth) / 2 - 31 - (item - 1) * 30}, 37 ${(width - titleWidth) / 2 - 25 - (item - 1) * 30}, 46 ${(width - titleWidth) / 2 - 4 - (item - 1) * 30}, 46`">
          <animate attributeName="opacity" begin="0s" :dur="durationSeconds" repeatCount="indefinite" :values="`${pulseOpacity(item)};${pulseMinimumOpacity(item)};${pulseOpacity(item)}`" />
        </polygon>
        <polygon v-for="item in 3" :key="`right-${item}`" :fill="primaryColor" :filter="`url(#${filterId})`" :opacity="pulseOpacity(item)" :points="`${(width + titleWidth) / 2 + 30 + (item - 1) * 30}, 37 ${(width + titleWidth) / 2 + 9 + (item - 1) * 30}, 37 ${(width + titleWidth) / 2 + 3 + (item - 1) * 30}, 46 ${(width + titleWidth) / 2 + 24 + (item - 1) * 30}, 46`">
          <animate attributeName="opacity" begin="0s" :dur="durationSeconds" repeatCount="indefinite" :values="`${pulseOpacity(item)};${pulseMinimumOpacity(item)};${pulseOpacity(item)}`" />
        </polygon>
        <text :x="width / 2" y="32" fill="#fff" font-size="18" text-anchor="middle" dominant-baseline="middle">{{ title }}</text>
        <polygon :fill="primaryColor" :filter="`url(#${filterId})`" :points="`7, ${53 + (height - 167) / 2} 11, ${57 + (height - 167) / 2} 11, ${133 + (height - 167) / 2} 7, ${137 + (height - 167) / 2}`" />
        <polygon :fill="primaryColor" :filter="`url(#${filterId})`" :points="`${width - 7}, ${53 + (height - 167) / 2} ${width - 11}, ${57 + (height - 167) / 2} ${width - 11}, ${133 + (height - 167) / 2} ${width - 7}, ${137 + (height - 167) / 2}`" />
      </template>

      <template v-else-if="variant === 12">
        <defs>
          <filter :id="filterId" height="150%" width="150%" x="-25%" y="-25%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="thicken" />
            <feGaussianBlur in="thicken" result="blurred" stdDeviation="2" />
            <feFlood :flood-color="secondaryColor" flood-opacity="0.7" result="glowColor">
              <animate attributeName="flood-opacity" begin="0s" :dur="durationSeconds" repeatCount="indefinite" values="0.7;0.3;0.7" />
            </feFlood>
            <feComposite in="glowColor" in2="blurred" operator="in" result="softGlowColored" />
            <feMerge>
              <feMergeNode in="softGlowColored" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path v-if="width && height" :d="`M15 5 L ${width - 15} 5 Q ${width - 5} 5, ${width - 5} 15 L ${width - 5} ${height - 15} Q ${width - 5} ${height - 5}, ${width - 15} ${height - 5} L 15, ${height - 5} Q 5 ${height - 5} 5 ${height - 15} L 5 15 Q 5 5 15 5`" :fill="resolvedBackground" :stroke="primaryColor" stroke-width="2" />
        <path d="M 20 5 L 15 5 Q 5 5 5 15 L 5 20" fill="transparent" :filter="`url(#${filterId})`" stroke-linecap="round" :stroke="secondaryColor" stroke-width="2" />
        <path :d="`M ${width - 20} 5 L ${width - 15} 5 Q ${width - 5} 5 ${width - 5} 15 L ${width - 5} 20`" fill="transparent" :filter="`url(#${filterId})`" stroke-linecap="round" :stroke="secondaryColor" stroke-width="2" />
        <path :d="`M ${width - 20} ${height - 5} L ${width - 15} ${height - 5} Q ${width - 5} ${height - 5} ${width - 5} ${height - 15} L ${width - 5} ${height - 20}`" fill="transparent" :filter="`url(#${filterId})`" stroke-linecap="round" :stroke="secondaryColor" stroke-width="2" />
        <path :d="`M 20 ${height - 5} L 15 ${height - 5} Q 5 ${height - 5} 5 ${height - 15} L 5 ${height - 20}`" fill="transparent" :filter="`url(#${filterId})`" stroke-linecap="round" :stroke="secondaryColor" stroke-width="2" />
      </template>

      <template v-else>
        <path :d="`M 5 20 L 5 10 L 12 3 L 60 3 L 68 10 L ${width - 20} 10 L ${width - 5} 25 L ${width - 5} ${height - 5} L 20 ${height - 5} L 5 ${height - 20} L 5 20`" :fill="resolvedBackground" :stroke="primaryColor" />
        <path d="M 16 9 L 61 9" fill="transparent" stroke-dasharray="10, 5" stroke-linecap="round" :stroke="primaryColor" stroke-width="3" />
        <path d="M 5 20 L 5 10 L 12 3 L 60 3 L 68 10" fill="transparent" :stroke="secondaryColor" />
        <path :d="`M ${width - 5} ${height - 30} L ${width - 5} ${height - 5} L ${width - 30} ${height - 5}`" fill="transparent" :stroke="secondaryColor" />
      </template>
    </svg>

    <div class="luma-border-box__content">
      <slot />
    </div>
  </div>
</template>
