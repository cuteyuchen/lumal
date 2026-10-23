<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { safeExternalUrl } from '../menu-policy'

/***********************独立 iframe 来源校验*********************/
const route = useRoute()
const src = computed(() => {
  const value = safeExternalUrl(route.meta.iframeSrc)
  const allowed = String(import.meta.env.VITE_IFRAME_ORIGINS ?? '').split(',').map(item => item.trim())
  if (!allowed.includes(new URL(value).origin))
    throw new Error('iframe 来源未获授权')
  return value
})
</script>

<template>
  <iframe class="app-iframe" :src="src" :title="String(route.meta.title ?? '内嵌页面')" sandbox="allow-scripts allow-forms" referrerpolicy="no-referrer" />
</template>

<style scoped>
.app-iframe { width: 100%; height: calc(100dvh - 160px); border: 0; }
</style>
