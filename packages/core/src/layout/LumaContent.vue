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
  min-width: 0;
  min-height: 0;
  padding: 16px;
  background: var(--el-bg-color-page);
}
</style>
