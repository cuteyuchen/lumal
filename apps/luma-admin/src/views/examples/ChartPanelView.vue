<script setup lang="ts">
import { LumaPage } from '@luma/core/components'
import { chartRows } from './example-data'
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Chart Panel" description="面板化展示图表摘要，供后台工作台类页面复用。">
      <section class="luma-admin-example__chart-panel">
        <article v-for="row in chartRows" :key="row.label" class="luma-admin-example__chart-card">
          <span class="luma-admin-example__chart-card-label">{{ row.label }}</span>
          <strong class="luma-admin-example__chart-card-value">{{ row.value }}%</strong>
          <span class="luma-admin-example__chart-card-line" :style="{ backgroundColor: row.color }" />
        </article>
      </section>
    </LumaPage>
  </main>
</template>
