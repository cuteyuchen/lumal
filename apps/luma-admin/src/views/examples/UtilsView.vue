<script setup lang="ts">
import { LumaInfoTable, LumaPage } from '@luma/core/components'

/***********************工具函数*********************/
function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value)
}

const utilityItems = [
  { label: '日期格式化', value: formatDate(new Date('2026-07-09T00:00:00+08:00')) },
  { label: '数字格式化', value: formatNumber(123456) },
  { label: '设计原则', value: '纯工具函数不伪装成 composable' },
]
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Utils" description="示例使用浏览器标准 API，避免在 core 中堆小型项目不需要的工具集合。">
      <LumaInfoTable :items="utilityItems" :columns="3" label-width="88px" />
    </LumaPage>
  </main>
</template>
