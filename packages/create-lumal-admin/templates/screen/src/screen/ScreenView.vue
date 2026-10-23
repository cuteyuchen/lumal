<script setup lang="ts">
import ScreenMetrics from './components/ScreenMetrics.vue';

/***********************静态演示数据*********************/
const metrics = [
  { label: '任务总数', value: 128 },
  { label: '已完成', value: 96 },
  { label: '进行中', value: 32 },
];
</script>

<template>
  <main class="screen-view">
    <header class="screen-view__header">
      <h1>数据总览</h1>
      <span>静态示例</span>
    </header>
    <ScreenMetrics :metrics="metrics" />
  </main>
</template>

<style scoped>
.screen-view {
  min-height: 100dvh;
  padding: 32px;
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
  font-size: 28px;
}
</style>
