<script setup lang="ts">
import type { PreferenceAvailability } from './preferences'
import type {
  LumalHeaderMenuAlign,
  LumalLayoutMode,
  LumalPreferences,
  LumalPreferencesDefaults,
  LumalTabStyle,
  ResolvedPreferenceVisibility,
} from './types'
import { ElInputNumber, ElSwitch } from 'element-plus'
import { computed } from 'vue'

/***********************属性与事件*********************/
const props = defineProps<{
  availability: PreferenceAvailability
  preferences: LumalPreferences
  visibility: ResolvedPreferenceVisibility
}>()

const emit = defineEmits<{
  update: [patch: LumalPreferencesDefaults]
}>()

/***********************分组与布局选项*********************/
const sections = computed(() => ({
  header: props.visibility.header.menuAlign || props.visibility.header.menuMaxWidth,
  sidebar: Object.values(props.visibility.sidebar).some(Boolean),
  tabbar: Object.values(props.visibility.tabbar).some(Boolean),
}))
const layoutModeOptions: { label: string, value: LumalLayoutMode }[] = [
  { label: '侧边导航', value: 'sidebar-nav' },
  { label: '顶部导航', value: 'top-nav' },
  { label: '混合导航', value: 'mixed-nav' },
]
const alignOptions: { label: string, value: LumalHeaderMenuAlign }[] = [
  { label: '左侧', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右侧', value: 'right' },
]
const tabStyleOptions: { label: string, value: LumalTabStyle }[] = [
  { label: 'Chrome', value: 'chrome' },
  { label: '朴素', value: 'plain' },
  { label: '卡片', value: 'card' },
  { label: '动效', value: 'brisk' },
]
</script>

<template>
  <section v-if="visibility.app.layout" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      布局模式
    </h4>
    <div class="lumal-theme-settings__layout-grid">
      <button
        v-for="item in layoutModeOptions"
        :key="item.value"
        type="button"
        class="lumal-theme-settings__layout-card"
        :class="[{ 'is-active': preferences.app.layout === item.value }, `is-${item.value}`]"
        :aria-pressed="preferences.app.layout === item.value"
        @click="emit('update', { app: { layout: item.value } })"
      >
        <span class="lumal-theme-settings__layout-frame">
          <svg class="lumal-theme-settings__layout-preview" viewBox="0 0 160 92" aria-hidden="true" focusable="false">
            <rect class="is-background" x="1" y="1" width="158" height="90" rx="4" />
            <template v-if="item.value === 'sidebar-nav'">
              <rect class="is-strong" x="8" y="8" width="30" height="76" rx="4" />
              <rect x="46" y="12" width="106" height="14" rx="3" />
              <rect x="46" y="36" width="49" height="40" rx="4" />
              <rect x="103" y="36" width="49" height="40" rx="4" />
            </template>
            <template v-else-if="item.value === 'top-nav'">
              <rect class="is-strong" x="8" y="8" width="144" height="14" rx="4" />
              <rect x="8" y="32" width="144" height="14" rx="3" />
              <rect x="8" y="56" width="68" height="24" rx="4" />
              <rect x="84" y="56" width="68" height="24" rx="4" />
            </template>
            <template v-else>
              <rect class="is-strong" x="8" y="8" width="144" height="14" rx="4" />
              <rect class="is-medium" x="8" y="28" width="26" height="56" rx="4" />
              <rect x="44" y="32" width="108" height="14" rx="3" />
              <rect x="44" y="56" width="50" height="24" rx="4" />
              <rect x="102" y="56" width="50" height="24" rx="4" />
            </template>
          </svg>
        </span>
        <span class="lumal-theme-settings__option-label">{{ item.label }}</span>
      </button>
    </div>
  </section>

  <section v-if="sections.header" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      顶栏
    </h4>
    <div v-if="visibility.header.menuAlign" class="lumal-theme-settings__row is-stacked" :class="{ 'is-disabled': !availability.headerMenuAlign }">
      <span>菜单位置</span>
      <div class="lumal-theme-settings__segments">
        <button
          v-for="item in alignOptions"
          :key="item.value"
          type="button"
          :disabled="!availability.headerMenuAlign"
          :aria-pressed="preferences.header.menuAlign === item.value"
          :class="{ 'is-active': preferences.header.menuAlign === item.value }"
          @click="emit('update', { header: { menuAlign: item.value } })"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
    <div v-if="visibility.header.menuMaxWidth" class="lumal-theme-settings__row" :class="{ 'is-disabled': !availability.headerMenuMaxWidth }">
      <span>菜单最大宽度</span>
      <ElInputNumber
        :model-value="preferences.header.menuMaxWidth"
        :disabled="!availability.headerMenuMaxWidth"
        :min="480"
        :max="1440"
        :step="40"
        aria-label="菜单最大宽度"
        @update:model-value="emit('update', { header: { menuMaxWidth: Number($event) } })"
      />
    </div>
  </section>

  <section v-if="sections.sidebar" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      侧边栏
    </h4>
    <div v-if="visibility.sidebar.enable" class="lumal-theme-settings__row">
      <span>显示侧边栏</span>
      <ElSwitch :model-value="preferences.sidebar.enable" aria-label="显示侧边栏" @update:model-value="emit('update', { sidebar: { enable: Boolean($event) } })" />
    </div>
    <div v-if="visibility.sidebar.autoActivateChild" class="lumal-theme-settings__row" :class="{ 'is-disabled': !availability.sidebarAutoActivateChild }">
      <span>自动进入首个子菜单</span>
      <ElSwitch :model-value="preferences.sidebar.autoActivateChild" :disabled="!availability.sidebarAutoActivateChild" aria-label="自动进入首个子菜单" @update:model-value="emit('update', { sidebar: { autoActivateChild: Boolean($event) } })" />
    </div>
    <div v-if="visibility.sidebar.collapsed" class="lumal-theme-settings__row" :class="{ 'is-disabled': !availability.sidebarCollapsed }">
      <span>折叠菜单</span>
      <ElSwitch :model-value="preferences.sidebar.collapsed" :disabled="!availability.sidebarCollapsed" aria-label="折叠菜单" @update:model-value="emit('update', { sidebar: { collapsed: Boolean($event) } })" />
    </div>
    <div v-if="visibility.sidebar.width" class="lumal-theme-settings__row" :class="{ 'is-disabled': !availability.sidebarWidth }">
      <span>宽度</span>
      <ElInputNumber
        :model-value="preferences.sidebar.width"
        :disabled="!availability.sidebarWidth"
        :min="200"
        :max="320"
        :step="8"
        aria-label="侧边栏宽度"
        @update:model-value="emit('update', { sidebar: { width: Number($event) } })"
      />
    </div>
  </section>

  <section v-if="sections.tabbar" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      标签栏
    </h4>
    <div v-if="visibility.tabbar.enable" class="lumal-theme-settings__row">
      <span>启用标签栏</span>
      <ElSwitch :model-value="preferences.tabbar.enable" aria-label="启用标签栏" @update:model-value="emit('update', { tabbar: { enable: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.cache" class="lumal-theme-settings__row" :class="{ 'is-disabled': !availability.tabbarCache }">
      <span>页面缓存</span>
      <ElSwitch :model-value="preferences.tabbar.cache" :disabled="!availability.tabbarCache" aria-label="页面缓存" @update:model-value="emit('update', { tabbar: { cache: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.persist" class="lumal-theme-settings__row" :class="{ 'is-disabled': !availability.tabbarCache }">
      <span>持久化标签</span>
      <ElSwitch :model-value="preferences.tabbar.persist" :disabled="!availability.tabbarCache" aria-label="持久化标签" @update:model-value="emit('update', { tabbar: { persist: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.visitHistory" class="lumal-theme-settings__row">
      <span>记录访问历史</span>
      <ElSwitch :model-value="preferences.tabbar.visitHistory" aria-label="记录访问历史" @update:model-value="emit('update', { tabbar: { visitHistory: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.draggable" class="lumal-theme-settings__row">
      <span>允许拖拽排序</span>
      <ElSwitch :model-value="preferences.tabbar.draggable" aria-label="允许拖拽排序" @update:model-value="emit('update', { tabbar: { draggable: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.wheelable" class="lumal-theme-settings__row">
      <span>滚轮切换</span>
      <ElSwitch :model-value="preferences.tabbar.wheelable" aria-label="滚轮切换" @update:model-value="emit('update', { tabbar: { wheelable: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.middleClickToClose" class="lumal-theme-settings__row">
      <span>中键关闭</span>
      <ElSwitch :model-value="preferences.tabbar.middleClickToClose" aria-label="中键关闭" @update:model-value="emit('update', { tabbar: { middleClickToClose: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.showIcon" class="lumal-theme-settings__row">
      <span>显示标签图标</span>
      <ElSwitch :model-value="preferences.tabbar.showIcon" aria-label="显示标签图标" @update:model-value="emit('update', { tabbar: { showIcon: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.showMore" class="lumal-theme-settings__row">
      <span>显示更多按钮</span>
      <ElSwitch :model-value="preferences.tabbar.showMore" aria-label="显示更多按钮" @update:model-value="emit('update', { tabbar: { showMore: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.showRefresh" class="lumal-theme-settings__row">
      <span>显示刷新按钮</span>
      <ElSwitch :model-value="preferences.tabbar.showRefresh" aria-label="显示刷新按钮" @update:model-value="emit('update', { tabbar: { showRefresh: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.showMaximize" class="lumal-theme-settings__row">
      <span>显示最大化按钮</span>
      <ElSwitch :model-value="preferences.tabbar.showMaximize" aria-label="显示最大化按钮" @update:model-value="emit('update', { tabbar: { showMaximize: Boolean($event) } })" />
    </div>
    <div v-if="visibility.tabbar.styleType" class="lumal-theme-settings__row is-stacked" :class="{ 'is-disabled': !availability.tabbarCache }">
      <span>标签风格</span>
      <div class="lumal-theme-settings__segments lumal-theme-settings__tab-style">
        <button
          v-for="item in tabStyleOptions"
          :key="item.value"
          type="button"
          :disabled="!availability.tabbarCache"
          :aria-pressed="preferences.tabbar.styleType === item.value"
          :class="{ 'is-active': preferences.tabbar.styleType === item.value }"
          @click="emit('update', { tabbar: { styleType: item.value } })"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
    <div v-if="visibility.tabbar.maxCount" class="lumal-theme-settings__row">
      <span>最大标签数（0 为不限制）</span>
      <ElInputNumber :model-value="preferences.tabbar.maxCount" :min="0" :max="30" aria-label="最大标签数" @update:model-value="emit('update', { tabbar: { maxCount: Number($event ?? 0) } })" />
    </div>
  </section>
</template>
