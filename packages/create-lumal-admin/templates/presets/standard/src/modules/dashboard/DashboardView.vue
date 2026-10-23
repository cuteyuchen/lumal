<script setup lang="ts">
import { LumalPage } from '@lumal/core/components'
import { ElEmpty } from 'element-plus'
import { currentUser } from '../../app/services/session'
import DashboardSessionStatus from './components/DashboardSessionStatus.vue'
import DashboardShortcuts from './components/DashboardShortcuts.vue'

/***********************工作台装配*********************/
const today = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full' }).format(new Date())
</script>

<template>
  <LumalPage class="lumal-admin-page" title="工作台">
    <header class="dashboard-welcome">
      <div><h2>你好，{{ currentUser?.name }}</h2><p>{{ today }}</p></div>
    </header>
    <DashboardShortcuts />
    <DashboardSessionStatus />
    <section class="dashboard-section">
      <h3>业务动态</h3>
      <ElEmpty description="暂无业务动态" :image-size="72" />
    </section>
  </LumalPage>
</template>

<style scoped>
.dashboard-welcome { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 24px; }
.dashboard-welcome h2 { margin: 0 0 8px; font-size: 22px; }
.dashboard-welcome p { margin: 0; color: var(--el-text-color-secondary); }
.dashboard-section { padding-top: 24px; border-top: 1px solid var(--el-border-color-lighter); }
.dashboard-section h3 { margin: 0; font-size: 16px; }
</style>
