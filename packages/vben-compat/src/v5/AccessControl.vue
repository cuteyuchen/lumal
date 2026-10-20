<script setup lang="ts">
import { computed } from 'vue'
import { useAccess } from './access'

/***********************Vben 角色与权限组件*********************/
const props = withDefaults(defineProps<{ codes?: string[], type?: 'code' | 'role' }>(), { codes: () => [], type: 'role' })
const access = useAccess()
const allowed = computed(() => props.type === 'code' ? access.hasAccessByCodes(props.codes) : access.hasAccessByRoles(props.codes))
</script>

<template>
  <slot v-if="allowed" />
</template>
