<script setup lang="ts">
import type { ScreenMetric } from '../services/metrics-types';
import { onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { loadMetrics } from '../services/metrics';
import ScreenMetrics from './components/ScreenMetrics.vue';
// SCREEN_VISUALIZATION_IMPORT

/***********************指标加载*********************/
const metrics = shallowRef<ScreenMetric[]>([]);
const loading = shallowRef(false);
const error = shallowRef('');
let controller: AbortController | undefined;

async function reload() {
  controller?.abort();
  const current = new AbortController();
  controller = current;
  loading.value = true;
  error.value = '';
  try {
    const result = await loadMetrics(current.signal);
    if (!current.signal.aborted) metrics.value = result;
  } catch (cause) {
    if (!current.signal.aborted) error.value = cause instanceof Error ? cause.message : '数据加载失败';
  } finally {
    if (!current.signal.aborted) loading.value = false;
  }
}

onMounted(() => void reload());
onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <main class="screen-view" :aria-busy="loading">
    <header class="screen-view__header">
      <h1>数据总览</h1>
      <button type="button" :disabled="loading" @click="reload">刷新数据</button>
    </header>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-else-if="loading" role="status">加载中</p>
    <ScreenMetrics :metrics="metrics" />
    <!-- SCREEN_VISUALIZATION -->
  </main>
</template>

<style scoped>
.screen-view {
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 32px;
  font-size: max(14px, var(--lumal-viewport-min-font-size, 14px));
}
.screen-view__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
}
.screen-view__header h1 {
  margin: 0;
  font-size: max(28px, var(--lumal-viewport-min-font-size, 14px));
}
</style>
