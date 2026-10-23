<script setup lang="ts">
import { LumalViewport } from '@lumal/viewport'
import { ElInput, ElTable, ElTableColumn } from 'element-plus'
import { shallowRef } from 'vue'

/***********************普通后台不跟随大屏缩放*********************/
const query = shallowRef('')
const rows = [{ name: '普通后台页面', status: '启用' }]
</script>

<template>
  <LumalViewport :policy="false">
    <section class="system-page" data-testid="system">
      <h1>系统管理</h1>
      <ElInput v-model="query" aria-label="查询名称" />
      <ElTable :data="rows">
        <ElTableColumn prop="name" label="名称" min-width="180" /><ElTableColumn prop="status" label="状态" width="100" />
      </ElTable>
    </section>
  </LumalViewport>
</template>

<style scoped>
.system-page { padding: 20px; font-size: 14px; }
.system-page h1 { font-size: 20px; }
</style>
