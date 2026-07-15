<script setup lang="ts">
import type { ConicalColumnChartConfig, DataValueItem } from '../types'
import { computed, useTemplateRef } from 'vue'
import { useElementSize } from '../composables/useElementSize'

const props = withDefaults(defineProps<{
  items?: readonly DataValueItem[]
  config?: ConicalColumnChartConfig
  max?: number
  unit?: string
  sort?: false | 'asc' | 'desc'
  showValue?: boolean
  images?: readonly string[]
  imageSideLength?: number
  fontSize?: number
  columnColor?: string
  textColor?: string
  ariaLabel?: string
}>(), {
  ariaLabel: '锥形柱图',
  columnColor: undefined,
  config: () => ({}),
  fontSize: undefined,
  imageSideLength: undefined,
  images: undefined,
  items: undefined,
  max: undefined,
  showValue: undefined,
  sort: 'desc',
  textColor: undefined,
  unit: '',
})

interface ConicalColumn extends DataValueItem {
  d: string
  fill: string
  percent: number
  textY: number
  x: number
  y: number
}

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const size = useElementSize(rootRef)

const sourceItems = computed<DataValueItem[]>(() => {
  if (props.items !== undefined)
    return props.items.map(item => ({ ...item }))
  return (props.config.data ?? []).map((item, index) => ({
    key: item.name || index,
    label: item.name,
    value: item.value,
  }))
})

const chartItems = computed(() => {
  if (!props.sort)
    return sourceItems.value
  return [...sourceItems.value].sort((a, b) => props.sort === 'asc' ? a.value - b.value : b.value - a.value)
})

const images = computed(() => props.images ?? props.config.img ?? [])
const imageSideLength = computed(() => props.imageSideLength ?? props.config.imgSideLength ?? 30)
const fontSize = computed(() => props.fontSize ?? props.config.fontSize ?? 12)
const columnColor = computed(() => props.columnColor ?? props.config.columnColor ?? 'rgba(0, 194, 255, 0.4)')
const textColor = computed(() => props.textColor ?? props.config.textColor ?? '#fff')
const showValue = computed(() => props.showValue ?? props.config.showValue ?? false)

const columns = computed<ConicalColumn[]>(() => {
  const data = chartItems.value
  const maximum = props.max ?? (data.length ? Math.max(...data.map(item => item.value)) : 10)
  const gap = size.value.width / (data.length + 1)
  const usableHeight = size.value.height - imageSideLength.value - fontSize.value - 5
  const svgBottom = size.value.height - fontSize.value - 5

  return data.map((item, index) => {
    const percent = item.value / maximum
    const middleX = gap * (index + 1)
    const leftX = gap * index
    const rightX = gap * (index + 2)
    const middleY = svgBottom - usableHeight * percent
    const controlY = usableHeight * percent * 0.6 + middleY
    const d = [
      `M${leftX}, ${svgBottom}`,
      `Q${middleX}, ${controlY} ${middleX},${middleY}`,
      `M${middleX},${middleY}`,
      `Q${middleX}, ${controlY} ${rightX},${svgBottom}`,
      `L${leftX}, ${svgBottom}`,
      'Z',
    ].join(' ')

    return {
      ...item,
      d,
      fill: props.items !== undefined ? item.color ?? columnColor.value : columnColor.value,
      percent,
      textY: (svgBottom + middleY) / 2 + fontSize.value / 2,
      x: middleX,
      y: middleY,
    }
  })
})
</script>

<template>
  <div ref="rootRef" class="dv-conical-column-chart" role="img" :aria-label="ariaLabel">
    <svg :width="size.width" :height="size.height" aria-hidden="true">
      <g v-for="(item, index) in columns" :key="item.key">
        <path :d="item.d" :fill="item.fill" />
        <text
          :style="{ fontSize: `${fontSize}px` }"
          :fill="textColor"
          :x="item.x"
          :y="size.height - 4"
        >
          {{ item.label }}
        </text>
        <image
          v-if="images.length"
          :xlink:href="images[index % images.length]"
          :width="imageSideLength"
          :height="imageSideLength"
          :x="item.x - imageSideLength / 2"
          :y="item.y - imageSideLength"
        />
        <text
          v-if="showValue"
          :style="{ fontSize: `${fontSize}px` }"
          :fill="textColor"
          :x="item.x"
          :y="item.textY"
        >
          {{ item.value }}{{ unit }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.dv-conical-column-chart {
  width: 100%;
  height: 100%;
}

svg {
  display: block;
}

text {
  text-anchor: middle;
}
</style>
