<script setup lang="ts">
import { LumalPage } from '@lumal/core/components'
import { ElButton } from 'element-plus'
import { useRouter } from 'vue-router'

/***********************路由操作*********************/
const router = useRouter()

function handleBackDashboardClick(): void {
  void router.push('/dashboard')
}
</script>

<template>
  <main class="lumal-admin-page">
    <LumalPage
      title="无权限"
      description="当前账号没有访问该页面所需的权限。"
    >
      <ElButton type="primary" @click="handleBackDashboardClick">
        返回工作台
      </ElButton>
    </LumalPage>
  </main>
</template>
