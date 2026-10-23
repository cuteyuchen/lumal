<script setup lang="ts">
import { ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { currentUser, permissionStore } from '../../app/services/session'

/***********************会话摘要*********************/
const startedAt = new Date().toLocaleDateString()
</script>

<template>
  <main class="lumal-admin-page">
    <h1>工作台</h1>
    <ElDescriptions :column="1" border>
      <ElDescriptionsItem label="当前用户">
        {{ currentUser?.name }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="角色">
        {{ permissionStore.roles.join('、') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="权限数">
        {{ permissionStore.permissions.length }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="日期">
        {{ startedAt }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </main>
</template>
