<script setup lang="ts">
import { LumalIcon } from '@lumal/icons-vue'
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { adminViewportMode, adminViewportOptions, setAdminViewportMode } from '../../services/workspace-viewport'
// Core 已提供基础和 Popper 样式，Dropdown 的专用样式由应用在首屏按需加载。
import 'element-plus/theme-chalk/el-dropdown.css'

/***********************工作区模式选择与路由覆盖*********************/
const route = useRoute()
const title = computed(() => {
  const label = adminViewportOptions.find(option => option.value === adminViewportMode.value)!.label
  return `工作区适配：${label}${route?.meta.workspaceViewport === 'self-managed' ? '（本页独立布局）' : ''}`
})
</script>

<template>
  <ElDropdown
    placement="bottom-end"
    popper-class="admin-viewport-dropdown"
    trigger="click"
    :teleported="true"
    @command="setAdminViewportMode"
  >
    <button
      class="admin-viewport-trigger"
      type="button"
      :title="title"
      aria-label="工作区适配"
      aria-haspopup="menu"
      :data-mode="adminViewportMode"
    >
      <LumalIcon name="lumal:monitor" :size="18" />
    </button>
    <template #dropdown>
      <ElDropdownMenu aria-label="工作区适配模式">
        <ElDropdownItem
          v-for="option in adminViewportOptions"
          :key="option.value"
          :command="option.value"
          :aria-current="adminViewportMode === option.value ? 'true' : undefined"
        >
          {{ option.label }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped>
.admin-viewport-trigger {
  display: grid;
  width: 44px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: var(--lumal-radius-small);
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.admin-viewport-trigger:hover,
.admin-viewport-trigger[data-mode]:not([data-mode="responsive"]) {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.admin-viewport-trigger:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* 浮层 Teleport 到 body，以专属类隔离选中态，不受工作区缩放影响。 */
:global(.admin-viewport-dropdown .el-dropdown-menu) {
  min-width: 144px;
}

:global(.admin-viewport-dropdown .el-dropdown-menu__item[aria-current="true"]) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-weight: 600;
}

@media (max-width: 768px) {
  .admin-viewport-trigger { width: 36px; height: 36px; }
}
</style>
