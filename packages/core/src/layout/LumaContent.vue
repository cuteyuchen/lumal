<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
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
  <ElMain ref="contentRef" class="luma-content">
    <slot />
  </ElMain>
</template>

<style scoped lang="scss">
.luma-content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  padding: 20px;
  overflow: auto;
  background: var(--el-bg-color-page);
}

@media (max-width: 1024px) {
  .luma-content {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .luma-content {
    padding: 12px;
  }
}
</style>
