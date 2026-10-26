<script setup lang="ts">
import { ref } from 'vue'

/***********************应用自己的 Widget，无地图或图表引擎依赖*********************/
const confirmed = ref(0)
</script>

<template>
  <section class="metric-widget">
    <strong>98.6%</strong>
    <span>运行健康度</span>
    <button type="button" @click="confirmed++">
      确认告警 · {{ confirmed }}
    </button>
  </section>
</template>

<style scoped>
.metric-widget { display: grid; gap: 20px; padding: 20px; color: var(--lumal-cockpit-text-primary); }
strong { color: #64d6b0; font-size: calc(var(--lumal-font-size-base, 14px) + 18px); }
button { padding: 8px; border: 1px solid #64d6b0; border-radius: 4px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
</style>
