<script setup lang="ts">
import type { CockpitRegionConfig } from '../types'
import { computed } from 'vue'
import LumaCockpitColumn from './LumaCockpitColumn.vue'

/***********************左右区域*********************/
// 按列宽权重在区域内归一化分配横向空间。

const props = defineProps<{
  categoryId: string
  pageId: string
  region: CockpitRegionConfig
  side: 'left' | 'right'
}>()

const totalWidth = computed(() =>
  props.region.columns.reduce((sum, column) => sum + (column.width > 0 ? column.width : 0), 0),
)

const regionStyle = computed(() => ({
  width: `${props.region.width ?? 0}px`,
  flex: `0 0 ${props.region.width ?? 0}px`,
}))

function columnFlex(width: number): string {
  const safe = width > 0 ? width : 0
  const total = totalWidth.value
  if (total <= 0)
    return '1 1 0%'
  return `${(safe / total) * 100} 1 0%`
}
</script>

<template>
  <div
    class="luma-cockpit-region"
    :data-side="side"
    data-cockpit-node="region"
    :data-cockpit-node-id="`${categoryId}:${pageId}:${side}`"
    :data-cockpit-side="side"
    :style="regionStyle"
  >
    <div
      v-for="column in region.columns"
      :key="column.id"
      class="luma-cockpit-region__column"
      data-cockpit-node="column"
      :data-cockpit-node-id="column.id"
      :data-cockpit-side="side"
      :style="{ flex: columnFlex(column.width) }"
    >
      <LumaCockpitColumn
        :category-id="categoryId"
        :page-id="pageId"
        :side="side"
        :column="column"
      />
    </div>
  </div>
</template>
