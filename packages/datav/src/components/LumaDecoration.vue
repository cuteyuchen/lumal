<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { DecorationVariant } from '../types'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import { useAnimationPause } from '../composables/useAnimationPause'
import { useElementSize } from '../composables/useElementSize'
import { colorStyle } from '../utils'
import {
  createDecorationInstanceId,
  createDecoration1Points,
  createDecoration3Points,
  createDecoration6Bars,
  createDecoration9Fills,
  createRadarGeometry,
  decoration1Rects,
  DECORATION_DEFAULT_COLORS,
  DECORATION_DEFAULT_DURATION,
  fadeColor,
  polylineLength,
} from './decorationGeometry'

// DataV intentionally creates these layouts with Math.random on each mount.
// Keep that behavior instance-local instead of freezing a package-wide seed.
const decoration1Points = createDecoration1Points()
const decoration3Points = createDecoration3Points()
const decoration6Bars = createDecoration6Bars()
const decoration9Fills = createDecoration9Fills()

const props = withDefaults(defineProps<{
  variant?: DecorationVariant
  color?: readonly [string, string]
  colors?: readonly [string, string]
  background?: string
  dur?: number
  duration?: number
  haloDur?: number
  reverse?: boolean
  scanDur?: number
}>(), {
  background: undefined,
  color: undefined,
  colors: undefined,
  dur: undefined,
  duration: undefined,
  haloDur: undefined,
  reverse: false,
  scanDur: undefined,
  variant: 1,
})

const animationRef = useTemplateRef<HTMLElement>('animationRef')
const size = useElementSize(animationRef)
const visibilityPaused = useAnimationPause(animationRef)
const hoverPaused = shallowRef(false)
const focusPaused = shallowRef(false)
const reducedMotion = shallowRef(false)
let motionQuery: MediaQueryList | undefined

const width = computed(() => size.value.width)
const height = computed(() => size.value.height)
const resolvedColors = computed<readonly [string, string]>(() => {
  const defaults = DECORATION_DEFAULT_COLORS[props.variant]
  const colors = props.color ?? props.colors
  return [colors?.[0] ?? defaults[0], colors?.[1] ?? defaults[1]]
})
const nativeDuration = computed(() => props.variant === 12 ? props.scanDur : props.dur)
const resolvedDuration = computed(() => {
  const duration = nativeDuration.value === undefined
    ? props.duration
    : nativeDuration.value * 1000
  return Math.max(0, duration ?? DECORATION_DEFAULT_DURATION[props.variant])
})
const durationScale = computed(() => (
  resolvedDuration.value / DECORATION_DEFAULT_DURATION[props.variant]
))
const animationEnabled = computed(() => resolvedDuration.value > 0)
const radarHaloDuration = computed(() => {
  const seconds = props.haloDur ?? 2 * durationScale.value
  return `${Number(Math.max(0.001, seconds).toFixed(6))}s`
})
const animationPaused = computed(() => (
  visibilityPaused.value
  || hoverPaused.value
  || focusPaused.value
  || reducedMotion.value
  || !animationEnabled.value
))
const rootStyle = computed<CSSProperties>(() => colorStyle(
  resolvedColors.value,
  props.background,
  resolvedDuration.value,
))

const instanceId = createDecorationInstanceId(useId())
const polygonId = `${instanceId}-polygon`
const radarGroupId = `${instanceId}-radar-group`
const radarGradientId = `${instanceId}-radar-gradient`
const sequenceIds = [
  `${instanceId}-sequence-1`,
  `${instanceId}-sequence-2`,
  `${instanceId}-sequence-3`,
  `${instanceId}-sequence-4`,
  `${instanceId}-sequence-5`,
  `${instanceId}-sequence-6`,
  `${instanceId}-sequence-7`,
] as const

const decoration5Line1 = computed(() => [
  [0, height.value * 0.2],
  [width.value * 0.18, height.value * 0.2],
  [width.value * 0.2, height.value * 0.4],
  [width.value * 0.25, height.value * 0.4],
  [width.value * 0.27, height.value * 0.6],
  [width.value * 0.72, height.value * 0.6],
  [width.value * 0.75, height.value * 0.4],
  [width.value * 0.8, height.value * 0.4],
  [width.value * 0.82, height.value * 0.2],
  [width.value, height.value * 0.2],
] as const)
const decoration5Line2 = computed(() => [
  [width.value * 0.3, height.value * 0.8],
  [width.value * 0.7, height.value * 0.8],
] as const)
const decoration5Line1Points = computed(() => decoration5Line1.value.map(point => point.join(',')).join(' '))
const decoration5Line2Points = computed(() => decoration5Line2.value.map(point => point.join(',')).join(' '))
const decoration5Line1Length = computed(() => polylineLength(decoration5Line1.value))
const decoration5Line2Length = computed(() => polylineLength(decoration5Line2.value))
const radarGeometry = computed(() => createRadarGeometry(width.value, height.value))
const radarPathColors = computed(() => radarGeometry.value.scanPaths.map((_, index, paths) => (
  fadeColor(resolvedColors.value[0], 100 - index * 100 / (paths.length - 1))
)))

function smilDuration(baseSeconds: number): string {
  const seconds = Math.max(0.001, baseSeconds * durationScale.value)
  return `${Number(seconds.toFixed(6))}s`
}

function animationValues(values: readonly (number | string)[], reversible = true): string {
  const normalized = values.map(String)
  return (props.reverse && reversible ? normalized.reverse() : normalized).join(';')
}

function xPosition(position: number): number {
  return props.reverse ? width.value - position : position
}

function syncMotionPreference(event: MediaQueryListEvent | MediaQueryList): void {
  reducedMotion.value = event.matches
}

function getSvgElements(): SVGSVGElement[] {
  return Array.from(animationRef.value?.querySelectorAll('svg') ?? [])
}

function syncSvgAnimations(): void {
  for (const svg of getSvgElements()) {
    if (animationPaused.value)
      svg.pauseAnimations?.()
    else
      svg.unpauseAnimations?.()
  }
}

function restartSvgAnimations(): void {
  for (const svg of getSvgElements())
    svg.setCurrentTime?.(0)
  syncSvgAnimations()
}

function handleFocusOut(event: FocusEvent): void {
  const nextTarget = event.relatedTarget as Node | null
  focusPaused.value = Boolean(nextTarget && animationRef.value?.contains(nextTarget))
}

watch(animationPaused, () => void nextTick(syncSvgAnimations), { immediate: true })
watch(
  () => [
    props.variant,
    props.reverse,
    props.color,
    props.colors,
    props.dur,
    props.duration,
    props.haloDur,
    props.scanDur,
  ] as const,
  () => void nextTick(restartSvgAnimations),
  { flush: 'post' },
)

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    syncMotionPreference(motionQuery)
    motionQuery.addEventListener?.('change', syncMotionPreference)
  }
  void nextTick(syncSvgAnimations)
})

onBeforeUnmount(() => {
  motionQuery?.removeEventListener?.('change', syncMotionPreference)
})
</script>

<template>
  <div
    ref="animationRef"
    class="luma-decoration"
    :class="{ 'is-animation-paused': animationPaused, 'is-reverse': reverse }"
    :data-variant="variant"
    :style="rootStyle"
    @mouseenter="hoverPaused = true"
    @mouseleave="hoverPaused = false"
    @focusin="focusPaused = true"
    @focusout="handleFocusOut"
  >
    <svg
      v-if="variant === 1"
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 200 50"
    >
      <rect
        v-for="(item, index) in decoration1Points"
        :key="index"
        class="luma-decoration__mark"
        :fill="resolvedColors[0]"
        :height="2.5"
        :width="2.5"
        :x="item.point[0] - 1.25"
        :y="item.point[1] - 1.25"
      >
        <animate
          v-if="item.animated && animationEnabled"
          attributeName="fill"
          :begin="`${item.beginSeconds}s`"
          :dur="smilDuration(item.durationSeconds)"
          repeatCount="indefinite"
          :values="animationValues([resolvedColors[0], 'transparent'])"
        />
      </rect>

      <rect
        :fill="resolvedColors[1]"
        :height="5"
        :width="5"
        :x="decoration1Rects[0][0] - 2.5"
        :y="decoration1Rects[0][1] - 2.5"
      >
        <animate v-if="animationEnabled" attributeName="width" :dur="smilDuration(2)" repeatCount="indefinite" :values="animationValues([0, 5])" />
        <animate v-if="animationEnabled" attributeName="height" :dur="smilDuration(2)" repeatCount="indefinite" :values="animationValues([0, 5])" />
        <animate v-if="animationEnabled" attributeName="x" :dur="smilDuration(2)" repeatCount="indefinite" :values="animationValues([decoration1Rects[0][0], decoration1Rects[0][0] - 2.5])" />
        <animate v-if="animationEnabled" attributeName="y" :dur="smilDuration(2)" repeatCount="indefinite" :values="animationValues([decoration1Rects[0][1], decoration1Rects[0][1] - 2.5])" />
      </rect>

      <rect
        :fill="resolvedColors[1]"
        :height="5"
        :width="40"
        :x="decoration1Rects[1][0] - 40"
        :y="decoration1Rects[1][1] - 2.5"
      >
        <animate v-if="animationEnabled" attributeName="width" :dur="smilDuration(2)" repeatCount="indefinite" :values="animationValues([0, 40, 0])" />
        <animate v-if="animationEnabled" attributeName="x" :dur="smilDuration(2)" repeatCount="indefinite" :values="animationValues([decoration1Rects[1][0], decoration1Rects[1][0] - 40, decoration1Rects[1][0]])" />
      </rect>
    </svg>

    <svg
      v-else-if="variant === 2"
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      :height="height"
      :width="width"
    >
      <rect
        :fill="resolvedColors[0]"
        :height="reverse ? height : 1"
        :width="reverse ? 1 : width"
        :x="reverse ? width / 2 : 0"
        :y="reverse ? 0 : height / 2"
      >
        <animate
          v-if="animationEnabled"
          :attributeName="reverse ? 'height' : 'width'"
          calcMode="spline"
          :dur="smilDuration(6)"
          from="0"
          keySplines=".42,0,.58,1"
          keyTimes="0;1"
          repeatCount="indefinite"
          :to="reverse ? height : width"
        />
      </rect>
      <rect
        :fill="resolvedColors[1]"
        height="1"
        width="1"
        :x="reverse ? width / 2 : 0"
        :y="reverse ? 0 : height / 2"
      >
        <animate
          v-if="animationEnabled"
          :attributeName="reverse ? 'y' : 'x'"
          calcMode="spline"
          :dur="smilDuration(6)"
          from="0"
          keySplines=".42,0,.58,1"
          keyTimes="0;1"
          repeatCount="indefinite"
          :to="reverse ? height : width"
        />
      </rect>
    </svg>

    <svg
      v-else-if="variant === 3"
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 300 35"
    >
      <rect
        v-for="(item, index) in decoration3Points"
        :key="index"
        class="luma-decoration__mark"
        :fill="resolvedColors[0]"
        height="7"
        width="7"
        :x="item.point[0] - 3.5"
        :y="item.point[1] - 3.5"
      >
        <animate
          v-if="item.animated && animationEnabled"
          attributeName="fill"
          :begin="`${item.beginSeconds}s`"
          :dur="smilDuration(item.durationSeconds)"
          repeatCount="indefinite"
          :values="animationValues(resolvedColors)"
        />
      </rect>
    </svg>

    <div
      v-else-if="variant === 4"
      class="luma-decoration__line-reveal"
      :class="[
        reverse ? 'luma-decoration__line-reveal--horizontal' : 'luma-decoration__line-reveal--vertical',
        { 'is-static': !animationEnabled },
      ]"
      :style="{
        animationDuration: `${resolvedDuration / 1000}s`,
        height: reverse ? '5px' : `${height}px`,
        width: reverse ? `${width}px` : '5px',
      }"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        :height="reverse ? 5 : height"
        :width="reverse ? width : 5"
      >
        <polyline
          :points="reverse ? `0,2.5 ${width},2.5` : `2.5,0 2.5,${height}`"
          :stroke="resolvedColors[0]"
        />
        <polyline
          :points="reverse ? `0,2.5 ${width},2.5` : `2.5,0 2.5,${height}`"
          :stroke="resolvedColors[1]"
          stroke-dasharray="20,80"
          stroke-dashoffset="-30"
          stroke-width="3"
        />
      </svg>
    </div>

    <svg
      v-else-if="variant === 5"
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      :height="height"
      :width="width"
    >
      <polyline
        fill="transparent"
        :points="decoration5Line1Points"
        :stroke="resolvedColors[0]"
        stroke-width="3"
      >
        <animate
          v-if="animationEnabled"
          attributeName="stroke-dasharray"
          calcMode="spline"
          :dur="smilDuration(1.2)"
          :from="`0, ${decoration5Line1Length / 2}, 0, ${decoration5Line1Length / 2}`"
          keySplines=".4,1,.49,.98"
          keyTimes="0;1"
          repeatCount="indefinite"
          :to="`0, 0, ${decoration5Line1Length}, 0`"
        />
      </polyline>
      <polyline
        fill="transparent"
        :points="decoration5Line2Points"
        :stroke="resolvedColors[1]"
        stroke-width="2"
      >
        <animate
          v-if="animationEnabled"
          attributeName="stroke-dasharray"
          calcMode="spline"
          :dur="smilDuration(1.2)"
          :from="`0, ${decoration5Line2Length / 2}, 0, ${decoration5Line2Length / 2}`"
          keySplines=".4,1,.49,.98"
          keyTimes="0;1"
          repeatCount="indefinite"
          :to="`0, 0, ${decoration5Line2Length}, 0`"
        />
      </polyline>
    </svg>

    <svg
      v-else-if="variant === 6"
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 300 35"
    >
      <rect
        v-for="(bar, index) in decoration6Bars"
        :key="index"
        class="luma-decoration__bar"
        :fill="resolvedColors[bar.colorIndex]"
        :height="bar.height"
        width="7"
        :x="bar.point[0] - 3.5"
        :y="bar.point[1] - bar.height / 2"
      >
        <animate
          v-if="animationEnabled"
          attributeName="y"
          begin="0s"
          calcMode="spline"
          :dur="smilDuration(bar.durationSeconds)"
          keySplines=".42,0,.58,1;.42,0,.58,1"
          keyTimes="0;.5;1"
          repeatCount="indefinite"
          :values="animationValues([bar.point[1] - bar.minHeight / 2, bar.point[1] - bar.height / 2, bar.point[1] - bar.minHeight / 2])"
        />
        <animate
          v-if="animationEnabled"
          attributeName="height"
          begin="0s"
          calcMode="spline"
          :dur="smilDuration(bar.durationSeconds)"
          keySplines=".42,0,.58,1;.42,0,.58,1"
          keyTimes="0;.5;1"
          repeatCount="indefinite"
          :values="animationValues([bar.minHeight, bar.height, bar.minHeight])"
        />
      </rect>
    </svg>

    <div v-else-if="variant === 7" class="luma-decoration__chevrons">
      <svg aria-hidden="true" focusable="false" height="20" viewBox="0 0 21 20" width="21">
        <polyline fill="transparent" points="10,0 19,10 10,20" :stroke="resolvedColors[0]" stroke-width="4" />
        <polyline fill="transparent" points="2,0 11,10 2,20" :stroke="resolvedColors[1]" stroke-width="2" />
      </svg>
      <div class="luma-decoration__content luma-decoration__content--inline">
        <slot />
      </div>
      <svg aria-hidden="true" focusable="false" height="20" viewBox="0 0 21 20" width="21">
        <polyline fill="transparent" points="11,0 2,10 11,20" :stroke="resolvedColors[0]" stroke-width="4" />
        <polyline fill="transparent" points="19,0 10,10 19,20" :stroke="resolvedColors[1]" stroke-width="2" />
      </svg>
    </div>

    <svg
      v-else-if="variant === 8"
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      :height="height"
      :width="width"
    >
      <polyline fill="transparent" :points="`${xPosition(0)},0 ${xPosition(30)},${height / 2}`" :stroke="resolvedColors[0]" stroke-width="2" />
      <polyline fill="transparent" :points="`${xPosition(20)},0 ${xPosition(50)},${height / 2} ${xPosition(width)},${height / 2}`" :stroke="resolvedColors[0]" stroke-width="2" />
      <polyline fill="transparent" :points="`${xPosition(0)},${height - 3} ${xPosition(200)},${height - 3}`" :stroke="resolvedColors[1]" stroke-width="3" />
    </svg>

    <svg
      v-else-if="variant === 9"
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <defs>
        <polygon :id="polygonId" points="15,46.5 21,47.5 21,52.5 15,53.5" />
      </defs>
      <circle class="luma-decoration__ring" cx="50" cy="50" fill="transparent" r="45" stroke-dasharray="80,100,30,100" :stroke="resolvedColors[1]" stroke-width="10">
        <animateTransform v-if="animationEnabled" attributeName="transform" :dur="smilDuration(3)" repeatCount="indefinite" type="rotate" :values="reverse ? '0 50 50;-360 50 50' : '0 50 50;360 50 50'" />
      </circle>
      <circle class="luma-decoration__ring" cx="50" cy="50" fill="transparent" r="45" stroke-dasharray="50,66,100,66" :stroke="resolvedColors[0]" stroke-width="6">
        <animateTransform v-if="animationEnabled" attributeName="transform" :dur="smilDuration(3)" repeatCount="indefinite" type="rotate" :values="reverse ? '0 50 50;360 50 50' : '0 50 50;-360 50 50'" />
      </circle>
      <circle class="luma-decoration__ring" cx="50" cy="50" fill="transparent" r="38" stroke-dasharray="5,1" :stroke="fadeColor(resolvedColors[1], 30)" stroke-width="1" />
      <use
        v-for="(filled, index) in decoration9Fills"
        :key="index"
        :fill="filled ? resolvedColors[0] : 'transparent'"
        :href="`#${polygonId}`"
        :stroke="resolvedColors[1]"
      >
        <animateTransform
          v-if="animationEnabled"
          attributeName="transform"
          :begin="`${index * resolvedDuration / 20 / 1000}s`"
          :dur="smilDuration(3)"
          repeatCount="indefinite"
          type="rotate"
          :values="reverse ? '0 50 50;-360 50 50' : '0 50 50;360 50 50'"
        />
      </use>
      <circle class="luma-decoration__ring" cx="50" cy="50" fill="transparent" r="26" stroke-dasharray="5,1" :stroke="fadeColor(resolvedColors[1], 30)" stroke-width="1" />
    </svg>

    <svg
      v-else-if="variant === 10"
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      :height="height"
      :width="width"
    >
      <polyline fill="transparent" :points="`${xPosition(0)},${height / 2} ${xPosition(width)},${height / 2}`" :stroke="resolvedColors[1]" stroke-width="2" />
      <polyline class="luma-decoration__segment" fill="transparent" :points="`${xPosition(5)},${height / 2} ${xPosition(width * 0.2 - 3)},${height / 2}`" :stroke="resolvedColors[0]" :stroke-dasharray="`0,${width * 0.2}`" stroke-width="2">
        <animate v-if="animationEnabled" :id="sequenceIds[1]" attributeName="stroke-dasharray" :begin="`${sequenceIds[0]}.end`" :dur="smilDuration(3)" fill="freeze" :values="`0,${width * 0.2};${width * 0.2},0`" />
        <animate v-if="animationEnabled" attributeName="stroke-dasharray" :begin="`${sequenceIds[6]}.end`" dur="0.01s" fill="freeze" :values="`${width * 0.2},0;0,${width * 0.2}`" />
      </polyline>
      <polyline class="luma-decoration__segment" fill="transparent" :points="`${xPosition(width * 0.2 + 3)},${height / 2} ${xPosition(width * 0.8 - 3)},${height / 2}`" :stroke="resolvedColors[0]" :stroke-dasharray="`0,${width * 0.6}`" stroke-width="2">
        <animate v-if="animationEnabled" :id="sequenceIds[3]" attributeName="stroke-dasharray" :begin="`${sequenceIds[2]}.end + ${smilDuration(1)}`" :dur="smilDuration(3)" fill="freeze" :values="`0,${width * 0.6};${width * 0.6},0`" />
        <animate v-if="animationEnabled" attributeName="stroke-dasharray" :begin="`${sequenceIds[6]}.end`" dur="0.01s" fill="freeze" :values="`${width * 0.6},0;0,${width * 0.6}`" />
      </polyline>
      <polyline class="luma-decoration__segment" fill="transparent" :points="`${xPosition(width * 0.8 + 3)},${height / 2} ${xPosition(width - 5)},${height / 2}`" :stroke="resolvedColors[0]" :stroke-dasharray="`0,${width * 0.2}`" stroke-width="2">
        <animate v-if="animationEnabled" :id="sequenceIds[5]" attributeName="stroke-dasharray" :begin="`${sequenceIds[4]}.end + ${smilDuration(1)}`" :dur="smilDuration(3)" fill="freeze" :values="`0,${width * 0.2};${width * 0.2},0`" />
        <animate v-if="animationEnabled" attributeName="stroke-dasharray" :begin="`${sequenceIds[6]}.end`" dur="0.01s" fill="freeze" :values="`${width * 0.2},0;0,${width * 0.3}`" />
      </polyline>
      <circle :cx="xPosition(2)" :cy="height / 2" :fill="resolvedColors[1]" r="2">
        <animate v-if="animationEnabled" :id="sequenceIds[0]" attributeName="fill" :begin="`0s;${sequenceIds[6]}.end`" :dur="smilDuration(0.3)" fill="freeze" :values="`${resolvedColors[1]};${resolvedColors[0]}`" />
      </circle>
      <circle :cx="xPosition(width * 0.2)" :cy="height / 2" :fill="resolvedColors[1]" r="2">
        <animate v-if="animationEnabled" :id="sequenceIds[2]" attributeName="fill" :begin="`${sequenceIds[1]}.end`" :dur="smilDuration(0.3)" fill="freeze" :values="`${resolvedColors[1]};${resolvedColors[0]}`" />
        <animate v-if="animationEnabled" attributeName="fill" :begin="`${sequenceIds[6]}.end`" dur="0.01s" fill="freeze" :values="`${resolvedColors[1]};${resolvedColors[1]}`" />
      </circle>
      <circle :cx="xPosition(width * 0.8)" :cy="height / 2" :fill="resolvedColors[1]" r="2">
        <animate v-if="animationEnabled" :id="sequenceIds[4]" attributeName="fill" :begin="`${sequenceIds[3]}.end`" :dur="smilDuration(0.3)" fill="freeze" :values="`${resolvedColors[1]};${resolvedColors[0]}`" />
        <animate v-if="animationEnabled" attributeName="fill" :begin="`${sequenceIds[6]}.end`" dur="0.01s" fill="freeze" :values="`${resolvedColors[1]};${resolvedColors[1]}`" />
      </circle>
      <circle :cx="xPosition(width - 2)" :cy="height / 2" :fill="resolvedColors[1]" r="2">
        <animate v-if="animationEnabled" :id="sequenceIds[6]" attributeName="fill" :begin="`${sequenceIds[5]}.end`" :dur="smilDuration(0.3)" fill="freeze" :values="`${resolvedColors[1]};${resolvedColors[0]}`" />
        <animate v-if="animationEnabled" attributeName="fill" :begin="`${sequenceIds[6]}.end`" dur="0.01s" fill="freeze" :values="`${resolvedColors[1]};${resolvedColors[1]}`" />
      </circle>
    </svg>

    <svg
      v-else-if="variant === 11"
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      :height="height"
      :width="width"
    >
      <polygon :fill="fadeColor(resolvedColors[1], 10)" points="20 10,25 4,55 4,60 10" :stroke="resolvedColors[1]" />
      <polygon :fill="fadeColor(resolvedColors[1], 10)" :points="`20 ${height - 10},25 ${height - 4},55 ${height - 4},60 ${height - 10}`" :stroke="resolvedColors[1]" />
      <polygon :fill="fadeColor(resolvedColors[1], 10)" :points="`${width - 20} 10,${width - 25} 4,${width - 55} 4,${width - 60} 10`" :stroke="resolvedColors[1]" />
      <polygon :fill="fadeColor(resolvedColors[1], 10)" :points="`${width - 20} ${height - 10},${width - 25} ${height - 4},${width - 55} ${height - 4},${width - 60} ${height - 10}`" :stroke="resolvedColors[1]" />
      <polygon :fill="fadeColor(resolvedColors[0], 20)" :points="`20 10,5 ${height / 2},20 ${height - 10},${width - 20} ${height - 10},${width - 5} ${height / 2},${width - 20} 10`" :stroke="resolvedColors[0]" />
      <polyline fill="transparent" :points="`25 18,15 ${height / 2},25 ${height - 18}`" :stroke="fadeColor(resolvedColors[0], 70)" />
      <polyline fill="transparent" :points="`${width - 25} 18,${width - 15} ${height / 2},${width - 25} ${height - 18}`" :stroke="fadeColor(resolvedColors[0], 70)" />
    </svg>

    <svg
      v-else
      class="luma-decoration__svg"
      aria-hidden="true"
      focusable="false"
      :height="height"
      :width="width"
    >
      <defs>
        <g :id="radarGroupId">
          <path
            v-for="(path, index) in radarGeometry.scanPaths"
            :key="path"
            fill="transparent"
            :d="path"
            :stroke="radarPathColors[index]"
            :stroke-width="width / 2"
          />
        </g>
        <radialGradient :id="radarGradientId" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="transparent" stop-opacity="1" />
          <stop offset="100%" :stop-color="fadeColor(resolvedColors[1], 30)" stop-opacity="1" />
        </radialGradient>
      </defs>
      <circle
        v-for="radius in radarGeometry.circleRadii"
        :key="radius"
        :cx="width / 2"
        :cy="height / 2"
        fill="transparent"
        :r="radius"
        :stroke="resolvedColors[1]"
        stroke-width="0.5"
      />
      <circle :cx="width / 2" :cy="height / 2" :fill="`url(#${radarGradientId})`" r="1" stroke="transparent">
        <animate v-if="animationEnabled" attributeName="r" :dur="radarHaloDuration" repeatCount="indefinite" :values="`1;${width / 2}`" />
        <animate v-if="animationEnabled" attributeName="opacity" :dur="radarHaloDuration" repeatCount="indefinite" values="1;0" />
      </circle>
      <circle :cx="width / 2" :cy="height / 2" :fill="resolvedColors[1]" r="2" />
      <g>
        <polyline
          v-for="points in radarGeometry.splitLines"
          :key="points"
          opacity="0.5"
          :points="points"
          :stroke="resolvedColors[1]"
          stroke-width="0.5"
        />
      </g>
      <path
        v-for="path in radarGeometry.arcPaths"
        :key="path"
        fill="transparent"
        :d="path"
        :stroke="resolvedColors[1]"
        stroke-width="2"
      />
      <use :href="`#${radarGroupId}`">
        <animateTransform
          v-if="animationEnabled"
          attributeName="transform"
          :dur="smilDuration(3)"
          repeatCount="indefinite"
          type="rotate"
          :values="reverse
            ? `0,${width / 2} ${height / 2};-360,${width / 2} ${height / 2}`
            : `0,${width / 2} ${height / 2};360,${width / 2} ${height / 2}`"
        />
      </use>
    </svg>

    <div
      v-if="variant !== 7"
      class="luma-decoration__content"
      :class="{ 'luma-decoration__content--centered': variant === 9 || variant === 11 || variant === 12 }"
    >
      <slot />
    </div>
  </div>
</template>
