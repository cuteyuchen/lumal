<script setup lang="ts">
import type { LumalLayoutMenuItem } from './types'
import { LumalIcon } from '@lumal/icons-vue'
import { ElMenuItem, ElSubMenu } from 'element-plus'
import { computed } from 'vue'
import LumalMenuBadge from './LumalMenuBadge.vue'
import { includesMenuPath } from './state/menu-layout'

/***********************属性与事件*********************/
const props = withDefaults(defineProps<{
  activePath?: string
  item: LumalLayoutMenuItem
}>(), {
  activePath: '',
})

const emit = defineEmits<{
  select: [path: string]
}>()

/***********************菜单状态*********************/
const visibleChildren = computed(() => props.item.children?.filter(child => !child.hidden) ?? [])
// 新开页外链只是“打开动作”，不进入 ElMenu 选中态追踪，避免点击后高亮与实际页面错位。
const isExternalAction = computed(() => Boolean(props.item.externalLink) && props.item.externalTarget !== '_self')
// ElMenu 的 default-active 在路由切换后对“一级即叶子”项偶发不同步，这里用路径显式驱动选中样式。
const isActive = computed(() => Boolean(props.activePath) && includesMenuPath(props.item, props.activePath))

/***********************菜单事件*********************/
function handleSelect(path: string): void {
  emit('select', path)
}
</script>

<template>
  <ElSubMenu
    v-if="visibleChildren.length"
    :index="item.path"
    :class="{ 'is-active': isActive }"
  >
    <template #title>
      <LumalIcon v-if="item.icon" :name="item.icon" :size="16" />
      <span class="lumal-top-nav-menu-item__label">
        <span>{{ item.title }}</span>
        <LumalMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
      </span>
      <LumalIcon v-if="item.externalLink" class="lumal-top-nav-menu-item__external" name="lumal:external-link" :size="12" />
    </template>

    <LumalTopNavMenuItem
      v-for="child in visibleChildren"
      :key="child.path"
      :item="child"
      :active-path="activePath"
      @select="handleSelect"
    />
  </ElSubMenu>

  <li
    v-else-if="isExternalAction"
    class="el-menu-item lumal-top-nav-menu-item--external"
    :class="{ 'is-active': isActive }"
    role="menuitem"
    tabindex="-1"
    @click="handleSelect(item.path)"
  >
    <LumalIcon v-if="item.icon" :name="item.icon" :size="16" />
    <span class="lumal-top-nav-menu-item__label">
      <span>{{ item.title }}</span>
      <LumalMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
    </span>
    <LumalIcon class="lumal-top-nav-menu-item__external" name="lumal:external-link" :size="12" />
  </li>

  <ElMenuItem
    v-else
    :index="item.path"
    :class="{ 'is-active': isActive }"
    @click="handleSelect(item.path)"
  >
    <LumalIcon v-if="item.icon" :name="item.icon" :size="16" />
    <span class="lumal-top-nav-menu-item__label">
      <span>{{ item.title }}</span>
      <LumalMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
    </span>
    <LumalIcon v-if="item.externalLink" class="lumal-top-nav-menu-item__external" name="lumal:external-link" :size="12" />
  </ElMenuItem>
</template>

<style scoped lang="scss">
.lumal-top-nav-menu-item__label {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.lumal-top-nav-menu-item__external {
  margin-left: 4px;
  color: var(--el-text-color-placeholder);
  font-size: calc(var(--lumal-font-size-base, 14px) - 2px);
}
</style>
