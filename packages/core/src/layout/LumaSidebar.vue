<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { LumaLayoutMenuItem } from './types'
import { ElAside, ElMenu, ElScrollbar } from 'element-plus'
import { computed, useTemplateRef } from 'vue'
import LumaSidebarMenuItem from './LumaSidebarMenuItem.vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  menus?: LumaLayoutMenuItem[]
  activePath?: string
  ariaLabel?: string
  collapsed?: boolean
  width?: string
  collapsedWidth?: string
}>(), {
  activePath: '',
  ariaLabel: '侧边导航',
  collapsed: false,
  collapsedWidth: '64px',
  menus: () => [],
  width: '280px',
})

const emit = defineEmits<{
  select: [path: string]
}>()

/***********************模板引用*********************/
const asideRef = useTemplateRef<ComponentPublicInstance>('asideRef')

/***********************侧边栏状态*********************/
const asideWidth = computed(() => props.collapsed ? props.collapsedWidth : props.width)

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
  <ElAside ref="asideRef" class="luma-sidebar" :width="asideWidth" :aria-label="ariaLabel">
    <ElScrollbar class="luma-sidebar__scrollbar">
      <ElMenu
        class="luma-sidebar__menu"
        :collapse="collapsed"
        :default-active="activePath"
      >
        <LumaSidebarMenuItem
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
.luma-sidebar {
  flex: 0 0 auto;
  min-height: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition:
    width var(--luma-motion-duration-base) var(--luma-easing-standard),
    transform var(--luma-motion-duration-base) var(--luma-easing-standard);
}

.luma-sidebar__scrollbar {
  height: 100%;
}

.luma-sidebar__menu {
  min-height: 100%;
  padding: 12px 8px;
  border-right: 0;
}

.luma-sidebar__menu :deep(.el-menu-item),
.luma-sidebar__menu :deep(.el-sub-menu__title) {
  height: 44px;
  margin: 2px 0;
  border-radius: var(--el-border-radius-base);
}

.luma-sidebar__menu :deep(.el-menu-item.is-active) {
  font-weight: 600;
  background: var(--el-color-primary-light-9);
}

.luma-sidebar__menu.el-menu--collapse :deep(.el-menu-item),
.luma-sidebar__menu.el-menu--collapse :deep(.el-sub-menu__title) {
  justify-content: center;
  padding-right: 0 !important;
  padding-left: 0 !important;
}

.luma-sidebar__menu.el-menu--collapse :deep(.luma-sidebar-menu-item__icon) {
  display: inline-flex;
  width: 20px;
  height: 20px;
  margin: 0;
  align-items: center;
  justify-content: center;
}
</style>
