<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { FlylineChartConfig, FlylineChartPoint, FlylineImageStyle, FlylineTextStyle } from '../types'
import { useViewportWidth } from '@lumal/viewport'
import { computed, nextTick, shallowRef, useId, useTemplateRef, watch } from 'vue'
import { useElementSize } from '../composables/useElementSize'
import { useSvgAnimationPause } from '../composables/useSvgAnimationPause'
import { createFlylinePath, randomDuration, resolveCoordinate, svgId } from '../flyline-utils'

const props = withDefaults(defineProps<{
  config?: Partial<FlylineChartConfig>
  dev?: boolean
  ariaLabel?: string
}>(), {
  ariaLabel: '飞线图',
  config: () => ({}),
  dev: false,
})

const emit = defineEmits<{
  position: [absolute: readonly [number, number], relative: readonly [number, number]]
}>()

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const svgRef = useTemplateRef<SVGSVGElement>('svgRef')
const size = useElementSize(rootRef)
// 相对/绝对点坐标沿用原协议，仅字号、图标与光晕等设计尺寸使用 vw 比例。
const { pixels } = useViewportWidth()
const animation = useSvgAnimationPause(rootRef, svgRef)
const id = svgId('lumal-flyline', useId())

const defaultText: Required<FlylineTextStyle> = { color: '#ffdb5c', fontSize: 12, offset: [0, 15], show: true }
const defaultImage: Required<FlylineImageStyle> = { height: 15, url: '', width: 15 }

const resolvedConfig = computed(() => ({
  backgroundImage: props.config.bgImgUrl ?? props.config.backgroundImage ?? '',
  center: props.config.centerPoint ?? props.config.center ?? [0, 0] as const,
  centerImage: {
    ...defaultImage,
    height: 40,
    width: 40,
    ...props.config.centerImage,
    ...props.config.centerPointImg,
  },
  curvature: props.config.curvature ?? 5,
  duration: props.config.duration ?? [20, 30] as const,
  flylineColor: props.config.flylineColor ?? '#ffde93',
  flylineRadius: props.config.flylineRadius ?? 100,
  halo: {
    color: '#fb7293',
    duration: 30,
    radius: 120,
    show: true,
    ...props.config.halo,
  },
  k: props.config.k ?? -0.5,
  lineWidth: props.config.lineWidth ?? 1,
  orbitColor: props.config.orbitColor ?? 'rgba(103, 224, 227, .2)',
  pointImage: { ...defaultImage, ...props.config.pointImage, ...props.config.pointsImg },
  points: props.config.points ?? [],
  relative: props.config.relative ?? true,
  text: { ...defaultText, ...props.config.text },
}))

function durationSeconds(duration: number | readonly [number, number]): number {
  return typeof duration === 'number' ? duration / 10 : randomDuration(duration)
}

const haloDuration = computed(() => durationSeconds(resolvedConfig.value.halo.duration))
const pathLengths = shallowRef<Record<string, number>>({})

const paths = computed(() => {
  const config = resolvedConfig.value
  const center = resolveCoordinate(config.center, config.relative, size.value.width, size.value.height)
  return config.points.map((rawPoint, index) => {
    const point: FlylineChartPoint = Array.isArray(rawPoint)
      ? { position: rawPoint as unknown as readonly [number, number], text: '' }
      : rawPoint as FlylineChartPoint
    const start = resolveCoordinate(point.position, config.relative, size.value.width, size.value.height)
    const key = `${index}-${start.join('-')}-${center.join('-')}`
    return {
      ...createFlylinePath(start, center, config.curvature, config.k),
      key,
      text: point.text ?? '',
      time: randomDuration(config.duration),
    }
  })
})

async function syncPathLengths(): Promise<void> {
  await nextTick()
  const elements = svgRef.value?.querySelectorAll<SVGPathElement>('path[data-flyline-path]')
  const lengths: Record<string, number> = {}
  paths.value.forEach((path, index) => {
    lengths[path.key] = elements?.[index]?.getTotalLength?.() ?? 0
  })
  pathLengths.value = lengths
}

watch([paths, svgRef], () => void syncPathLengths(), { flush: 'post', immediate: true })

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
    class="lumal-flyline-chart"
    role="img"
    :aria-label="ariaLabel"
    :class="{ 'is-animation-paused': animation.paused.value }"
    :style="rootStyle"
    @click="handleClick"
  >
    <svg v-if="size.width && size.height" ref="svgRef" :viewBox="`0 0 ${size.width} ${size.height}`" aria-hidden="true">
      <defs>
        <radialGradient :id="`${id}-flyline-gradient`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff" stop-opacity="1" />
          <stop offset="100%" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="`${id}-halo-gradient`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0" />
          <stop offset="100%" stop-color="#fff" stop-opacity="1" />
        </radialGradient>
        <template v-for="path in paths" :key="`definition-${path.key}`">
          <path :id="`${id}-path-${path.key}`" :d="path.d" data-flyline-path fill="transparent" />
          <mask :id="`${id}-mask-${path.key}`">
            <circle cx="0" cy="0" :r="pixels(resolvedConfig.flylineRadius)" :fill="`url(#${id}-flyline-gradient)`">
              <animateMotion :dur="path.time" :path="path.d" rotate="auto" repeatCount="indefinite" />
            </circle>
          </mask>
        </template>
        <circle v-if="paths[0]" :id="`${id}-halo`" :cx="paths[0].end[0]" :cy="paths[0].end[1]">
          <animate attributeName="r" :values="`1;${pixels(resolvedConfig.halo.radius)}`" :dur="`${haloDuration}s`" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0" :dur="`${haloDuration}s`" repeatCount="indefinite" />
        </circle>
        <mask :id="`${id}-halo-mask`">
          <use :href="`#${id}-halo`" :fill="`url(#${id}-halo-gradient)`" />
        </mask>
      </defs>

      <use
        v-if="paths[0] && resolvedConfig.halo.show"
        :href="`#${id}-halo`"
        :fill="resolvedConfig.halo.color"
        :mask="`url(#${id}-halo-mask)`"
      />
      <image
        v-if="paths[0] && resolvedConfig.centerImage.url"
        :href="resolvedConfig.centerImage.url"
        :width="pixels(resolvedConfig.centerImage.width)"
        :height="pixels(resolvedConfig.centerImage.height)"
        :x="paths[0].end[0] - pixels(resolvedConfig.centerImage.width) / 2"
        :y="paths[0].end[1] - pixels(resolvedConfig.centerImage.height) / 2"
      />

      <g v-for="path in paths" :key="path.key">
        <use
          v-if="pathLengths[path.key]"
          :href="`#${id}-path-${path.key}`"
          :stroke-width="pixels(resolvedConfig.lineWidth)"
          :stroke="resolvedConfig.orbitColor"
          fill="none"
        />
        <use
          :href="`#${id}-path-${path.key}`"
          :stroke-width="pixels(resolvedConfig.lineWidth)"
          :stroke="resolvedConfig.flylineColor"
          :mask="`url(#${id}-mask-${path.key})`"
          fill="none"
        >
          <animate
            attributeName="stroke-dasharray"
            :from="`0, ${pathLengths[path.key]}`"
            :to="`${pathLengths[path.key]}, 0`"
            :dur="path.time"
            repeatCount="indefinite"
          />
        </use>
        <image
          v-if="resolvedConfig.pointImage.url"
          :href="resolvedConfig.pointImage.url"
          :width="pixels(resolvedConfig.pointImage.width)"
          :height="pixels(resolvedConfig.pointImage.height)"
          :x="path.start[0] - pixels(resolvedConfig.pointImage.width) / 2"
          :y="path.start[1] - pixels(resolvedConfig.pointImage.height) / 2"
        />
        <text
          v-if="resolvedConfig.text.show && path.text"
          :x="path.start[0] + pixels(resolvedConfig.text.offset[0])"
          :y="path.start[1] + pixels(resolvedConfig.text.offset[1])"
          :fill="resolvedConfig.text.color"
          :font-size="pixels(resolvedConfig.text.fontSize)"
        >{{ path.text }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* 根节点尺寸由父级给出；SVG 绝对定位铺满，避免进文档流后与 ResizeObserver 互相撑高 */
.lumal-flyline-chart {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background-size: 100% 100%;
}
.lumal-flyline-chart svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
.lumal-flyline-chart text {
  text-anchor: middle;
  dominant-baseline: middle;
}
</style>
