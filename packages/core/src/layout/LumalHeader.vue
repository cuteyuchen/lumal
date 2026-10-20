<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { LumalIcon } from '@lumal/icons-vue'
import { ElButton, ElHeader } from 'element-plus'
import { computed, useTemplateRef } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  title?: string
  collapsed?: boolean
  height?: string
  mobileOnlyToggle?: boolean
  sidebarEnabled?: boolean
  toggleAfterTitle?: boolean
}>(), {
  collapsed: false,
  height: '50px',
  mobileOnlyToggle: false,
  sidebarEnabled: true,
  toggleAfterTitle: false,
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
  <ElHeader ref="headerRef" class="lumal-header" :height="height">
    <div class="lumal-header__left">
      <slot name="logo">
        <span v-if="title" class="lumal-header__title">{{ title }}</span>
      </slot>

      <ElButton
        v-if="sidebarEnabled"
        class="lumal-header__toggle"
        :class="{
          'is-after-title': toggleAfterTitle,
          'is-mobile-only': mobileOnlyToggle,
        }"
        text
        :aria-label="toggleLabel"
        data-action="toggle-sidebar"
        @click="handleToggleClick"
      >
        <LumalIcon :name="collapsed ? 'lumal:sidebar-expand' : 'lumal:sidebar-collapse'" morph :size="18" />
      </ElButton>
    </div>

    <div v-if="$slots.breadcrumb" class="lumal-header__breadcrumb">
      <slot name="breadcrumb" />
    </div>

    <nav v-if="$slots.navigation" class="lumal-header__navigation" aria-label="主导航">
      <slot name="navigation" />
    </nav>

    <div v-if="$slots.actions" class="lumal-header__actions">
      <slot name="actions" />
    </div>
  </ElHeader>
</template>

<style scoped lang="scss">
.lumal-header {
  position: relative;
  z-index: var(--lumal-z-header);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  flex: 0 0 auto;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.lumal-header__left {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.lumal-header__toggle {
  order: -1;
  flex: none;
  width: 32px;
  height: 32px;
  margin-left: -4px;
  padding: 0;
  border-radius: 6px;
  color: var(--el-text-color-regular);
}

.lumal-header__toggle:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.lumal-header__toggle.is-after-title {
  order: initial;
  margin-right: -4px;
  margin-left: 0;
}

.lumal-header__toggle.is-mobile-only {
  display: none;
}

.lumal-header__title {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: var(--lumal-font-size-base, 14px);
  font-weight: 600;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lumal-header__navigation {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  align-self: stretch;
  min-width: 0;
  margin-left: 12px;
  overflow: hidden;
}

.lumal-header__breadcrumb {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  margin-left: 12px;
  overflow: hidden;
}

.lumal-header__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

@media (max-width: 1024px) {
  .lumal-header {
    padding: 0 10px;
  }

  .lumal-header__navigation,
  .lumal-header__breadcrumb {
    margin-left: 8px;
  }
}

@media (max-width: 768px) {
  .lumal-header {
    padding: 0 10px;
  }

  .lumal-header__navigation,
  .lumal-header__breadcrumb {
    display: none;
  }

  .lumal-header__toggle.is-mobile-only {
    display: inline-flex;
  }

  .lumal-header__left {
    flex: 1 1 auto;
  }
}
</style>
