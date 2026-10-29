<script setup lang="ts">
import type { ThemeColorPreset } from './theme-color-presets'
import type { LumalPreferences, LumalPreferencesDefaults, LumalPreferencesVisibility } from './types'
import { LumalIcon } from '@lumal/icons-vue'
import { ElButton, ElScrollbar } from 'element-plus'
import { computed, shallowRef, useId, useTemplateRef } from 'vue'
import LumalThemeSettingsAppearance from './LumalThemeSettingsAppearance.vue'
import LumalThemeSettingsCommon from './LumalThemeSettingsCommon.vue'
import LumalThemeSettingsLayout from './LumalThemeSettingsLayout.vue'
import { createDefaultPreferences, mergePreferences, resolvePreferenceAvailability, resolvePreferenceVisibility } from './preferences'
import { themeColorPresets } from './theme-color-presets'

/***********************属性与事件*********************/
const props = withDefaults(defineProps<{
  colorPresets?: ThemeColorPreset[]
  defaults?: LumalPreferencesDefaults
  showLayout?: boolean
  showReset?: boolean
  visibility?: LumalPreferencesVisibility
}>(), {
  colorPresets: () => themeColorPresets,
  showLayout: true,
  showReset: true,
})

const emit = defineEmits<{
  change: [preferences: LumalPreferences]
  reset: [preferences: LumalPreferences]
}>()
const preferences = defineModel<LumalPreferences>('preferences', { required: true })

/***********************分类与显隐*********************/
type SettingsTab = 'common' | 'layout' | 'theme'
const selectedTab = shallowRef<SettingsTab>('theme')
const panelId = `lumal-theme-settings-${useId()}`
const tabButtons = useTemplateRef<HTMLButtonElement[]>('tabButtons')
const visibility = computed(() => resolvePreferenceVisibility(props.visibility))
const availability = computed(() => resolvePreferenceAvailability(preferences.value))
const settingsTabs = computed(() => {
  const visible = visibility.value
  return [
    { label: '外观', value: 'theme' as const, visible: Object.values(visible.theme).some(Boolean) },
    {
      label: '布局',
      value: 'layout' as const,
      visible: props.showLayout && (
        visible.app.layout || visible.header.menuAlign || visible.header.menuMaxWidth
        || Object.values(visible.sidebar).some(Boolean) || Object.values(visible.tabbar).some(Boolean)
      ),
    },
    {
      label: '通用',
      value: 'common' as const,
      visible: visible.app.dynamicTitle || visible.header.globalSearch
        || Object.values(visible.shortcutKeys).some(Boolean)
        || Object.values(visible.breadcrumb).some(Boolean) || Object.values(visible.transition).some(Boolean),
    },
  ].filter(tab => tab.visible)
})
// 显隐配置改变后从现有页签派生当前页，不保留指向空页签的状态。
const activeTab = computed(() => settingsTabs.value.find(tab => tab.value === selectedTab.value)?.value ?? settingsTabs.value[0]?.value)

/***********************偏好更新与重置*********************/
function update(patch: LumalPreferencesDefaults): void {
  const next = mergePreferences(preferences.value, patch, props.defaults)
  preferences.value = next
  emit('change', next)
}

function resetPreferences(): void {
  const next = createDefaultPreferences(props.defaults)
  preferences.value = next
  selectedTab.value = 'theme'
  emit('change', next)
  emit('reset', next)
}

/***********************分类键盘导航*********************/
function handleTabKeydown(event: KeyboardEvent): void {
  const tabs = settingsTabs.value
  const currentIndex = tabs.findIndex(tab => tab.value === activeTab.value)
  let nextIndex = currentIndex

  switch (event.key) {
    case 'ArrowRight':
      nextIndex = (currentIndex + 1) % tabs.length
      break
    case 'ArrowLeft':
      nextIndex = (currentIndex + tabs.length - 1) % tabs.length
      break
    case 'Home':
      nextIndex = 0
      break
    case 'End':
      nextIndex = tabs.length - 1
      break
    default:
      return
  }

  event.preventDefault()
  selectedTab.value = tabs[nextIndex]!.value
  tabButtons.value?.find(button => button.id === `${panelId}-tab-${selectedTab.value}`)?.focus()
}
</script>

<template>
  <div class="lumal-theme-settings">
    <div
      v-if="settingsTabs.length"
      class="lumal-theme-settings__tabs"
      role="tablist"
      aria-label="偏好设置分类"
      :style="{ gridTemplateColumns: `repeat(${settingsTabs.length}, minmax(0, 1fr))` }"
      @keydown="handleTabKeydown"
    >
      <button
        v-for="tab in settingsTabs"
        :id="`${panelId}-tab-${tab.value}`"
        :key="tab.value"
        ref="tabButtons"
        type="button"
        role="tab"
        class="lumal-theme-settings__tab"
        :class="{ 'is-active': activeTab === tab.value }"
        :aria-selected="activeTab === tab.value"
        :aria-controls="`${panelId}-pane-${tab.value}`"
        :tabindex="activeTab === tab.value ? 0 : -1"
        @click="selectedTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <ElScrollbar
      v-if="settingsTabs.length"
      class="lumal-theme-settings__scroll"
      view-class="lumal-theme-settings__scroll-view"
    >
      <div
        v-for="tab in settingsTabs"
        v-show="activeTab === tab.value"
        :id="`${panelId}-pane-${tab.value}`"
        :key="tab.value"
        class="lumal-theme-settings__pane"
        role="tabpanel"
        :aria-labelledby="`${panelId}-tab-${tab.value}`"
      >
        <LumalThemeSettingsAppearance
          v-if="tab.value === 'theme'"
          :preferences="preferences"
          :visibility="visibility"
          :color-presets="colorPresets"
          @update="update"
        />
        <LumalThemeSettingsLayout
          v-else-if="tab.value === 'layout'"
          :preferences="preferences"
          :visibility="visibility"
          :availability="availability"
          @update="update"
        />
        <LumalThemeSettingsCommon v-else :preferences="preferences" :visibility="visibility" @update="update" />
      </div>
    </ElScrollbar>
    <div v-else class="lumal-theme-settings__empty" role="status">
      暂无可配置项
    </div>

    <div v-if="showReset && settingsTabs.length" class="lumal-theme-settings__actions">
      <ElButton class="lumal-theme-settings__reset" plain @click="resetPreferences">
        <LumalIcon name="lumal:reset" :size="16" />
        恢复默认
      </ElButton>
    </div>
  </div>
</template>

<style lang="scss">
/* 三类展示组件共用样式，选择器统一使用面板前缀。 */
.lumal-theme-settings {
  container-type: inline-size;
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  font-size: var(--lumal-font-size-base, 14px);
  letter-spacing: 0;
}

.lumal-theme-settings__tabs {
  display: grid;
  flex: none;
  gap: 4px;
  margin-top: 16px;
  padding: 4px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.lumal-theme-settings__tab {
  min-width: 0;
  min-height: 36px;
  padding: 4px 8px;
  border: 0;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  font: inherit;
  font-weight: 500;
  transition: color .2s, background-color .2s, box-shadow .2s;
}

.lumal-theme-settings__tab:hover {
  color: var(--el-text-color-primary);
}

.lumal-theme-settings__tab.is-active {
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-color-black) 8%, transparent);
}

.lumal-theme-settings__scroll {
  flex: 1;
  min-height: 0;
}

/* 将留白放在内容视图内，避免挤占滚动条轨道。 */
.lumal-theme-settings__scroll-view {
  padding: 24px 8px;
}

.lumal-theme-settings__pane {
  display: grid;
  gap: 28px;
}

.lumal-theme-settings__section {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.lumal-theme-settings__section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
  font-size: calc(var(--lumal-font-size-base, 14px) + 1px);
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
}

.lumal-theme-settings__section-title::after {
  height: 1px;
  flex: 1;
  content: '';
  background: var(--el-border-color-lighter);
}

.lumal-theme-settings__row {
  display: flex;
  min-width: 0;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: inherit;
  line-height: 1.5;
  transition: background-color .2s;
}

.lumal-theme-settings__row:not(.is-disabled):hover {
  background: var(--el-fill-color-light);
}

.lumal-theme-settings__row > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

/* 保留组件默认宽度，避免加减按钮挤占数字显示区域。 */
.lumal-theme-settings__row .el-switch,
.lumal-theme-settings__row .el-input-number {
  flex: none;
}

.lumal-theme-settings__row.is-stacked {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  row-gap: 4px;
}

.lumal-theme-settings__row.is-stacked > span {
  grid-column: 1 / -1;
}

.lumal-theme-settings__row.is-disabled {
  opacity: .5;
}

.lumal-theme-settings__card-grid,
.lumal-theme-settings__layout-grid,
.lumal-theme-settings__transition-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.lumal-theme-settings__transition-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.lumal-theme-settings__mode-card,
.lumal-theme-settings__layout-card,
.lumal-theme-settings__transition-card,
.lumal-theme-settings__color-card {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  border: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  font: inherit;
}

.lumal-theme-settings__option-label {
  max-width: 100%;
  color: inherit;
  font-size: max(12px, calc(var(--lumal-font-size-base, 14px) - 2px));
  line-height: 1.5;
  text-align: center;
  overflow-wrap: anywhere;
}

.lumal-theme-settings__mode-preview,
.lumal-theme-settings__layout-frame,
.lumal-theme-settings__transition-preview {
  display: grid;
  box-sizing: border-box;
  width: 100%;
  height: 64px;
  flex: none;
  place-items: center;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  transition: border-color .2s, color .2s, background-color .2s;
}

.lumal-theme-settings__mode-preview {
  height: 44px;
}

.lumal-theme-settings__mode-card:hover,
.lumal-theme-settings__layout-card:hover,
.lumal-theme-settings__transition-card:not(:disabled):hover,
.lumal-theme-settings__color-card:hover {
  color: var(--el-text-color-primary);
}

.lumal-theme-settings__mode-card:hover .lumal-theme-settings__mode-preview,
.lumal-theme-settings__layout-card:hover .lumal-theme-settings__layout-frame,
.lumal-theme-settings__transition-card:not(:disabled):hover .lumal-theme-settings__transition-preview {
  border-color: var(--el-color-primary-light-5);
}

.lumal-theme-settings__mode-card.is-active,
.lumal-theme-settings__layout-card.is-active,
.lumal-theme-settings__transition-card.is-active,
.lumal-theme-settings__color-card.is-active {
  color: var(--el-text-color-primary);
}

.lumal-theme-settings__mode-card.is-active .lumal-theme-settings__mode-preview,
.lumal-theme-settings__layout-card.is-active .lumal-theme-settings__layout-frame,
.lumal-theme-settings__transition-card.is-active .lumal-theme-settings__transition-preview {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: inset 0 0 0 1px var(--el-color-primary);
}

.lumal-theme-settings__mode-card:focus-visible,
.lumal-theme-settings__layout-card:focus-visible,
.lumal-theme-settings__transition-card:focus-visible,
.lumal-theme-settings__color-card:focus-visible,
.lumal-theme-settings__color-card.is-custom:focus-within,
.lumal-theme-settings__tab:focus-visible,
.lumal-theme-settings__radius-grid button:focus-visible,
.lumal-theme-settings__segments button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 3px;
  border-radius: 6px;
}

.lumal-theme-settings__color-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 12px;
  // 留出选中边框与键盘焦点框的绘制空间。
  padding: 4px;
}

.lumal-theme-settings__color-card {
  position: relative;
}

.lumal-theme-settings__color-preview {
  display: grid;
  box-sizing: border-box;
  width: min(100%, 44px);
  height: 40px;
  flex: none;
  place-items: center;
  border: 3px solid var(--el-bg-color);
  border-radius: 6px;
  color: var(--el-color-white);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter);
  transition: box-shadow .2s;
}

.lumal-theme-settings__color-card:hover .lumal-theme-settings__color-preview,
.lumal-theme-settings__color-card.is-active .lumal-theme-settings__color-preview {
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

.lumal-theme-settings__color-card.is-active .lumal-theme-settings__color-preview {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

.lumal-theme-settings__color-card.is-active .lumal-theme-settings__option-label {
  font-weight: 600;
}

.lumal-theme-settings__color-preview.is-custom {
  color: var(--el-text-color-regular);
  background: var(--el-fill-color);
}

.lumal-theme-settings__color-card.is-active .lumal-theme-settings__color-preview.is-custom {
  color: var(--el-color-white);
}

.lumal-theme-settings__color-card input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.lumal-theme-settings__radius-grid,
.lumal-theme-settings__segments {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}

.lumal-theme-settings__radius-grid button,
.lumal-theme-settings__segments button {
  min-width: 0;
  min-height: 36px;
  padding: 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-bg-color);
  font: inherit;
  transition: border-color .2s, color .2s, background-color .2s;
}

.lumal-theme-settings__radius-grid button:hover,
.lumal-theme-settings__segments button:not(:disabled):hover {
  border-color: var(--el-color-primary-light-5);
}

.lumal-theme-settings__radius-grid button.is-active,
.lumal-theme-settings__segments button.is-active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.lumal-theme-settings__segments {
  grid-column: 1 / -1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.lumal-theme-settings__tab-style {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.lumal-theme-settings__layout-frame {
  padding: 8px;
}

.lumal-theme-settings__layout-preview {
  display: block;
  width: 100%;
  max-height: 48px;
}

.lumal-theme-settings__layout-preview rect {
  fill: var(--el-fill-color);
  stroke: var(--el-border-color-lighter);
  stroke-width: 1;
}

.lumal-theme-settings__layout-preview rect.is-background {
  fill: var(--el-bg-color);
}

.lumal-theme-settings__layout-preview rect.is-medium {
  fill: var(--el-color-primary-light-7);
  stroke: var(--el-color-primary-light-5);
}

.lumal-theme-settings__layout-preview rect.is-strong {
  fill: var(--el-color-primary-light-5);
  stroke: var(--el-color-primary-light-3);
}

.lumal-theme-settings__transition-preview {
  position: relative;
  height: 48px;
  overflow: hidden;
}

.lumal-theme-settings__transition-preview i {
  position: absolute;
  inset: 12px 18px;
  border-radius: 3px;
  background: var(--el-color-primary-light-5);
  opacity: .3;
}

.lumal-theme-settings__transition-preview i:last-child {
  opacity: 1;
}

.lumal-theme-settings__transition-card:not(:disabled):is(:hover, :focus-visible).is-fade-side i:last-child {
  animation: lumal-settings-side 1.2s infinite;
}

.lumal-theme-settings__transition-card:not(:disabled):is(:hover, :focus-visible).is-fade i:last-child {
  animation: lumal-settings-fade 1.2s infinite;
}

.lumal-theme-settings__transition-card:not(:disabled):is(:hover, :focus-visible).is-fade-bottom i:last-child {
  animation: lumal-settings-bottom 1.2s infinite;
}

.lumal-theme-settings__transition-card:not(:disabled):is(:hover, :focus-visible).is-zoom-fade i:last-child {
  animation: lumal-settings-zoom 1.2s infinite;
}

.lumal-theme-settings__transition-card:disabled,
.lumal-theme-settings__segments button:disabled {
  cursor: not-allowed;
  opacity: .5;
}

.lumal-theme-settings__actions {
  flex: none;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.lumal-theme-settings__reset {
  width: 100%;
  min-height: 36px;
  gap: 8px;
}

.lumal-theme-settings__empty {
  display: grid;
  flex: 1;
  padding: 32px 16px;
  place-items: center;
  color: var(--el-text-color-secondary);
}

@keyframes lumal-settings-side {
  0%, 20%, 100% { opacity: 0; transform: translateX(-10px); }
  40%, 80% { opacity: 1; transform: translateX(0); }
}

@keyframes lumal-settings-fade {
  0%, 20%, 100% { opacity: 0; }
  40%, 80% { opacity: 1; }
}

@keyframes lumal-settings-bottom {
  0%, 20%, 100% { opacity: 0; transform: translateY(8px); }
  40%, 80% { opacity: 1; transform: translateY(0); }
}

@keyframes lumal-settings-zoom {
  0%, 20%, 100% { opacity: 0; transform: scale(.82); }
  40%, 80% { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .lumal-theme-settings *,
  .lumal-theme-settings *::before,
  .lumal-theme-settings *::after {
    animation: none !important;
    transition-duration: .01ms !important;
  }
}

@container (max-width: 320px) {
  .lumal-theme-settings__transition-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lumal-theme-settings__tab-style { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
