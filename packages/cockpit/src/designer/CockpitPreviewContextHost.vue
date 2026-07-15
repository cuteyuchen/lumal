<script setup lang="ts">
import type { CockpitBaseContext } from '../types'
import { provideCockpitContext } from '../composables/useCockpitContext'

/***********************Designer 中心预览上下文*********************/

const props = defineProps<{ context: CockpitBaseContext }>()

provideCockpitContext(props.context)
</script>

<template>
  <slot />
</template>

