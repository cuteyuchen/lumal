<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { DigitalFlopConfig } from '../types'
import { useViewportWidth } from '@lumal/viewport'
import { computed, onBeforeUnmount, shallowRef, useId, useTemplateRef, watch } from 'vue'
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
const { pixels } = useViewportWidth()
const shadowFilterId = `lumal-digital-flop-shadow-${useId().replaceAll(':', '')}`
const reducedMotion = useReducedMotion()
const viewportPaused = useAnimationPause(root)
const configStyle = computed(() => props.config?.style)
const animationCurve = computed(() => props.animationCurve ?? props.config?.animationCurve ?? 'easeOutCubic')
const animationFrame = computed(() => props.animationFrame ?? props.config?.animationFrame ?? 50)
const precision = computed(() => Math.min(100, Math.max(0, Math.floor(props.precision ?? props.config?.toFixed ?? 0))))
const rowGap = computed(() => pixels(props.rowGap ?? props.config?.rowGap ?? 0))
const color = computed(() => props.color ?? configStyle.value?.fill ?? '#3de7c9')
const fontFamily = computed(() => props.fontFamily ?? configStyle.value?.fontFamily ?? 'Arial')
const fontSize = computed(() => pixels(props.fontSize ?? configStyle.value?.fontSize ?? 30))
const fontStyle = computed(() => props.fontStyle ?? configStyle.value?.fontStyle ?? 'normal')
const fontVariant = computed(() => configStyle.value?.fontVarient ?? 'normal')
const fontWeight = computed(() => props.fontWeight ?? configStyle.value?.fontWeight ?? 'normal')
const opacity = computed(() => configStyle.value?.opacity ?? 1)
const stroke = computed(() => configStyle.value?.stroke ?? 'transparent')
const lineCap = computed(() => configStyle.value?.lineCap)
const lineDash = computed(() => configStyle.value?.lineDash?.map(pixels))
const lineDashOffset = computed(() => pixels(configStyle.value?.lineDashOffset ?? 0))
const lineJoin = computed(() => configStyle.value?.lineJoin)
const lineWidth = computed(() => pixels(configStyle.value?.lineWidth ?? 0))
const shadowBlur = computed(() => pixels(Math.max(0, configStyle.value?.shadowBlur ?? 0)))
const shadowColor = computed(() => configStyle.value?.shadowColor ?? 'transparent')
const shadowOffsetX = computed(() => pixels(configStyle.value?.shadowOffsetX ?? 0))
const shadowOffsetY = computed(() => pixels(configStyle.value?.shadowOffsetY ?? 0))
const hasShadow = computed(() => shadowBlur.value > 0 || shadowOffsetX.value !== 0 || shadowOffsetY.value !== 0)
const textAlign = computed(() => props.textAlign ?? props.config?.textAlign ?? 'center')
let frame: number | undefined

function ease(name: string, progress: number): number {
  const t = progress
  const sine = {
    easeInSine: () => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: () => Math.sin(t * Math.PI / 2),
    easeInOutSine: () => -(Math.cos(Math.PI * t) - 1) / 2,
  }[name]
  if (sine)
    return sine()

  const powerMatch = /^ease(In|Out|InOut)(Quad|Cubic|Quart|Quint)$/.exec(name)
  if (powerMatch) {
    const power = { Quad: 2, Cubic: 3, Quart: 4, Quint: 5 }[powerMatch[2]!]!
    if (powerMatch[1] === 'In')
      return t ** power
    if (powerMatch[1] === 'Out')
      return 1 - (1 - t) ** power
    return t < 0.5 ? (2 * t) ** power / 2 : 1 - (-2 * t + 2) ** power / 2
  }

  const c1 = 1.70158
  if (name === 'easeInBack')
    return (c1 + 1) * t ** 3 - c1 * t ** 2
  if (name === 'easeOutBack')
    return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2
  if (name === 'easeInOutBack') {
    const c2 = c1 * 1.525
    return t < 0.5
      ? (2 * t) ** 2 * ((c2 + 1) * 2 * t - c2) / 2
      : ((2 * t - 2) ** 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
  }

  const bounceOut = (value: number): number => {
    const n1 = 7.5625
    const d1 = 2.75
    if (value < 1 / d1)
      return n1 * value * value
    if (value < 2 / d1)
      return n1 * (value -= 1.5 / d1) * value + 0.75
    if (value < 2.5 / d1)
      return n1 * (value -= 2.25 / d1) * value + 0.9375
    return n1 * (value -= 2.625 / d1) * value + 0.984375
  }
  if (name === 'easeInBounce')
    return 1 - bounceOut(1 - t)
  if (name === 'easeOutBounce')
    return bounceOut(t)
  if (name === 'easeInOutBounce')
    return t < 0.5 ? (1 - bounceOut(1 - 2 * t)) / 2 : (1 + bounceOut(2 * t - 1)) / 2

  if (name.includes('Elastic')) {
    if (t === 0 || t === 1)
      return t
    if (name === 'easeInElastic')
      return -(2 ** (10 * t - 10)) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3))
    if (name === 'easeOutElastic')
      return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1
    return t < 0.5
      ? -(2 ** (20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5))) / 2
      : 2 ** (-20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5)) / 2 + 1
  }

  return name === 'linear' ? t : 1 - (1 - t) ** 3
}

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
    const eased = ease(animationCurve.value, progress)
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
  // 现代 props 仅传 value 时也要有 {nt} 占位，否则模板为空看不见数字
  const template = props.content
    ?? (props.prefix !== undefined || props.suffix !== undefined
      ? `${props.prefix ?? ''}{nt}${props.suffix ?? ''}`
      : props.config?.content ?? '{nt}')
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
  '--lumal-digital-flop-height': `${Math.max(
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
    class="lumal-digital-flop"
    :style="rootStyle"
    :aria-label="renderedContent"
  >
    <!-- 与 DataV canvas 一致：铺满容器；绝对定位避免作为内容撑高根节点 -->
    <svg class="lumal-digital-flop__svg" aria-hidden="true">
      <defs v-if="hasShadow">
        <filter :id="shadowFilterId" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            :dx="shadowOffsetX"
            :dy="shadowOffsetY"
            :stdDeviation="shadowBlur / 2"
            :flood-color="shadowColor"
          />
        </filter>
      </defs>
      <text
        class="lumal-digital-flop__value"
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
        :stroke-dasharray="lineDash?.join(',')"
        :stroke-dashoffset="lineDashOffset"
        :stroke-linecap="lineCap"
        :stroke-linejoin="lineJoin"
        :stroke-width="lineWidth"
        :text-anchor="textAnchor"
        :filter="hasShadow ? `url(#${shadowFilterId})` : undefined"
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
