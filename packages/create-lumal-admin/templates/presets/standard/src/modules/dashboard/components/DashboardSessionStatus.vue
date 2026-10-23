<script setup lang="ts">
import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus';
import { appConfig } from '../../../app.config';
import { permissionStore } from '../../../app/services/session';

/***********************真实应用与会话状态*********************/
const source = appConfig.apiMode === 'local' ? '本地开发演示' : 'HTTP API';
</script>

<template>
  <section class="session-status">
    <h3>应用状态</h3>
    <ElDescriptions :column="1" border>
      <ElDescriptionsItem label="数据源">
        <ElTag :type="appConfig.apiMode === 'local' ? 'warning' : 'success'">
          {{ source }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="当前角色">
        {{ permissionStore.roles.join('、') || '无' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="可用操作权限">
        {{ permissionStore.permissions.length }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="启用模块">
        {{ appConfig.features.join('、') || '无可选模块' }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </section>
</template>

<style scoped>
.session-status {
  padding: 24px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}
.session-status h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
</style>
