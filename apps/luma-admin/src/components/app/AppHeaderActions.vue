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
  openCockpit: []
  openProfile: []
  openSettings: []
  toggleTheme: [event: MouseEvent]
}>()

/***********************显示状态*********************/
const themeToggleTitle = computed(() => props.resolvedThemeMode === 'dark' ? '切换浅色模式' : '切换深色模式')
const userInitial = computed(() => props.userName.trim().slice(0, 1).toUpperCase() || '管')

/***********************事件处理*********************/
function handleToggleTheme(event: MouseEvent): void {
  emit('toggleTheme', event)
}

function handleOpenSettings(): void {
  emit('openSettings')
}

function handleOpenCockpit(): void {
  emit('openCockpit')
}

function handleOpenProfile(): void {
  emit('openProfile')
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
      v-authority="'cockpit:view'"
      circle
      text
      title="驾驶舱"
      aria-label="进入驾驶舱"
      data-action="open-cockpit"
      @click="handleOpenCockpit"
    >
      <LumaIcon name="app:cockpit" :size="16" />
    </ElButton>

    <ElButton
      circle
      text
      title="偏好设置"
      aria-label="偏好设置"
      data-action="open-settings"
      @click="handleOpenSettings"
    >
      <LumaIcon name="app:settings" :size="16" />
    </ElButton>

    <span class="luma-admin-header-actions__divider" aria-hidden="true" />

    <button
      class="luma-admin-header-actions__user"
      type="button"
      title="个人中心"
      aria-label="进入个人中心"
      data-action="open-profile"
      @click="handleOpenProfile"
    >
      <span class="luma-admin-header-actions__avatar" aria-hidden="true">{{ userInitial }}</span>
      <span class="luma-admin-header-actions__name">{{ userName }}</span>
    </button>

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
  width: 44px;
  height: 44px;
  margin: 0;
}

.luma-admin-header-actions__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--luma-radius-small);
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  font-size: calc(var(--luma-font-size-base, 14px) - 1px);
  font-weight: 600;
  white-space: nowrap;
}

.luma-admin-header-actions__user:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.luma-admin-header-actions__user:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.luma-admin-header-actions__avatar {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  font-size: calc(var(--luma-font-size-base, 14px) - 2px);
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

@media (max-width: 420px) {
  .luma-admin-header-actions__user {
    display: none;
  }
}
</style>
