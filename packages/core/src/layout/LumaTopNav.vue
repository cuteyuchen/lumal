<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { LumaLayoutMenuItem } from './types'
import { LumaIcon } from '@luma/icons'
import { ElMenu, ElMenuItem, ElSubMenu } from 'element-plus'
import { useTemplateRef } from 'vue'

/***********************属性定义*********************/
withDefaults(defineProps<{
  menus?: LumaLayoutMenuItem[]
  activePath?: string
  mode?: 'flat' | 'tree'
}>(), {
  activePath: '',
  menus: () => [],
  mode: 'tree',
})

const emit = defineEmits<{
  select: [path: string]
}>()

/***********************模板引用*********************/
const menuRef = useTemplateRef<ComponentPublicInstance>('menuRef')

/***********************事件处理*********************/
function handleSelect(path: string): void {
  emit('select', path)
}

/***********************公开方法*********************/
defineExpose({
  getMenuElement: () => menuRef.value?.$el as HTMLElement | undefined,
  getMenuInstance: () => menuRef.value,
})
</script>

<template>
  <ElMenu
    ref="menuRef"
    class="luma-top-nav"
    mode="horizontal"
    :default-active="activePath"
    :ellipsis="false"
  >
    <template v-for="item in menus" :key="item.path">
      <ElSubMenu v-if="mode === 'tree' && item.children?.length" :index="item.path">
        <template #title>
          <LumaIcon v-if="item.icon" :name="item.icon" :size="16" />
          <span>{{ item.title }}</span>
        </template>
        <ElMenuItem
          v-for="child in item.children"
          :key="child.path"
          :index="child.path"
          @click="handleSelect(child.path)"
        >
          <LumaIcon v-if="child.icon" :name="child.icon" :size="16" />
          {{ child.title }}
        </ElMenuItem>
      </ElSubMenu>
      <ElMenuItem
        v-else
        :index="item.path"
        @click="handleSelect(item.path)"
      >
        <LumaIcon v-if="item.icon" :name="item.icon" :size="16" />
        {{ item.title }}
      </ElMenuItem>
    </template>
  </ElMenu>
</template>

<style scoped lang="scss">
.luma-top-nav {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  border-bottom: 0;
  background: transparent;
}

.luma-top-nav :deep(.el-menu-item),
.luma-top-nav :deep(.el-sub-menu__title) {
  gap: 8px;
  height: 100%;
  min-height: 44px;
  padding: 0 18px;
  border-bottom-width: 2px;
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .luma-top-nav {
    overflow-x: auto;
    overflow-y: hidden;
  }

  .luma-top-nav :deep(.el-menu-item),
  .luma-top-nav :deep(.el-sub-menu__title) {
    padding: 0 14px;
  }
}
</style>
