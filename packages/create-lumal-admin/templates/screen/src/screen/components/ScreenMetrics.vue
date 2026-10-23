<script setup lang="ts">
/***********************指标输入*********************/
defineProps<{ metrics: { label: string; value: number }[] }>();
</script>

<template>
  <dl class="screen-metrics">
    <div v-for="metric in metrics" :key="metric.label" class="screen-metrics__item">
      <dt>{{ metric.label }}</dt>
      <dd>{{ metric.value.toLocaleString() }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.screen-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 24px;
  margin: 0;
}

.screen-metrics__item {
  padding: 24px;
  border: 1px solid #d8e0e6;
  border-top: 3px solid #118c74;
  border-radius: 4px;
  background: #fff;
}

.screen-metrics__item dt {
  color: #53616f;
}

.screen-metrics__item dd {
  margin: 12px 0 0;
  font-size: 36px;
  font-weight: 600;
}
</style>
