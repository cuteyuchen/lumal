<script setup lang="ts">
import { LumaPage } from '@luma/core/components'
import { chartRows } from './example-data'
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Chart" description="轻量示例使用 CSS 条形图展示数据，不把图表库塞进 core。">
      <div class="luma-admin-example__chart">
        <div v-for="row in chartRows" :key="row.label" class="luma-admin-example__chart-row">
          <span class="luma-admin-example__chart-label">{{ row.label }}</span>
          <span class="luma-admin-example__chart-track">
            <span
              class="luma-admin-example__chart-bar"
              :style="{ backgroundColor: row.color, width: `${row.value}%` }"
            />
          </span>
          <strong class="luma-admin-example__chart-value">{{ row.value }}%</strong>
        </div>
      </div>
    </LumaPage>
  </main>
</template>
