<script setup lang="ts">
import { computed } from 'vue'
import { metricSummaries } from '../../data/demo-scene'

/***********************指标摘要模块*********************/

const loading = false
const error = ''
const items = computed(() => metricSummaries)
</script>

<template>
  <div class="metric-summary">
    <div v-if="loading" class="metric-summary__state" role="status">
      加载中
    </div>
    <div v-else-if="error" class="metric-summary__state" role="alert">
      {{ error }}
    </div>
    <div v-else-if="items.length === 0" class="metric-summary__state" role="status">
      暂无数据
    </div>
    <dl v-else class="metric-summary__grid">
      <div v-for="item in items" :key="item.label" class="metric-summary__item">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
        <span>{{ item.trend }}</span>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.metric-summary {
  height: 100%;
}

.metric-summary__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  height: 100%;
  margin: 0;
}

.metric-summary__item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  min-height: 86px;
  padding: 12px;
  border: 1px solid var(--luma-cockpit-border);
  border-radius: var(--luma-cockpit-radius);
  background: var(--luma-cockpit-floating-bg);
}

.metric-summary__item dt {
  color: var(--luma-cockpit-text-secondary);
  font-size: 13px;
}

.metric-summary__item dd {
  margin: 5px 0 0;
  color: var(--luma-cockpit-title-text);
  font-size: 24px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.metric-summary__item span {
  margin-top: 6px;
  color: var(--luma-cockpit-accent);
  font-size: 12px;
}

.metric-summary__state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--luma-cockpit-text-secondary);
}
</style>
