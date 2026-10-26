<script setup lang="ts">
import type { SidebarMenuItem } from '@lumal/core/router';
import { LumalIcon } from '@lumal/icons-vue';
import { ElButton, ElEmpty } from 'element-plus';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { createAdminSidebarMenus } from '../../../app/router';

/***********************当前权限下的快捷入口*********************/
const router = useRouter();
function flatten(items: SidebarMenuItem[]): SidebarMenuItem[] {
  return items.flatMap((item) => (item.children?.length ? flatten(item.children) : [item]));
}
const shortcuts = computed(() =>
  flatten(createAdminSidebarMenus())
    .filter((item) => item.path !== '/dashboard' && !item.externalLink)
    .slice(0, 6),
);
</script>

<template>
  <section class="dashboard-shortcuts">
    <h3>常用入口</h3>
    <div v-if="shortcuts.length" class="shortcut-list">
      <ElButton v-for="item in shortcuts" :key="item.path" @click="router.push(item.path)">
        <LumalIcon :name="item.icon || 'lumal:grid'" />{{ item.title }}
      </ElButton>
    </div>
    <ElEmpty v-else description="暂无可用入口" :image-size="48" />
  </section>
</template>

<style scoped>
.dashboard-shortcuts {
  padding-bottom: 24px;
}
.dashboard-shortcuts h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
.shortcut-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.shortcut-list :deep(.el-button) {
  min-height: 40px;
  margin: 0;
  gap: 8px;
}
</style>
