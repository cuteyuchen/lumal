<script setup lang="ts">
import type { LumalLayoutMenuItem } from './types'
import { LumalIcon } from '@lumal/icons-vue'
import { ElMenuItem, ElSubMenu } from 'element-plus'
import { computed } from 'vue'
import LumalMenuBadge from './LumalMenuBadge.vue'

/***********************属性定义*********************/
const props = defineProps<{
  activePath?: string
  collapsed?: boolean
  depth?: number
  item: LumalLayoutMenuItem
}>()

const emit = defineEmits<{
  select: [path: string]
}>()

/***********************菜单状态*********************/
const visibleChildren = computed(() => props.item.children?.filter(child => !child.hidden) ?? [])
const hasChildren = computed(() => visibleChildren.value.length > 0)
// 新开页外链只是“打开动作”，不是页面跳转，不能进入 ElMenu 的选中态追踪，
// 否则点击后 ElMenu 内部 activeIndex 会停留在外链项，与实际显示的页面不一致。
const isExternalAction = computed(() => Boolean(props.item.externalLink) && props.item.externalTarget !== '_self')

/***********************事件处理*********************/
function handleSelect(path: string): void {
  emit('select', path)
}
</script>

<template>
  <ElSubMenu
    v-if="hasChildren"
    class="lumal-sidebar-menu-item"
    :index="item.path"
    :title="collapsed ? item.title : undefined"
  >
    <template #title>
      <i
        v-if="item.icon"
        class="lumal-sidebar-menu-item__icon"
        aria-hidden="true"
      >
        <LumalIcon :name="item.icon" :size="16" />
      </i>
      <span class="lumal-sidebar-menu-item__label">
        <span class="lumal-sidebar-menu-item__title">{{ item.title }}</span>
        <LumalMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
      </span>
      <LumalIcon v-if="item.externalLink" class="lumal-sidebar-menu-item__external" name="lumal:external-link" :size="12" />
    </template>

    <LumalSidebarMenuItem
      v-for="child in visibleChildren"
      :key="child.path"
      :item="child"
      :active-path="activePath"
      :collapsed="collapsed"
      :depth="(depth ?? 0) + 1"
      @select="handleSelect"
    />
  </ElSubMenu>

  <li
    v-else-if="isExternalAction"
    class="el-menu-item lumal-sidebar-menu-item lumal-sidebar-menu-item--external"
    role="menuitem"
    tabindex="-1"
    :title="collapsed ? item.title : undefined"
    @click="handleSelect(item.path)"
  >
    <i
      v-if="item.icon"
      class="lumal-sidebar-menu-item__icon"
      aria-hidden="true"
    >
      <LumalIcon :name="item.icon" :size="16" />
    </i>
    <span class="lumal-sidebar-menu-item__label">
      <span class="lumal-sidebar-menu-item__title">{{ item.title }}</span>
      <LumalMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
    </span>
    <LumalIcon class="lumal-sidebar-menu-item__external" name="lumal:external-link" :size="12" />
  </li>

  <ElMenuItem
    v-else
    class="lumal-sidebar-menu-item"
    :index="item.path"
    :title="collapsed ? item.title : undefined"
    @click="handleSelect(item.path)"
  >
    <i
      v-if="item.icon"
      class="lumal-sidebar-menu-item__icon"
      aria-hidden="true"
    >
      <LumalIcon :name="item.icon" :size="16" />
    </i>
    <span class="lumal-sidebar-menu-item__label">
      <span class="lumal-sidebar-menu-item__title">{{ item.title }}</span>
      <LumalMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
    </span>
    <LumalIcon v-if="item.externalLink" class="lumal-sidebar-menu-item__external" name="lumal:external-link" :size="12" />
  </ElMenuItem>
</template>

<style scoped lang="scss">
.lumal-sidebar-menu-item__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-style: normal;
}

.lumal-sidebar-menu-item__label {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.lumal-sidebar-menu-item__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lumal-sidebar-menu-item__external {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
  font-size: calc(var(--lumal-font-size-base, 14px) - 2px);
}
</style>
