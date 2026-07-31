<script setup lang="ts">
import type { ResolvedThemeMode } from '@lumal/core/theme'
import { permissionStoreKey } from '@lumal/core/permission'
import { LumalIcon } from '@lumal/icons-vue'
import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
} from 'element-plus'
import { computed, inject } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  cockpitUrl: string
  resolvedThemeMode: ResolvedThemeMode
  userName?: string
}>(), {
  userName: '管理员',
})

const emit = defineEmits<{
  logout: []
  openProfile: []
  openSettings: []
  toggleTheme: [event: MouseEvent]
}>()

/***********************权限判断*********************/
// ElDropdownItem 的根节点不是单一元素，v-authority 这类运行时指令无法挂载，
// 因此移动端菜单项改为读取权限状态后用 v-if 控制渲染。
// 未注入 store 时（如仅验证结构的单测）默认展示，与桌面端指令缺省行为保持一致。
const permissionStore = inject(permissionStoreKey, undefined)
const hasCockpitViewPermission = computed(
  () => permissionStore?.hasPermission('cockpit:view') ?? true,
)

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

function handleOpenProfile(): void {
  emit('openProfile')
}

function handleLogout(): void {
  emit('logout')
}

function handleMobileMenuCommand(command: unknown): void {
  if (command === 'cockpit') {
    window.open(props.cockpitUrl, '_blank', 'noopener,noreferrer')
  }
  else if (command === 'settings') {
    handleOpenSettings()
  }
  else if (command === 'profile') {
    handleOpenProfile()
  }
  else if (command === 'logout') {
    handleLogout()
  }
}
</script>

<template>
  <div class="lumal-admin-header-actions">
    <ElButton
      circle
      text
      :title="themeToggleTitle"
      :aria-label="themeToggleTitle"
      data-action="toggle-theme"
      @click="handleToggleTheme"
    >
      <LumalIcon name="app:theme" :size="16" />
    </ElButton>

    <ElButton
      v-authority="'cockpit:view'"
      class="lumal-admin-header-actions__desktop-only"
      circle
      :href="props.cockpitUrl"
      rel="noopener noreferrer"
      tag="a"
      target="_blank"
      text
      title="驾驶舱"
      aria-label="进入驾驶舱"
      data-action="open-cockpit"
    >
      <LumalIcon name="app:cockpit" :size="16" />
    </ElButton>

    <ElButton
      class="lumal-admin-header-actions__desktop-only"
      circle
      text
      title="偏好设置"
      aria-label="偏好设置"
      data-action="open-settings"
      @click="handleOpenSettings"
    >
      <LumalIcon name="app:settings" :size="16" />
    </ElButton>

    <span class="lumal-admin-header-actions__divider lumal-admin-header-actions__desktop-only" aria-hidden="true" />

    <button
      class="lumal-admin-header-actions__user lumal-admin-header-actions__desktop-only"
      type="button"
      title="个人中心"
      aria-label="进入个人中心"
      data-action="open-profile"
      @click="handleOpenProfile"
    >
      <span class="lumal-admin-header-actions__avatar" aria-hidden="true">{{ userInitial }}</span>
      <span class="lumal-admin-header-actions__name">{{ userName }}</span>
    </button>

    <ElButton
      class="lumal-admin-header-actions__desktop-only"
      circle
      text
      title="退出登录"
      aria-label="退出登录"
      data-action="logout"
      @click="handleLogout"
    >
      <LumalIcon name="app:logout" :size="16" />
    </ElButton>

    <ElDropdown
      class="lumal-admin-header-actions__mobile-menu"
      placement="bottom-end"
      popper-class="lumal-admin-header-actions__mobile-dropdown"
      :teleported="true"
      trigger="click"
      @command="handleMobileMenuCommand"
    >
      <button
        class="lumal-admin-header-actions__mobile-trigger"
        type="button"
        title="账户与更多操作"
        aria-label="账户与更多操作"
        aria-haspopup="menu"
        data-action="open-mobile-account-menu"
      >
        <span class="lumal-admin-header-actions__avatar" aria-hidden="true">{{ userInitial }}</span>
      </button>

      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem
            v-if="hasCockpitViewPermission"
            command="cockpit"
            data-action="open-cockpit-mobile"
          >
            <LumalIcon name="app:cockpit" :size="16" />
            <span>驾驶舱</span>
          </ElDropdownItem>
          <ElDropdownItem command="settings" data-action="open-settings-mobile">
            <LumalIcon name="app:settings" :size="16" />
            <span>偏好设置</span>
          </ElDropdownItem>
          <ElDropdownItem command="profile" data-action="open-profile-mobile">
            <LumalIcon name="app:user" :size="16" />
            <span>个人中心</span>
          </ElDropdownItem>
          <ElDropdownItem
            class="lumal-admin-header-actions__mobile-danger"
            command="logout"
            data-action="logout-mobile"
            divided
          >
            <LumalIcon name="app:logout" :size="16" />
            <span>退出登录</span>
          </ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </div>
</template>

<style scoped lang="scss">
.lumal-admin-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.lumal-admin-header-actions :deep(.el-button) {
  width: 44px;
  height: 44px;
  margin: 0;
}

.lumal-admin-header-actions__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--lumal-radius-small);
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  font-size: calc(var(--lumal-font-size-base, 14px) - 1px);
  font-weight: 600;
  white-space: nowrap;
}

.lumal-admin-header-actions__user:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.lumal-admin-header-actions__user:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.lumal-admin-header-actions__avatar {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  font-size: calc(var(--lumal-font-size-base, 14px) - 2px);
}

.lumal-admin-header-actions__divider {
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: var(--el-border-color-lighter);
}

.lumal-admin-header-actions__mobile-menu {
  display: none;
}

.lumal-admin-header-actions__mobile-trigger {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: var(--lumal-radius-small);
  background: transparent;
  cursor: pointer;
  transition:
    color var(--lumal-motion-duration-fast) var(--lumal-easing-standard),
    background-color var(--lumal-motion-duration-fast) var(--lumal-easing-standard);
}

.lumal-admin-header-actions__mobile-trigger:hover {
  background: var(--el-fill-color-light);
}

.lumal-admin-header-actions__mobile-trigger:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .lumal-admin-header-actions {
    gap: 2px;
  }

  .lumal-admin-header-actions__desktop-only {
    display: none;
  }

  .lumal-admin-header-actions__mobile-menu {
    display: inline-flex;
  }

  .lumal-admin-header-actions :deep(.el-button) {
    width: 36px;
    height: 36px;
  }
}

:global(.lumal-admin-header-actions__mobile-dropdown .lumal-admin-header-actions__mobile-danger) {
  color: var(--el-color-danger);
}

:global(.lumal-admin-header-actions__mobile-dropdown .lumal-admin-header-actions__mobile-danger:hover:not(.is-disabled)) {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
</style>
