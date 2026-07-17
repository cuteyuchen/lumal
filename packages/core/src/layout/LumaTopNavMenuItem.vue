<script setup lang="ts">
import type { LumaLayoutMenuItem } from './types'
import { LumaIcon } from '@luma/icons'
import { ElMenuItem, ElSubMenu } from 'element-plus'
import { computed } from 'vue'
import LumaMenuBadge from './LumaMenuBadge.vue'

const props = defineProps<{
  item: LumaLayoutMenuItem
}>()

const emit = defineEmits<{
  select: [path: string]
}>()

const visibleChildren = computed(() => props.item.children?.filter(child => !child.hidden) ?? [])
// 新开页外链只是“打开动作”，不进入 ElMenu 选中态追踪，避免点击后高亮与实际页面错位。
const isExternalAction = computed(() => Boolean(props.item.externalLink) && props.item.externalTarget !== '_self')

function handleSelect(path: string): void {
  emit('select', path)
}
</script>

<template>
  <ElSubMenu v-if="visibleChildren.length" :index="item.path">
    <template #title>
      <LumaIcon v-if="item.icon" :name="item.icon" :size="16" />
      <span class="luma-top-nav-menu-item__label">
        <span>{{ item.title }}</span>
        <LumaMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
      </span>
      <span v-if="item.externalLink" class="luma-top-nav-menu-item__external" aria-hidden="true">↗</span>
    </template>

    <LumaTopNavMenuItem
      v-for="child in visibleChildren"
      :key="child.path"
      :item="child"
      @select="handleSelect"
    />
  </ElSubMenu>

  <li
    v-else-if="isExternalAction"
    class="el-menu-item luma-top-nav-menu-item--external"
    role="menuitem"
    tabindex="-1"
    @click="handleSelect(item.path)"
  >
    <LumaIcon v-if="item.icon" :name="item.icon" :size="16" />
    <span class="luma-top-nav-menu-item__label">
      <span>{{ item.title }}</span>
      <LumaMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
    </span>
    <span class="luma-top-nav-menu-item__external" aria-hidden="true">↗</span>
  </li>

  <ElMenuItem v-else :index="item.path" @click="handleSelect(item.path)">
    <LumaIcon v-if="item.icon" :name="item.icon" :size="16" />
    <span class="luma-top-nav-menu-item__label">
      <span>{{ item.title }}</span>
      <LumaMenuBadge :badge="item.badge" :label="item.title" :tone="item.badgeTone" :type="item.badgeType" />
    </span>
    <span v-if="item.externalLink" class="luma-top-nav-menu-item__external" aria-hidden="true">↗</span>
  </ElMenuItem>
</template>

<style scoped lang="scss">
.luma-top-nav-menu-item__label {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.luma-top-nav-menu-item__external {
  margin-left: 4px;
  color: var(--el-text-color-placeholder);
  font-size: calc(var(--luma-font-size-base, 14px) - 2px);
}
</style>
