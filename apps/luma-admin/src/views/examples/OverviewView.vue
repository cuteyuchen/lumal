<script setup lang="ts">
import { LumaInfoTable, LumaPage, LumaSchemaTable } from '@luma/core/components'
import { exampleTableColumns, exampleTableRows, frameworkInfoItems } from './example-data'

/***********************指标数据*********************/
const metrics = [
  { label: '公开包', value: '4' },
  { label: '示例页', value: '12' },
  { label: '字典响应', value: 'items' },
]
</script>

<template>
  <main class="luma-admin-example">
    <section class="luma-admin-example__metrics">
      <article v-for="metric in metrics" :key="metric.label" class="luma-admin-example__metric">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </section>

    <LumaPage title="框架信息" description="通过真实 admin 路由验证 Luma 包能力。">
      <LumaInfoTable :items="frameworkInfoItems" :columns="2" label-width="96px" />
    </LumaPage>

    <LumaPage title="字典回显" description="状态与优先级由内置字典能力翻译。">
      <LumaSchemaTable :columns="exampleTableColumns" :rows="exampleTableRows" row-key="id" />
    </LumaPage>
  </main>
</template>
