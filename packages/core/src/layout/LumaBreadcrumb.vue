<script setup lang="ts">
import type { LumaLayoutMenuItem } from './types'
import { LumaIcon } from '@luma/icons'
import { computed, inject } from 'vue'
import { routeLocationKey } from 'vue-router'
import { findMenuTrailByPath, resolveNavigationTarget } from './state/menu-layout'

interface BreadcrumbItem {
  icon?: string
  path: string
  title: string
}

const props = withDefaults(defineProps<{
  activeMenuPath?: string
  activePath?: string
  hideOnlyOne?: boolean
  homePath?: string
  homeTitle?: string
  menus?: LumaLayoutMenuItem[]
  showHome?: boolean
  showIcon?: boolean
}>(), {
  activeMenuPath: '',
  activePath: '',
  hideOnlyOne: false,
  homePath: '',
  homeTitle: '首页',
  menus: () => [],
  showHome: true,
  showIcon: true,
})

const emit = defineEmits<{
  select: [path: string]
}>()

const injectedRoute = inject(routeLocationKey, undefined)

function toBreadcrumbItem(item: LumaLayoutMenuItem): BreadcrumbItem {
  return { icon: item.icon, path: item.path, title: item.title }
}

const matchedTrail = computed<BreadcrumbItem[]>(() => {
  const matched = injectedRoute?.matched ?? []

  return matched.flatMap((record, index) => {
    const title = typeof record.meta.title === 'string' ? record.meta.title.trim() : ''
    if (!title || record.meta.hideInBreadcrumb === true) {
      return []
    }

    const isCurrent = index === matched.length - 1
    return [{
      icon: typeof record.meta.icon === 'string' ? record.meta.icon : undefined,
      path: isCurrent ? injectedRoute?.path ?? record.path : record.path,
      title,
    }]
  })
})

const menuTrail = computed<BreadcrumbItem[]>(() => {
  const directTrail = findMenuTrailByPath(props.menus, props.activePath)
  const fallbackTrail = directTrail.length > 0
    ? directTrail
    : findMenuTrailByPath(props.menus, props.activeMenuPath)
  const trail = fallbackTrail.map(toBreadcrumbItem)
  const routeTitle = typeof injectedRoute?.meta.title === 'string' ? injectedRoute.meta.title : ''
  const routeIcon = typeof injectedRoute?.meta.icon === 'string' ? injectedRoute.meta.icon : undefined
  const hideCurrent = injectedRoute?.meta.hideInBreadcrumb === true

  if (hideCurrent && trail.at(-1)?.path === props.activePath) {
    trail.pop()
  }

  if (
    routeTitle
    && !hideCurrent
    && props.activePath
    && props.activePath === injectedRoute?.path
    && !trail.some(item => item.path === props.activePath)
  ) {
    trail.push({ icon: routeIcon, path: props.activePath, title: routeTitle })
  }

  return trail
})

const contentTrail = computed(() => matchedTrail.value.length > 0 ? matchedTrail.value : menuTrail.value)

const homeItem = computed<BreadcrumbItem | undefined>(() => {
  const configured = props.homePath
    ? findMenuTrailByPath(props.menus, props.homePath).at(-1)
    : undefined
  const firstMenu = props.menus.find(item => !item.hidden)
  const path = props.homePath || resolveNavigationTarget(firstMenu)

  if (!path) {
    return undefined
  }

  return {
    icon: configured?.icon ?? firstMenu?.icon,
    path,
    title: configured?.title ?? props.homeTitle,
  }
})

const items = computed(() => {
  const trail = [...contentTrail.value]
  const home = homeItem.value

  if (props.showHome && home && !trail.some(item => item.path === home.path)) {
    trail.unshift(home)
  }

  return trail
})

const visible = computed(() => items.value.length > 0 && !(props.hideOnlyOne && contentTrail.value.length <= 1))
</script>

<template>
  <nav v-if="visible" class="luma-breadcrumb" aria-label="面包屑">
    <ol class="luma-breadcrumb__list">
      <li v-for="(item, index) in items" :key="`${item.path}:${index}`" class="luma-breadcrumb__item">
        <LumaIcon
          v-if="index > 0"
          class="luma-breadcrumb__separator"
          name="luma:chevron-right"
          :size="14"
        />
        <span v-if="index === items.length - 1" class="luma-breadcrumb__current" aria-current="page">
          <LumaIcon v-if="showIcon && item.icon" :name="item.icon" :size="15" />
          <span>{{ item.title }}</span>
        </span>
        <button v-else class="luma-breadcrumb__link" type="button" @click="emit('select', item.path)">
          <LumaIcon v-if="showIcon && item.icon" :name="item.icon" :size="15" />
          <span>{{ item.title }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.luma-breadcrumb {
  display: flex;
  min-height: 40px;
  align-items: center;
  flex: none;
  padding: 0 var(--luma-page-gutter, 20px);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.luma-breadcrumb__list,
.luma-breadcrumb__item,
.luma-breadcrumb__current,
.luma-breadcrumb__link {
  display: flex;
  min-width: 0;
  align-items: center;
}

.luma-breadcrumb__list {
  margin: 0;
  padding: 0;
  overflow: hidden;
  list-style: none;
}

.luma-breadcrumb__item {
  flex: none;
  gap: 8px;
}

.luma-breadcrumb__separator {
  flex: none;
  color: var(--el-text-color-placeholder);
}

.luma-breadcrumb__link {
  gap: 5px;
  padding: 4px 0;
  border: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  font: inherit;
}

.luma-breadcrumb__link:hover {
  color: var(--el-color-primary);
}

.luma-breadcrumb__link:focus-visible {
  border-radius: var(--el-border-radius-small);
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.luma-breadcrumb__current {
  max-width: 240px;
  gap: 5px;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .luma-breadcrumb {
    display: none;
  }
}
</style>
