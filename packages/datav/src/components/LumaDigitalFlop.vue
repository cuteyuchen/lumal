<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { DigitalFlopConfig } from '../types'
import { computed, onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue'
import { useAnimationPause } from '../composables/useAnimationPause'
import { useReducedMotion } from '../composables/useReducedMotion'

const props = defineProps<{
  config?: DigitalFlopConfig
  value?: number
  numbers?: readonly number[]
  content?: string
  precision?: number
  prefix?: string
  suffix?: string
  duration?: number
  animationFrame?: number
  animationCurve?: string
  formatter?: (value: number, index: number) => string
  color?: string
  fontFamily?: string
  fontSize?: number
  fontStyle?: string
  fontWeight?: number | string
  rowGap?: number
  textAlign?: 'left' | 'center' | 'right'
}>()

const root = useTemplateRef<HTMLElement>('root')
const reducedMotion = useReducedMotion()
const viewportPaused = useAnimationPause(root)
const configStyle = computed(() => props.config?.style)
const animationCurve = computed(() => props.animationCurve ?? props.config?.animationCurve ?? 'easeOutCubic')
const animationFrame = computed(() => props.animationFrame ?? props.config?.animationFrame ?? 50)
const precision = computed(() => Math.min(100, Math.max(0, Math.floor(props.precision ?? props.config?.toFixed ?? 0))))
const rowGap = computed(() => props.rowGap ?? props.config?.rowGap ?? 0)
const color = computed(() => props.color ?? configStyle.value?.fill ?? '#3de7c9')
const fontFamily = computed(() => props.fontFamily ?? configStyle.value?.fontFamily ?? 'Arial')
const fontSize = computed(() => props.fontSize ?? configStyle.value?.fontSize ?? 30)
const fontStyle = computed(() => props.fontStyle ?? configStyle.value?.fontStyle ?? 'normal')
const fontVariant = computed(() => configStyle.value?.fontVarient ?? 'normal')
const fontWeight = computed(() => props.fontWeight ?? configStyle.value?.fontWeight ?? 'normal')
const opacity = computed(() => configStyle.value?.opacity ?? 1)
const stroke = computed(() => configStyle.value?.stroke ?? 'transparent')
const textAlign = computed(() => props.textAlign ?? props.config?.textAlign ?? 'center')
let frame: number | undefined

function finiteValue(value: number | undefined): number {
  return Number.isFinite(value) ? value! : 0
}

function sourceNumbers(): number[] {
  if (props.numbers !== undefined)
    return props.numbers.map(finiteValue)
  if (props.value !== undefined)
    return [finiteValue(props.value)]
  return (props.config?.number ?? []).map(finiteValue)
}

const displayed = shallowRef(sourceNumbers())

function cancelAnimation(): void {
  if (frame === undefined)
    return
  if (typeof cancelAnimationFrame === 'function')
    cancelAnimationFrame(frame)
  else
    clearTimeout(frame)
  frame = undefined
}

function requestFrame(callback: FrameRequestCallback): number {
  if (typeof requestAnimationFrame === 'function')
    return requestAnimationFrame(callback)
  return setTimeout(() => callback(Date.now()), 16) as unknown as number
}

function animationDuration(): number {
  if (props.duration !== undefined)
    return Math.max(0, props.duration)
  return Math.max(0, animationFrame.value) * (1000 / 60)
}

function finishAnimation(): void {
  cancelAnimation()
  displayed.value = sourceNumbers()
}

function animate(): void {
  cancelAnimation()
  const target = sourceNumbers()
  const duration = animationDuration()
  if (
    target.length !== displayed.value.length
    || duration === 0
    || reducedMotion.value
    || viewportPaused.value
    || typeof window === 'undefined'
  ) {
    displayed.value = target
    return
  }

  const start = [...displayed.value]
  const startedAt = typeof performance === 'undefined' ? Date.now() : performance.now()
  const step = (now: number): void => {
    const progress = Math.min(1, Math.max(0, (now - startedAt) / duration))
    const eased = animationCurve.value === 'linear' ? progress : 1 - (1 - progress) ** 3
    displayed.value = target.map((value, index) => start[index]! + (value - start[index]!) * eased)
    if (progress < 1)
      frame = requestFrame(step)
    else
      frame = undefined
  }
  frame = requestFrame(step)
}

const formattedNumbers = computed(() => displayed.value.map((value, index) => (
  props.formatter?.(value, index)
  ?? props.config?.formatter?.(value.toFixed(precision.value))
  ?? value.toFixed(precision.value)
)))
const renderedContent = computed(() => {
  const template = props.content
    ?? (props.prefix !== undefined || props.suffix !== undefined
      ? `${props.prefix ?? ''}{nt}${props.suffix ?? ''}`
      : props.config?.content ?? '')
  return template
    .split('{nt}')
    .map((part, index) => `${part}${formattedNumbers.value[index] ?? ''}`)
    .join('')
})
const lines = computed(() => renderedContent.value.split('\n'))
const lineAdvance = computed(() => Math.max(1, fontSize.value) + rowGap.value)
const firstLineOffset = computed(() => -((lines.value.length - 1) * lineAdvance.value) / 2)
const textAnchor = computed(() => ({ left: 'start', center: 'middle', right: 'end' })[textAlign.value])
const textX = computed(() => ({ left: '0%', center: '50%', right: '100%' })[textAlign.value])
const rootStyle = computed<CSSProperties>(() => ({
  '--luma-digital-flop-height': `${Math.max(
    1,
    fontSize.value * lines.value.length + rowGap.value * Math.max(0, lines.value.length - 1),
  )}px`,
}) as CSSProperties)

watch([() => props.value, () => props.numbers, () => props.config], animate)
watch([reducedMotion, viewportPaused], ([reduced, paused]) => {
  if (reduced || paused)
    finishAnimation()
})
onBeforeUnmount(cancelAnimation)
</script>

<template>
  <div
    ref="root"
    class="luma-digital-flop"
    :style="rootStyle"
    :aria-label="renderedContent"
  >
    <svg class="luma-digital-flop__svg" width="100%" height="100%" aria-hidden="true">
      <text
        class="luma-digital-flop__value"
        :x="textX"
        y="50%"
        :fill="color"
        :font-family="fontFamily"
        :font-size="fontSize"
        :font-style="fontStyle"
        :font-variant="fontVariant"
        :font-weight="fontWeight"
        :opacity="opacity"
        :stroke="stroke"
        :text-anchor="textAnchor"
        dominant-baseline="middle"
      >
        <tspan
          v-for="(line, index) in lines"
          :key="index"
          :x="textX"
          :dy="index === 0 ? firstLineOffset : lineAdvance"
        >{{ line }}</tspan>
      </text>
    </svg>
  </div>
</template>
