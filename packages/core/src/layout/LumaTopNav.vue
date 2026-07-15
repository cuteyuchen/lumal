<script setup lang="ts">
import type { ComponentPublicInstance, CSSProperties } from 'vue'
import type { LumaLayoutMenuItem } from './types'
import { LumaIcon } from '@luma/icons'
import { ElMenu, ElMenuItem } from 'element-plus'
import { computed, useTemplateRef } from 'vue'
import LumaMenuBadge from './LumaMenuBadge.vue'
import LumaTopNavMenuItem from './LumaTopNavMenuItem.vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  activePath?: string
  align?: 'center' | 'left' | 'right'
  maxWidth?: number | string
  menus?: LumaLayoutMenuItem[]
  mode?: 'flat' | 'tree'
}>(), {
  activePath: '',
  align: 'left',
  maxWidth: '100%',
  menus: () => [],
  mode: 'tree',
})

const emit = defineEmits<{
  select: [path: string]
}>()

const menuRef = useTemplateRef<ComponentPublicInstance>('menuRef')
const visibleMenus = computed(() => props.menus.filter(item => !item.hidden))
const menuStyle = computed<CSSProperties>(() => ({
  '--luma-top-nav-max-width': typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth,
}))

function handleSelect(path: string): void {
  emit('select', path)
}

defineExpose({
  getMenuElement: () => menuRef.value?.$el as HTMLElement | undefined,
  getMenuInstance: () => menuRef.value,
})
</script>

<template>
  <ElMenu
    ref="menuRef"
    class="luma-top-nav"
    :class="`is-align-${align}`"
    mode="horizontal"
    :default-active="activePath"
    :ellipsis="true"
    :style="menuStyle"
  >
    <LumaTopNavMenuItem
      v-for="item in mode === 'tree' ? visibleMenus : []"
      :key="`tree:${item.path}`"
      :item="item"
      @select="handleSelect"
    />
    <ElMenuItem
      v-for="item in mode === 'flat' ? visibleMenus : []"
      :key="`flat:${item.path}`"
      :index="item.path"
      @click="handleSelect(item.path)"
    >
      <LumaIcon v-if="item.icon" :name="item.icon" :size="16" />
      <span class="luma-top-nav__label">
        <span>{{ item.title }}</span>
        <LumaMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
      </span>
      <span v-if="item.externalLink" class="luma-top-nav__external" aria-hidden="true">↗</span>
    </ElMenuItem>
  </ElMenu>
</template>

<style scoped lang="scss">
.luma-top-nav {
  flex: 1 1 auto;
  width: 100%;
  max-width: var(--luma-top-nav-max-width);
  min-width: 0;
  height: 100%;
  border-bottom: 0;
  background: transparent;
}

.luma-top-nav.is-align-left {
  margin-right: auto;
}

.luma-top-nav.is-align-center {
  margin-right: auto;
  margin-left: auto;
}

.luma-top-nav.is-align-right {
  margin-left: auto;
}

.luma-top-nav :deep(.el-menu-item),
.luma-top-nav :deep(.el-sub-menu__title) {
  gap: 8px;
  height: 100%;
  min-height: 44px;
  padding: 0 18px;
  border-bottom-width: 2px;
  font-size: var(--luma-font-size-base, 14px);
  font-weight: 500;
}

.luma-top-nav__external {
  color: var(--el-text-color-placeholder);
  font-size: calc(var(--luma-font-size-base, 14px) - 2px);
}

.luma-top-nav__label {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}
</style>
