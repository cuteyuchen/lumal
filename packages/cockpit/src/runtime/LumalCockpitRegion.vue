<script setup lang="ts">
import type { CockpitRegionConfig, CockpitSide } from '../types'
import { viewportLength } from '@lumal/viewport'
import { computed } from 'vue'
import LumalCockpitContainer from './LumalCockpitContainer.vue'

/***********************左右网格区域*********************/

const props = defineProps<{
  layoutId: string
  region: CockpitRegionConfig
  side: CockpitSide
}>()

const regionWidth = computed(() => {
  if (props.region.width > 0)
    return props.region.width
  return props.region.columns.reduce((sum, column) => sum + column.width, 0)
})
const regionStyle = computed(() => ({
  width: `calc(${viewportLength(regionWidth.value)} + ${Math.max(0, props.region.columns.length - 1)} * var(--lumal-cockpit-gap-x, ${viewportLength(12)}))`,
}))
</script>

<template>
  <section
    class="lumal-cockpit-region"
    :data-side="side"
    data-cockpit-node="region"
    :data-cockpit-node-id="`${layoutId}:${side}`"
    :data-cockpit-side="side"
    :style="regionStyle"
  >
    <LumalCockpitContainer
      v-for="row in region.rows"
      :key="row.id"
      :layout-id="layoutId"
      :side="side"
      :columns="region.columns"
      :row="row"
    />
  </section>
</template>
