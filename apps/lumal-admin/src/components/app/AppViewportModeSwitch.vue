<script setup lang="ts">
import { LumalIcon } from '@lumal/icons-vue'
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { computed } from 'vue'
import { adminViewportMode, adminViewportOptions, setAdminViewportMode } from '../../services/workspace-viewport'

/***********************工作区模式选择*********************/
const title = computed(() => `工作区适配：${adminViewportOptions.find(option => option.value === adminViewportMode.value)!.label}`)
</script>

<template>
  <ElDropdown placement="bottom-end" popper-class="admin-viewport-menu" trigger="click" :teleported="true" @command="setAdminViewportMode">
    <button
      class="admin-viewport-trigger"
      type="button"
      :title="title"
      aria-label="工作区适配"
      aria-haspopup="menu"
      data-action="workspace-viewport"
      :data-mode="adminViewportMode"
    >
      <LumalIcon name="lumal:monitor" :size="18" />
    </button>
    <template #dropdown>
      <ElDropdownMenu>
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

/* 菜单传送到 body，选中样式不能依赖 Header 的 DOM 层级。 */
:global(.admin-viewport-menu .el-dropdown-menu__item[aria-current="true"]) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

@media (max-width: 768px) {
  .admin-viewport-trigger { width: 36px; height: 36px; }
}
</style>
