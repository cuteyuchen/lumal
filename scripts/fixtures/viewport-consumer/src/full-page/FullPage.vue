<script setup lang="ts">
/***********************动态引擎尺寸保持显式责任*********************/
const chart = { height: '192px', grid: { top: 24 } }
</script>

<template>
  <section class="consumer-full-page">
    <header style="height: 50px; font-size: 14px; line-height: 20px">
      Header
    </header>
    <aside :style="{ width: '280px', minWidth: '240px' }" />
    <div class="w-[192px]" :aria-label="chart.height" />
  </section>
</template>

<style scoped lang="scss">
$size: 280px;
.consumer-full-page {
  --gap: 24px;
  font-size: calc(var(--text, 14px) + 2px);
  line-height: 20px;
  min-height: 40px;
  grid-template-columns: minmax($size, 1fr) 2fr;
  border: 1px solid var(--border);
}
@media (max-width: 768px) {
  .consumer-full-page {
    display: block;
  }
}
@media (width <= 768px) {
  .consumer-range {
    display: grid;
  }
}
@container settings (width <= 320px) {
  .consumer-container {
    display: flex;
  }
}
.w-\[192px\] {
  width: 192px;
}
</style>
