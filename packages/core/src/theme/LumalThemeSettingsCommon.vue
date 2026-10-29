<script setup lang="ts">
import type { LumalPreferences, LumalPreferencesDefaults, LumalTransitionName, ResolvedPreferenceVisibility } from './types'
import { ElSwitch } from 'element-plus'
import { computed } from 'vue'

/***********************属性与事件*********************/
const props = defineProps<{
  preferences: LumalPreferences
  visibility: ResolvedPreferenceVisibility
}>()

const emit = defineEmits<{
  update: [patch: LumalPreferencesDefaults]
}>()

/***********************分组与动画选项*********************/
const sections = computed(() => ({
  interface: props.visibility.app.dynamicTitle || props.visibility.header.globalSearch || props.visibility.shortcutKeys.globalSearch,
  breadcrumb: Object.values(props.visibility.breadcrumb).some(Boolean),
  transition: Object.values(props.visibility.transition).some(Boolean),
}))
const transitionOptions: { label: string, value: LumalTransitionName }[] = [
  { label: '侧滑', value: 'fade-side' },
  { label: '淡入', value: 'fade' },
  { label: '底部', value: 'fade-bottom' },
  { label: '缩放', value: 'zoom-fade' },
]
</script>

<template>
  <section v-if="sections.interface" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      界面功能
    </h4>
    <div v-if="visibility.app.dynamicTitle" class="lumal-theme-settings__row">
      <span>动态页面标题</span>
      <ElSwitch
        :model-value="preferences.app.dynamicTitle"
        aria-label="动态页面标题"
        @update:model-value="emit('update', { app: { dynamicTitle: Boolean($event) } })"
      />
    </div>
    <div v-if="visibility.header.globalSearch" class="lumal-theme-settings__row">
      <span>全局搜索</span>
      <ElSwitch
        :model-value="preferences.header.globalSearch"
        aria-label="全局搜索"
        @update:model-value="emit('update', { header: { globalSearch: Boolean($event) } })"
      />
    </div>
    <div v-if="visibility.shortcutKeys.globalSearch" class="lumal-theme-settings__row" :class="{ 'is-disabled': !preferences.header.globalSearch }">
      <span>搜索快捷键</span>
      <ElSwitch
        :model-value="preferences.shortcutKeys.globalSearch"
        :disabled="!preferences.header.globalSearch"
        aria-label="搜索快捷键"
        @update:model-value="emit('update', { shortcutKeys: { globalSearch: Boolean($event) } })"
      />
    </div>
  </section>

  <section v-if="sections.breadcrumb" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      面包屑
    </h4>
    <div v-if="visibility.breadcrumb.enable" class="lumal-theme-settings__row">
      <span>显示面包屑</span>
      <ElSwitch
        :model-value="preferences.breadcrumb.enable"
        aria-label="显示面包屑"
        @update:model-value="emit('update', { breadcrumb: { enable: Boolean($event) } })"
      />
    </div>
    <div v-if="visibility.breadcrumb.hideOnlyOne" class="lumal-theme-settings__row" :class="{ 'is-disabled': !preferences.breadcrumb.enable }">
      <span>仅一项时隐藏</span>
      <ElSwitch
        :model-value="preferences.breadcrumb.hideOnlyOne"
        :disabled="!preferences.breadcrumb.enable"
        aria-label="仅一项时隐藏"
        @update:model-value="emit('update', { breadcrumb: { hideOnlyOne: Boolean($event) } })"
      />
    </div>
    <div v-if="visibility.breadcrumb.showHome" class="lumal-theme-settings__row" :class="{ 'is-disabled': !preferences.breadcrumb.enable }">
      <span>显示首页</span>
      <ElSwitch
        :model-value="preferences.breadcrumb.showHome"
        :disabled="!preferences.breadcrumb.enable"
        aria-label="显示首页"
        @update:model-value="emit('update', { breadcrumb: { showHome: Boolean($event) } })"
      />
    </div>
    <div v-if="visibility.breadcrumb.showIcon" class="lumal-theme-settings__row" :class="{ 'is-disabled': !preferences.breadcrumb.enable }">
      <span>显示图标</span>
      <ElSwitch
        :model-value="preferences.breadcrumb.showIcon"
        :disabled="!preferences.breadcrumb.enable"
        aria-label="显示图标"
        @update:model-value="emit('update', { breadcrumb: { showIcon: Boolean($event) } })"
      />
    </div>
  </section>

  <section v-if="sections.transition" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      页面反馈
    </h4>
    <div v-if="visibility.transition.progress" class="lumal-theme-settings__row">
      <span>页面切换进度条</span>
      <ElSwitch
        :model-value="preferences.transition.progress"
        aria-label="页面切换进度条"
        @update:model-value="emit('update', { transition: { progress: Boolean($event) } })"
      />
    </div>
    <div v-if="visibility.transition.loading" class="lumal-theme-settings__row">
      <span>页面切换 Loading</span>
      <ElSwitch
        :model-value="preferences.transition.loading"
        aria-label="页面切换 Loading"
        @update:model-value="emit('update', { transition: { loading: Boolean($event) } })"
      />
    </div>
    <div v-if="visibility.transition.enable" class="lumal-theme-settings__row">
      <span>页面切换动画</span>
      <ElSwitch
        :model-value="preferences.transition.enable"
        aria-label="页面切换动画"
        @update:model-value="emit('update', { transition: { enable: Boolean($event) } })"
      />
    </div>
    <div v-if="visibility.transition.name" class="lumal-theme-settings__transition-grid">
      <button
        v-for="item in transitionOptions"
        :key="item.value"
        type="button"
        class="lumal-theme-settings__transition-card"
        :class="[{ 'is-active': preferences.transition.name === item.value }, `is-${item.value}`]"
        :disabled="!preferences.transition.enable"
        :aria-pressed="preferences.transition.name === item.value"
        @click="emit('update', { transition: { name: item.value } })"
      >
        <span class="lumal-theme-settings__transition-preview" aria-hidden="true"><i /><i /></span>
        <span class="lumal-theme-settings__option-label">{{ item.label }}</span>
      </button>
    </div>
  </section>
</template>
