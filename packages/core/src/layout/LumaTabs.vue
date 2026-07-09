<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { LumaLayoutTabItem } from './types'
import { ElTabPane, ElTabs } from 'element-plus'
import { useTemplateRef } from 'vue'

/***********************属性定义*********************/
withDefaults(defineProps<{
  tabs?: LumaLayoutTabItem[]
}>(), {
  tabs: () => [],
})

const emit = defineEmits<{
  change: [path: string]
  remove: [path: string]
}>()

const activePath = defineModel<string>('activePath', { default: '' })

/***********************模板引用*********************/
const tabsRef = useTemplateRef<ComponentPublicInstance>('tabsRef')

/***********************事件处理*********************/
function handleTabChange(path: string | number): void {
  const nextPath = String(path)
  activePath.value = nextPath
  emit('change', nextPath)
}

function handleTabEdit(path: string | number | undefined, action: string): void {
  if (action !== 'remove' || path === undefined) {
    return
  }

  emit('remove', String(path))
}

/***********************公开方法*********************/
defineExpose({
  getTabsElement: () => tabsRef.value?.$el as HTMLElement | undefined,
  getTabsInstance: () => tabsRef.value,
})
</script>

<template>
  <ElTabs
    ref="tabsRef"
    v-model="activePath"
    class="luma-tabs"
    type="card"
    @edit="handleTabEdit"
    @tab-change="handleTabChange"
  >
    <ElTabPane
      v-for="tab in tabs"
      :key="tab.path"
      :label="tab.title"
      :name="tab.path"
      :closable="tab.closable"
    />
  </ElTabs>
</template>

<style scoped lang="scss">
.luma-tabs {
  min-width: 0;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}
</style>
