<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { ElButton, ElHeader } from 'element-plus'
import { computed, useTemplateRef } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  title?: string
  collapsed?: boolean
  height?: string
}>(), {
  collapsed: false,
  height: '56px',
})

const emit = defineEmits<{
  toggleCollapse: []
}>()

/***********************模板引用*********************/
const headerRef = useTemplateRef<ComponentPublicInstance>('headerRef')

/***********************显示状态*********************/
const toggleLabel = computed(() => props.collapsed ? '展开侧边栏' : '收起侧边栏')

const toggleIcon = computed(() => props.collapsed ? '>' : '<')

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
        class="luma-header__toggle"
        text
        :aria-label="toggleLabel"
        data-action="toggle-sidebar"
        @click="handleToggleClick"
      >
        <span aria-hidden="true">{{ toggleIcon }}</span>
      </ElButton>

      <slot name="logo">
        <span v-if="title" class="luma-header__title">{{ title }}</span>
      </slot>
    </div>

    <div v-if="$slots.actions" class="luma-header__actions">
      <slot name="actions" />
    </div>
  </ElHeader>
</template>

<style scoped lang="scss">
.luma-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.luma-header__left {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.luma-header__toggle {
  flex: none;
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

.luma-header__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}
</style>
