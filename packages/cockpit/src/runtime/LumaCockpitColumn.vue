<script setup lang="ts">
import type { CockpitColumnConfig } from '../types'
import { computed } from 'vue'
import LumaCockpitContainer from './LumaCockpitContainer.vue'

/***********************列*********************/
// 按容器高度权重在列内归一化分配纵向空间。

const props = defineProps<{
  categoryId: string
  pageId: string
  side: 'left' | 'right'
  column: CockpitColumnConfig
}>()

const totalHeight = computed(() =>
  props.column.containers.reduce((sum, container) => sum + (container.height > 0 ? container.height : 0), 0),
)

function containerFlex(height: number): string {
  const safe = height > 0 ? height : 0
  const total = totalHeight.value
  if (total <= 0)
    return '1 1 0%'
  return `${(safe / total) * 100} 1 0%`
}
</script>

<template>
  <div class="luma-cockpit-column" :data-column-id="column.id">
    <div
      v-for="container in column.containers"
      :key="container.id"
      class="luma-cockpit-column__cell"
      :style="{ flex: containerFlex(container.height) }"
    >
      <LumaCockpitContainer
        :category-id="categoryId"
        :page-id="pageId"
        :side="side"
        :container="container"
      />
    </div>
  </div>
</template>
