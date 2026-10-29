<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { getViewportConfig } from '@lumal/viewport'
import { ElMain } from 'element-plus'
import { useTemplateRef } from 'vue'

/***********************模板引用*********************/
const contentRef = useTemplateRef<ComponentPublicInstance>('contentRef')

/***********************公开方法*********************/
defineExpose({
  getContentElement: () => contentRef.value?.$el as HTMLElement | undefined,
  getContentInstance: () => contentRef.value,
})
</script>

<template>
  <ElMain ref="contentRef" class="lumal-content" :class="{ 'is-responsive': !getViewportConfig().enabled }">
    <slot />
  </ElMain>
</template>

<style scoped lang="scss">
.lumal-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  background: var(--el-bg-color-page);
}

@media (max-width: 1024px) {
  .lumal-content.is-responsive {
    padding: 10px;
  }
}

@media (max-width: 768px) {
  .lumal-content.is-responsive {
    padding: 6px;
  }
}
</style>
