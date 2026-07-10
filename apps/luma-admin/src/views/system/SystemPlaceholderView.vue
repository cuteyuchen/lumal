<script setup lang="ts">
import { LumaPage } from '@luma/core/components'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/***********************路由状态*********************/
const route = useRoute()

/***********************页面状态*********************/
const pageTitle = computed(() => String(route.meta.title ?? '系统管理'))
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage
      :title="pageTitle"
      description="系统管理模块已接入菜单与权限模型，CRUD 工作流将在下一阶段补齐。"
    />
  </main>
</template>
