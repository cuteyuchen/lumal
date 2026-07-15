<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { CapsuleChartConfig, DataValueItem } from '../types'
import { computed } from 'vue'

const DEFAULT_COLORS = [
  '#37a2da',
  '#32c5e9',
  '#67e0e3',
  '#9fe6b8',
  '#ffdb5c',
  '#ff9f7f',
  '#fb7293',
] as const

const props = withDefaults(defineProps<{
  items?: readonly DataValueItem[]
  config?: CapsuleChartConfig
  colors?: readonly string[]
  max?: number
  unit?: string
  sort?: false | 'asc' | 'desc'
  showValue?: boolean
  ariaLabel?: string
}>(), {
  ariaLabel: '胶囊图',
  colors: undefined,
  config: () => ({}),
  items: undefined,
  max: undefined,
  showValue: undefined,
  sort: false,
  unit: undefined,
})

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

const colors = computed(() => {
  const overrides = props.colors
    ?? props.config.colors
    ?? (props.items?.some(item => item.color) ? props.items.map(item => item.color) : undefined)
  const merged: string[] = [...DEFAULT_COLORS]
  overrides?.forEach((color, index) => {
    if (color)
      merged[index] = color
  })
  return merged
})
const showValue = computed(() => props.showValue ?? props.config.showValue ?? false)
const unit = computed(() => props.unit ?? props.config.unit ?? '')
const maximum = computed(() => props.max ?? (
  chartItems.value.length ? Math.max(...chartItems.value.map(item => item.value)) : 0
))
const lengths = computed(() => chartItems.value.map(item => maximum.value ? item.value / maximum.value : 0))
const labels = computed(() => {
  const oneFifth = maximum.value / 5
  return Array.from(new Set(new Array(6).fill(0).map((_, index) => Math.ceil(index * oneFifth))))
})

function columnStyle(length: number, index: number): CSSProperties {
  return {
    backgroundColor: colors.value[index % colors.value.length] ?? DEFAULT_COLORS[0],
    width: `${length * 100}%`,
  }
}
</script>

<template>
  <div class="dv-capsule-chart" role="img" :aria-label="ariaLabel">
    <div class="label-column">
      <div v-for="item in chartItems" :key="item.key">
        {{ item.label }}
      </div>
      <div>&#160;</div>
    </div>

    <div class="capsule-container">
      <div v-for="(length, index) in lengths" :key="chartItems[index]?.key ?? index" class="capsule-item">
        <div class="capsule-item-column" :style="columnStyle(length, index)">
          <div v-if="showValue" class="capsule-item-value">
            {{ chartItems[index]?.value }}
          </div>
        </div>
      </div>

      <div class="unit-label">
        <div v-for="(label, index) in labels" :key="`${label}-${index}`">
          {{ label }}
        </div>
      </div>
    </div>

    <div v-if="unit" class="unit-text">
      {{ unit }}
    </div>
  </div>
</template>

<style scoped>
.dv-capsule-chart {
  position: relative;
  box-sizing: border-box;
  display: flex;
  padding: 10px;
  color: #fff;
  flex-direction: row;
}

.label-column {
  box-sizing: border-box;
  display: flex;
  padding-right: 10px;
  flex-direction: column;
  font-size: 12px;
  justify-content: space-between;
  text-align: right;
}

.label-column div {
  height: 20px;
  line-height: 20px;
}

.capsule-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
}

.capsule-item {
  height: 10px;
  margin: 5px 0;
  border-radius: 5px;
  box-shadow: 0 0 3px #999;
}

.capsule-item-column {
  position: relative;
  display: flex;
  height: 8px;
  margin-top: 1px;
  border-radius: 5px;
  align-items: center;
  justify-content: flex-end;
  transition: all 0.3s;
}

.capsule-item-value {
  font-size: 12px;
  transform: translateX(100%);
}

.unit-label {
  position: relative;
  display: flex;
  height: 20px;
  align-items: center;
  font-size: 12px;
  justify-content: space-between;
}

.unit-text {
  display: flex;
  margin-left: 10px;
  align-items: flex-end;
  font-size: 12px;
  line-height: 20px;
  text-align: right;
}

@media (prefers-reduced-motion: reduce) {
  .capsule-item-column {
    transition-duration: 0.01ms;
  }
}
</style>
