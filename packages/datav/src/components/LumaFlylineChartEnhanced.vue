<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { FlylineEnhancedConfig, FlylineHaloStyle, FlylineIconStyle, FlylineLineStyle, FlylineTextStyle } from '../types'
import { computed, useId, useTemplateRef } from 'vue'
import { useElementSize } from '../composables/useElementSize'
import { useSvgAnimationPause } from '../composables/useSvgAnimationPause'
import { createFlylinePath, randomDuration, resolveCoordinate, svgId } from '../flyline-utils'

const props = withDefaults(defineProps<{
  config?: Partial<FlylineEnhancedConfig>
  dev?: boolean
  ariaLabel?: string
}>(), {
  ariaLabel: '增强飞线图',
  config: () => ({}),
  dev: false,
})

const emit = defineEmits<{
  position: [absolute: readonly [number, number], relative: readonly [number, number]]
}>()

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const svgRef = useTemplateRef<SVGSVGElement>('svgRef')
const size = useElementSize(rootRef)
const animation = useSvgAnimationPause(rootRef, svgRef)
const id = svgId('luma-flyline-enhanced', useId())

const defaultHalo: Required<FlylineHaloStyle> = { color: '#fb7293', duration: [20, 30], radius: 120, show: false }
const defaultText: Required<FlylineTextStyle> = { color: '#ffdb5c', fontSize: 12, offset: [0, 15], show: false }
const defaultIcon: Required<FlylineIconStyle> = { height: 15, show: false, src: '', width: 15 }
const defaultLine: Required<FlylineLineStyle> = { color: '#ffde93', duration: [20, 30], orbitColor: 'rgba(103, 224, 227, .2)', radius: 100, width: 1 }

const resolvedConfig = computed(() => ({
  backgroundImage: props.config.bgImgSrc ?? props.config.backgroundImage ?? '',
  curvature: props.config.curvature ?? 5,
  halo: { ...defaultHalo, ...props.config.halo },
  icon: { ...defaultIcon, ...props.config.icon },
  k: props.config.k ?? -0.5,
  line: { ...defaultLine, ...props.config.line },
  lines: props.config.lines ?? [],
  points: props.config.points ?? [],
  relative: props.config.relative ?? true,
  text: { ...defaultText, ...props.config.text },
}))

const points = computed(() => {
  const config = resolvedConfig.value
  return config.points.map((point, index) => {
    const coordinate = resolveCoordinate(point.coordinate, config.relative, size.value.width, size.value.height)
    const halo = { ...config.halo, ...point.halo }
    const icon = { ...config.icon, ...point.icon }
    const text = { ...config.text, ...point.text }
    return {
      ...point,
      coordinate,
      halo,
      haloTime: randomDuration(halo.duration),
      icon,
      key: `${svgId('point', point.name)}-${index}`,
      text,
    }
  })
})

const lines = computed(() => {
  const config = resolvedConfig.value
  return config.lines.flatMap((line, index) => {
    const source = points.value.find(point => point.name === line.source)
    const target = points.value.find(point => point.name === line.target)
    if (!source || !target)
      return []
    const style = { ...config.line, ...line }
    const key = `${svgId('line', line.source)}-${svgId('to', line.target)}-${index}`
    const rawPath = createFlylinePath(source.coordinate, target.coordinate, config.curvature, config.k)
    const start = rawPath.start.map(value => Number(value.toFixed(10))) as unknown as readonly [number, number]
    const control = rawPath.control.map(value => Number(value.toFixed(10))) as unknown as readonly [number, number]
    const end = rawPath.end.map(value => Number(value.toFixed(10))) as unknown as readonly [number, number]
    return [{
      ...style,
      control,
      d: `M${start.join(',')} Q${control.join(',')} ${end.join(',')}`,
      end,
      key,
      start,
      time: randomDuration(style.duration),
    }]
  })
})

const rootStyle = computed<CSSProperties>(() => ({
  backgroundImage: resolvedConfig.value.backgroundImage ? `url("${resolvedConfig.value.backgroundImage}")` : undefined,
}))

function handleClick(event: MouseEvent): void {
  if (!props.dev)
    return
  const rect = rootRef.value?.getBoundingClientRect()
  if (!rect)
    return
  const absolute = [event.clientX - rect.left, event.clientY - rect.top] as const
  const relative = [absolute[0] / Math.max(1, rect.width), absolute[1] / Math.max(1, rect.height)] as const
  emit('position', absolute, relative)
}
</script>

<template>
  <div
    ref="rootRef"
    class="luma-flyline-chart-enhanced"
    role="img"
    :aria-label="ariaLabel"
    :class="{ 'is-animation-paused': animation.paused }"
    :style="rootStyle"
    @click="handleClick"
    @mouseenter="animation.onMouseEnter"
    @mouseleave="animation.onMouseLeave"
    @focusin="animation.onFocusIn"
    @focusout="animation.onFocusOut"
  >
    <svg v-if="size.width && size.height && lines.length" ref="svgRef" :viewBox="`0 0 ${size.width} ${size.height}`" aria-hidden="true">
      <defs>
        <radialGradient :id="`${id}-flyline-gradient`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff" stop-opacity="1" />
          <stop offset="100%" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="`${id}-halo-gradient`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0" />
          <stop offset="100%" stop-color="#fff" stop-opacity="1" />
        </radialGradient>
        <template v-for="point in points" :key="`point-definition-${point.key}`">
          <circle :id="`${id}-halo-${point.key}`" :cx="point.coordinate[0]" :cy="point.coordinate[1]">
            <animate attributeName="r" :values="`1;${point.halo.radius}`" :dur="`${point.haloTime}s`" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0" :dur="`${point.haloTime}s`" repeatCount="indefinite" />
          </circle>
          <mask :id="`${id}-halo-mask-${point.key}`">
            <use :href="`#${id}-halo-${point.key}`" :fill="`url(#${id}-halo-gradient)`" />
          </mask>
        </template>
        <template v-for="line in lines" :key="`line-definition-${line.key}`">
          <path :id="`${id}-path-${line.key}`" :d="line.d" pathLength="1" fill="transparent" />
          <mask :id="`${id}-line-mask-${line.key}`">
            <circle cx="0" cy="0" :r="line.radius" :fill="`url(#${id}-flyline-gradient)`">
              <animateMotion :dur="line.time" :path="line.d" rotate="auto" repeatCount="indefinite" />
            </circle>
          </mask>
        </template>
      </defs>

      <g v-for="point in points" :key="point.key">
        <use
          v-if="point.halo.show"
          :href="`#${id}-halo-${point.key}`"
          :fill="point.halo.color"
          :mask="`url(#${id}-halo-mask-${point.key})`"
        />
        <image
          v-if="point.icon.show && point.icon.src"
          :href="point.icon.src"
          :width="point.icon.width"
          :height="point.icon.height"
          :x="point.coordinate[0] - point.icon.width / 2"
          :y="point.coordinate[1] - point.icon.height / 2"
        />
        <text
          v-if="point.text.show"
          :x="point.coordinate[0] + point.text.offset[0]"
          :y="point.coordinate[1] + point.text.offset[1]"
          :fill="point.text.color"
          :font-size="point.text.fontSize"
        >{{ point.name }}</text>
      </g>

      <g v-for="line in lines" :key="line.key">
        <use :href="`#${id}-path-${line.key}`" :stroke-width="line.width" :stroke="line.orbitColor" fill="none" />
        <use
          :href="`#${id}-path-${line.key}`"
          :stroke-width="line.width"
          :stroke="line.color"
          :mask="`url(#${id}-line-mask-${line.key})`"
          fill="none"
        >
          <animate attributeName="stroke-dasharray" from="0, 1" to="1, 0" :dur="line.time" repeatCount="indefinite" />
        </use>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.luma-flyline-chart-enhanced { display: flex; width: 100%; height: 100%; min-width: 0; min-height: 0; flex-direction: column; background-size: 100% 100%; }
.luma-flyline-chart-enhanced svg { display: block; width: 100%; height: 100%; }
.luma-flyline-chart-enhanced text { text-anchor: middle; dominant-baseline: middle; }
</style>
