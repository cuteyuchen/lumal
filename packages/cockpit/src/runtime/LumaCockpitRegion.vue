<script setup lang="ts">
import type { CockpitRegionConfig, CockpitSide } from '../types'
import { computed } from 'vue'
import LumaCockpitContainer from './LumaCockpitContainer.vue'

/***********************左右网格区域*********************/

const props = defineProps<{
  layoutId: string
  region: CockpitRegionConfig
  side: CockpitSide
}>()

const regionWidth = computed(() => {
  const widths = props.region.columns.reduce((sum, column) => sum + column.width, 0)
  return widths + Math.max(0, props.region.columns.length - 1) * 12
})
const regionStyle = computed(() => ({ width: `calc(${regionWidth.value} * var(--luma-cockpit-x-unit, 1px))` }))
</script>

<template>
  <section
    class="luma-cockpit-region"
    :data-side="side"
    data-cockpit-node="region"
    :data-cockpit-node-id="`${layoutId}:${side}`"
    :data-cockpit-side="side"
    :style="regionStyle"
  >
    <LumaCockpitContainer
      v-for="row in region.rows"
      :key="row.id"
      :layout-id="layoutId"
      :side="side"
      :columns="region.columns"
      :row="row"
    />
  </section>
</template>
