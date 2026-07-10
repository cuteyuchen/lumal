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
const userInitial = computed(() => props.userName.trim().slice(0, 1).toUpperCase() || '管')

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
      :aria-label="themeToggleTitle"
      data-action="toggle-theme"
      @click="handleToggleTheme"
    >
      <LumaIcon name="app:theme" :size="16" />
    </ElButton>

    <ElButton
      circle
      text
      title="主题与布局设置"
      aria-label="主题与布局设置"
      data-action="open-settings"
      @click="handleOpenSettings"
    >
      <LumaIcon name="app:settings" :size="16" />
    </ElButton>

    <span class="luma-admin-header-actions__divider" aria-hidden="true" />

    <span class="luma-admin-header-actions__user">
      <span class="luma-admin-header-actions__avatar" aria-hidden="true">{{ userInitial }}</span>
      <span class="luma-admin-header-actions__name">{{ userName }}</span>
    </span>

    <ElButton
      circle
      text
      title="退出登录"
      aria-label="退出登录"
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
  gap: 4px;
}

.luma-admin-header-actions :deep(.el-button) {
  width: 40px;
  height: 40px;
  margin: 0;
}

.luma-admin-header-actions__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 8px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.luma-admin-header-actions__avatar {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  font-size: 12px;
}

.luma-admin-header-actions__divider {
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: var(--el-border-color-lighter);
}

@media (max-width: 640px) {
  .luma-admin-header-actions__name,
  .luma-admin-header-actions__divider {
    display: none;
  }

  .luma-admin-header-actions__user {
    padding: 0 2px;
  }
}
</style>
