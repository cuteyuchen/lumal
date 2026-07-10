<script setup lang="ts">
import type { ResolvedThemeMode } from '@luma/core/theme'
import { LumaIcon } from '@luma/icons'
import { ElButton } from 'element-plus'
import { computed } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  resolvedThemeMode: ResolvedThemeMode
  userName?: string
}>(), {
  userName: '管理员',
})

const emit = defineEmits<{
  logout: []
  openSettings: []
  toggleTheme: []
}>()

/***********************显示状态*********************/
const themeToggleTitle = computed(() => props.resolvedThemeMode === 'dark' ? '切换浅色模式' : '切换深色模式')

/***********************事件处理*********************/
function handleToggleTheme(): void {
  emit('toggleTheme')
}

function handleOpenSettings(): void {
  emit('openSettings')
}

function handleLogout(): void {
  emit('logout')
}
</script>

<template>
  <div class="luma-admin-header-actions">
    <ElButton
      circle
      text
      :title="themeToggleTitle"
      data-action="toggle-theme"
      @click="handleToggleTheme"
    >
      <LumaIcon name="app:theme" :size="16" />
    </ElButton>

    <ElButton
      circle
      text
      title="主题与布局设置"
      data-action="open-settings"
      @click="handleOpenSettings"
    >
      <LumaIcon name="app:settings" :size="16" />
    </ElButton>

    <span class="luma-admin-header-actions__user">{{ userName }}</span>

    <ElButton
      circle
      text
      title="退出登录"
      data-action="logout"
      @click="handleLogout"
    >
      <LumaIcon name="app:logout" :size="16" />
    </ElButton>
  </div>
</template>

<style scoped lang="scss">
.luma-admin-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.luma-admin-header-actions__user {
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
