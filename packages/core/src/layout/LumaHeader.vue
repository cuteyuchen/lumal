<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { ElButton, ElHeader } from 'element-plus'
import { computed, useTemplateRef } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  title?: string
  collapsed?: boolean
  height?: string
  sidebarEnabled?: boolean
}>(), {
  collapsed: false,
  height: '56px',
  sidebarEnabled: true,
})

const emit = defineEmits<{
  toggleCollapse: []
}>()

/***********************模板引用*********************/
const headerRef = useTemplateRef<ComponentPublicInstance>('headerRef')

/***********************显示状态*********************/
const toggleLabel = computed(() => props.collapsed ? '展开侧边栏' : '收起侧边栏')

/***********************事件处理*********************/
function handleToggleClick(): void {
  emit('toggleCollapse')
}

/***********************公开方法*********************/
defineExpose({
  getHeaderElement: () => headerRef.value?.$el as HTMLElement | undefined,
  getHeaderInstance: () => headerRef.value,
})
</script>

<template>
  <ElHeader ref="headerRef" class="luma-header" :height="height">
    <div class="luma-header__left">
      <ElButton
        v-if="sidebarEnabled"
        class="luma-header__toggle"
        text
        :aria-label="toggleLabel"
        data-action="toggle-sidebar"
        @click="handleToggleClick"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </ElButton>

      <slot name="logo">
        <span v-if="title" class="luma-header__title">{{ title }}</span>
      </slot>
    </div>

    <nav v-if="$slots.navigation" class="luma-header__navigation" aria-label="主导航">
      <slot name="navigation" />
    </nav>

    <div v-if="$slots.actions" class="luma-header__actions">
      <slot name="actions" />
    </div>
  </ElHeader>
</template>

<style scoped lang="scss">
.luma-header {
  position: relative;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  flex: 0 0 auto;
  padding: 0 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  box-shadow: var(--luma-shadow-light);
}

.luma-header__left {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.luma-header__toggle {
  flex: none;
  width: 40px;
  height: 40px;
  margin-left: -8px;
}

.luma-header__toggle svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.luma-header__title {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.luma-header__navigation {
  display: flex;
  flex: 1 1 auto;
  align-self: stretch;
  min-width: 0;
  margin-left: 32px;
  overflow: hidden;
}

.luma-header__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}

@media (max-width: 1024px) {
  .luma-header {
    padding: 0 16px;
  }

  .luma-header__navigation {
    margin-left: 16px;
  }
}

@media (max-width: 768px) {
  .luma-header {
    padding: 0 12px;
  }

  .luma-header__navigation {
    order: 3;
    flex-basis: 100%;
    height: 44px;
    margin: 0 -12px;
    padding: 0 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .luma-header:has(.luma-header__navigation) {
    flex-wrap: wrap;
    height: auto !important;
    min-height: var(--luma-header-height, 56px);
  }

  .luma-header__left {
    flex: 1 1 auto;
  }
}
</style>
