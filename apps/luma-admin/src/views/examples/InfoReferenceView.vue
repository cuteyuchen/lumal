<script setup lang="ts">
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import { frameworkInfoItems } from './example-data'

/***********************信息数据*********************/
const apiItems = [
  { label: '字段语义', value: 'label / value / hidden / span' },
  { label: '空值占位', value: 'emptyText' },
  { label: '列数控制', value: 'columns' },
  { label: '标签宽度', value: 'labelWidth' },
]
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Info Reference" description="替代旧信息展示组件的 Luma 信息展示能力。">
      <LumaInfoTable :items="frameworkInfoItems" :columns="2" label-width="96px" />
    </LumaPage>

    <LumaPage title="API 语义" description="使用具有语义的公开字段，不沿用旧框架字段。">
      <LumaInfoTable :items="apiItems" :columns="2" label-width="96px" />
    </LumaPage>
  </main>
</template>
