<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { LumalLayoutMenuItem } from './types'
import { viewportLength } from '@lumal/viewport'
import { ElAside, ElMenu, ElScrollbar } from 'element-plus'
import { computed, useTemplateRef } from 'vue'
import LumalSidebarMenuItem from './LumalSidebarMenuItem.vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  menus?: LumalLayoutMenuItem[]
  activePath?: string
  ariaLabel?: string
  collapsed?: boolean
  width?: number | string
  collapsedWidth?: number | string
}>(), {
  activePath: '',
  ariaLabel: '侧边导航',
  collapsed: false,
  collapsedWidth: 64,
  menus: () => [],
  width: 280,
})

const emit = defineEmits<{
  select: [path: string]
}>()

/***********************模板引用*********************/
const asideRef = useTemplateRef<ComponentPublicInstance>('asideRef')

/***********************侧边栏状态*********************/
const asideWidth = computed(() => {
  const width = props.collapsed ? props.collapsedWidth : props.width
  return typeof width === 'number' ? viewportLength(width) : width
})

/***********************事件处理*********************/
function handleSelect(path: string): void {
  emit('select', path)
}

/***********************公开方法*********************/
defineExpose({
  getAsideElement: () => asideRef.value?.$el as HTMLElement | undefined,
  getAsideInstance: () => asideRef.value,
})
</script>

<template>
  <ElAside ref="asideRef" class="lumal-sidebar" :width="asideWidth" :aria-label="ariaLabel">
    <ElScrollbar class="lumal-sidebar__scrollbar">
      <ElMenu
        class="lumal-sidebar__menu"
        :collapse="collapsed"
        :default-active="activePath"
      >
        <LumalSidebarMenuItem
          v-for="item in menus.filter(menu => !menu.hidden)"
          :key="item.path"
          :item="item"
          :active-path="activePath"
          :collapsed="collapsed"
          :depth="0"
          @select="handleSelect"
        />
      </ElMenu>
    </ElScrollbar>
  </ElAside>
</template>

<style scoped lang="scss">
.lumal-sidebar {
  flex: 0 0 auto;
  min-height: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition:
    width var(--lumal-motion-duration-base) var(--lumal-easing-standard),
    transform var(--lumal-motion-duration-base) var(--lumal-easing-standard);
}

.lumal-sidebar__scrollbar {
  height: 100%;
}

.lumal-sidebar__menu {
  min-height: 100%;
  padding: 12px 8px;
  border-right: 0;
}

.lumal-sidebar__menu :deep(.el-menu-item),
.lumal-sidebar__menu :deep(.el-sub-menu__title) {
  height: 44px;
  margin: 2px 0;
  border-radius: var(--el-border-radius-base);
}

.lumal-sidebar__menu :deep(.el-menu-item.is-active) {
  font-weight: 600;
  background: var(--el-color-primary-light-9);
}

.lumal-sidebar__menu.el-menu--collapse :deep(.el-menu-item),
.lumal-sidebar__menu.el-menu--collapse :deep(.el-sub-menu__title) {
  justify-content: center;
  padding-right: 0 !important;
  padding-left: 0 !important;
}

.lumal-sidebar__menu.el-menu--collapse :deep(.lumal-sidebar-menu-item__icon) {
  display: inline-flex;
  width: 20px;
  height: 20px;
  margin: 0;
  align-items: center;
  justify-content: center;
}
</style>
