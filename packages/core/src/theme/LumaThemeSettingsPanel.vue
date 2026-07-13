<script setup lang="ts">
import type { LumaHeaderMenuAlign, LumaLayoutMode, LumaPreferences, LumaPreferencesDefaults, LumaTabStyle, LumaTransitionName, ThemeMode } from './types'
import { LumaIcon } from '@luma/icons'
import { ElButton, ElInputNumber, ElSlider, ElSwitch } from 'element-plus'
import { computed, ref } from 'vue'
import { createDefaultPreferences, mergePreferences, resolvePreferenceAvailability } from './preferences'
import { themeColorPresets } from './theme-color-presets'

const props = withDefaults(defineProps<{
  colorPresets?: { label: string, value: string, custom?: boolean }[]
  defaults?: LumaPreferencesDefaults
  showLayout?: boolean
}>(), {
  colorPresets: () => themeColorPresets,
  showLayout: true,
})

const emit = defineEmits<{
  change: [preferences: LumaPreferences]
  reset: [preferences: LumaPreferences]
}>()
const preferences = defineModel<LumaPreferences>('preferences', { required: true })
const activeTab = ref<'common' | 'layout' | 'theme'>('theme')

const themeModeOptions: { icon: string, label: string, value: ThemeMode }[] = [
  { icon: 'luma:sun', label: '浅色', value: 'light' },
  { icon: 'luma:moon', label: '深色', value: 'dark' },
  { icon: 'luma:monitor', label: '跟随系统', value: 'system' },
]
const layoutModeOptions: { label: string, value: LumaLayoutMode }[] = [
  { label: '侧边导航', value: 'sidebar-nav' },
  { label: '顶部导航', value: 'top-nav' },
  { label: '混合导航', value: 'mixed-nav' },
]
const transitionOptions: { label: string, value: LumaTransitionName }[] = [
  { label: '侧滑', value: 'fade-side' },
  { label: '淡入', value: 'fade' },
  { label: '底部', value: 'fade-bottom' },
  { label: '缩放', value: 'zoom-fade' },
]
const tabStyleOptions: { label: string, value: LumaTabStyle }[] = [
  { label: 'Chrome', value: 'chrome' },
  { label: '朴素', value: 'plain' },
  { label: '卡片', value: 'card' },
  { label: '动效', value: 'brisk' },
]
const radiusOptions = [0, 0.25, 0.5, 0.75, 1]
const alignOptions: { label: string, value: LumaHeaderMenuAlign }[] = [
  { label: '左侧', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右侧', value: 'right' },
]

const presetColors = computed(() => props.colorPresets.filter(item => !item.custom))
const customColorActive = computed(() => !presetColors.value.some(item => item.value === preferences.value.theme.colorPrimary))
const settingsTabs = computed(() => [
  { label: '外观', value: 'theme' as const },
  ...(props.showLayout ? [{ label: '布局', value: 'layout' as const }] : []),
  { label: '通用', value: 'common' as const },
])
const availability = computed(() => resolvePreferenceAvailability(preferences.value))

function update(patch: Parameters<typeof mergePreferences>[1]): void {
  const next = mergePreferences(preferences.value, patch, props.defaults)
  preferences.value = next
  emit('change', next)
}

function resetPreferences(): void {
  const next = createDefaultPreferences(props.defaults)
  preferences.value = next
  activeTab.value = 'theme'
  emit('change', next)
  emit('reset', next)
}

function setColor(color: string): void {
  update({ theme: { colorPrimary: color } })
}
</script>

<template>
  <div class="luma-theme-settings">
    <div
      class="luma-theme-settings__tabs"
      role="tablist"
      aria-label="偏好设置分类"
      :style="{ gridTemplateColumns: `repeat(${settingsTabs.length}, minmax(0, 1fr))` }"
    >
      <button
        v-for="tab in settingsTabs"
        :key="tab.value" type="button" role="tab" class="luma-theme-settings__tab"
        :class="{ 'is-active': activeTab === tab.value }" :aria-selected="activeTab === tab.value"
        @click="activeTab = tab.value as typeof activeTab"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="luma-theme-settings__scroll">
      <div v-show="activeTab === 'common'" class="luma-theme-settings__pane" role="tabpanel">
        <section class="luma-theme-settings__section">
          <h4>页面反馈</h4>
          <div class="luma-theme-settings__row">
            <span>页面切换进度条</span><ElSwitch :model-value="preferences.transition.progress" @update:model-value="update({ transition: { progress: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>页面切换 Loading</span><ElSwitch :model-value="preferences.transition.loading" @update:model-value="update({ transition: { loading: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>页面切换动画</span><ElSwitch :model-value="preferences.transition.enable" @update:model-value="update({ transition: { enable: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__transition-grid">
            <button
              v-for="item in transitionOptions" :key="item.value" type="button"
              class="luma-theme-settings__transition-card" :class="[{ 'is-active': preferences.transition.name === item.value }, `is-${item.value}`]"
              :disabled="!preferences.transition.enable" :aria-pressed="preferences.transition.name === item.value"
              @click="update({ transition: { name: item.value } })"
            >
              <span class="luma-theme-settings__transition-preview"><i /><i /></span><span>{{ item.label }}</span>
            </button>
          </div>
        </section>
      </div>

      <div v-show="activeTab === 'theme'" class="luma-theme-settings__pane" role="tabpanel">
        <section class="luma-theme-settings__section">
          <h4>主题模式</h4>
          <div class="luma-theme-settings__card-grid is-three">
            <button
              v-for="item in themeModeOptions" :key="item.value" type="button" class="luma-theme-settings__mode-card"
              :class="{ 'is-active': preferences.theme.mode === item.value }" :aria-pressed="preferences.theme.mode === item.value"
              @click="update({ theme: { mode: item.value } })"
            >
              <LumaIcon class="luma-theme-settings__mode-icon" :name="item.icon" :size="24" /><span>{{ item.label }}</span>
            </button>
          </div>
        </section>
        <section class="luma-theme-settings__section">
          <h4>内置主题</h4>
          <div class="luma-theme-settings__color-grid">
            <button
              v-for="preset in presetColors" :key="preset.value" type="button" class="luma-theme-settings__color-card"
              :class="{ 'is-active': preferences.theme.colorPrimary === preset.value }" :aria-label="preset.label"
              @click="setColor(preset.value)"
            >
              <i :style="{ backgroundColor: preset.value }" /><span>{{ preset.label }}</span>
            </button>
            <label class="luma-theme-settings__color-card" :class="{ 'is-active': customColorActive }">
              <i class="is-custom" /><span>自定义</span><input type="color" :value="preferences.theme.colorPrimary" aria-label="自定义主题色" @input="setColor(($event.target as HTMLInputElement).value)">
            </label>
          </div>
        </section>
        <section class="luma-theme-settings__section">
          <h4>圆角</h4>
          <div class="luma-theme-settings__radius-grid">
            <button v-for="value in radiusOptions" :key="value" type="button" :class="{ 'is-active': preferences.theme.radiusScale === value }" @click="update({ theme: { radiusScale: value } })">
              {{ value }}
            </button>
          </div>
        </section>
      </div>

      <div v-show="activeTab === 'layout'" class="luma-theme-settings__pane" role="tabpanel">
        <section v-if="showLayout" class="luma-theme-settings__section">
          <h4>布局模式</h4>
          <div class="luma-theme-settings__layout-grid">
            <button
              v-for="item in layoutModeOptions" :key="item.value" type="button" class="luma-theme-settings__layout-card"
              :class="[{ 'is-active': preferences.app.layout === item.value }, `is-${item.value}`]"
              :aria-pressed="preferences.app.layout === item.value" @click="update({ app: { layout: item.value } })"
            >
              <svg class="luma-theme-settings__layout-preview" viewBox="0 0 160 92" aria-hidden="true" focusable="false">
                <rect class="is-background" x="1" y="1" width="158" height="90" rx="10" />
                <template v-if="item.value === 'sidebar-nav'">
                  <rect class="is-strong" x="8" y="8" width="30" height="76" rx="6" />
                  <rect x="46" y="12" width="106" height="14" rx="5" />
                  <rect x="46" y="36" width="49" height="40" rx="6" />
                  <rect x="103" y="36" width="49" height="40" rx="6" />
                </template>
                <template v-else-if="item.value === 'top-nav'">
                  <rect class="is-strong" x="8" y="8" width="144" height="14" rx="6" />
                  <rect x="8" y="32" width="144" height="14" rx="5" />
                  <rect x="8" y="56" width="68" height="24" rx="6" />
                  <rect x="84" y="56" width="68" height="24" rx="6" />
                </template>
                <template v-else>
                  <rect class="is-strong" x="8" y="8" width="144" height="14" rx="6" />
                  <rect class="is-medium" x="8" y="28" width="26" height="56" rx="6" />
                  <rect x="44" y="32" width="108" height="14" rx="5" />
                  <rect x="44" y="56" width="50" height="24" rx="6" />
                  <rect x="102" y="56" width="50" height="24" rx="6" />
                </template>
              </svg><span>{{ item.label }}</span>
            </button>
          </div>
        </section>
        <section class="luma-theme-settings__section">
          <h4>顶栏</h4>
          <div class="luma-theme-settings__row is-stacked" :class="{ 'is-disabled': !availability.headerMenuAlign }">
            <span>菜单位置</span>
            <div class="luma-theme-settings__segments">
              <button v-for="item in alignOptions" :key="item.value" type="button" :disabled="!availability.headerMenuAlign" :aria-pressed="preferences.header.menuAlign === item.value" :class="{ 'is-active': preferences.header.menuAlign === item.value }" @click="update({ header: { menuAlign: item.value } })">
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="luma-theme-settings__row is-stacked" :class="{ 'is-disabled': !availability.headerMenuMaxWidth }">
            <span>菜单最大宽度</span><ElSlider :model-value="preferences.header.menuMaxWidth" :disabled="!availability.headerMenuMaxWidth" :min="480" :max="1440" :step="40" @update:model-value="update({ header: { menuMaxWidth: Number($event) } })" /><ElInputNumber :model-value="preferences.header.menuMaxWidth" :disabled="!availability.headerMenuMaxWidth" :min="480" :max="1440" :step="40" @update:model-value="update({ header: { menuMaxWidth: Number($event) } })" />
          </div>
        </section>
        <section class="luma-theme-settings__section">
          <h4>侧边栏</h4>
          <div class="luma-theme-settings__row">
            <span>显示侧边栏</span><ElSwitch :model-value="preferences.sidebar.enable" @update:model-value="update({ sidebar: { enable: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>折叠菜单</span><ElSwitch :model-value="preferences.sidebar.collapsed" :disabled="!availability.sidebarCollapsed" @update:model-value="update({ sidebar: { collapsed: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row is-stacked" :class="{ 'is-disabled': !availability.sidebarWidth }">
            <span>宽度</span><ElSlider :model-value="preferences.sidebar.width" :disabled="!availability.sidebarWidth" :min="200" :max="320" :step="8" @update:model-value="update({ sidebar: { width: Number($event) } })" /><ElInputNumber :model-value="preferences.sidebar.width" :disabled="!availability.sidebarWidth" :min="200" :max="320" :step="8" @update:model-value="update({ sidebar: { width: Number($event) } })" />
          </div>
        </section>
        <section class="luma-theme-settings__section">
          <h4>标签栏</h4>
          <div class="luma-theme-settings__row">
            <span>启用标签栏</span><ElSwitch :model-value="preferences.tabbar.enable" @update:model-value="update({ tabbar: { enable: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>页面缓存</span><ElSwitch :model-value="preferences.tabbar.cache" :disabled="!availability.tabbarCache" @update:model-value="update({ tabbar: { cache: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>持久化标签</span><ElSwitch :model-value="preferences.tabbar.persist" :disabled="!availability.tabbarCache" @update:model-value="update({ tabbar: { persist: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>记录访问历史</span><ElSwitch :model-value="preferences.tabbar.visitHistory" @update:model-value="update({ tabbar: { visitHistory: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>允许拖拽排序</span><ElSwitch :model-value="preferences.tabbar.draggable" @update:model-value="update({ tabbar: { draggable: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>滚轮切换</span><ElSwitch :model-value="preferences.tabbar.wheelable" @update:model-value="update({ tabbar: { wheelable: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>中键关闭</span><ElSwitch :model-value="preferences.tabbar.middleClickToClose" @update:model-value="update({ tabbar: { middleClickToClose: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>显示标签图标</span><ElSwitch :model-value="preferences.tabbar.showIcon" @update:model-value="update({ tabbar: { showIcon: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>显示更多按钮</span><ElSwitch :model-value="preferences.tabbar.showMore" @update:model-value="update({ tabbar: { showMore: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>显示最大化按钮</span><ElSwitch :model-value="preferences.tabbar.showMaximize" @update:model-value="update({ tabbar: { showMaximize: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row is-stacked">
            <span>标签风格</span>
            <div class="luma-theme-settings__segments luma-theme-settings__tab-style">
              <button
                v-for="item in tabStyleOptions"
                :key="item.value"
                type="button"
                :disabled="!availability.tabbarCache"
                :aria-pressed="preferences.tabbar.styleType === item.value"
                :class="{ 'is-active': preferences.tabbar.styleType === item.value }"
                @click="update({ tabbar: { styleType: item.value } })"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="luma-theme-settings__row">
            <span>最大标签数（0 为不限制）</span><ElInputNumber :model-value="preferences.tabbar.maxCount" :min="0" :max="30" @update:model-value="update({ tabbar: { maxCount: Number($event ?? 0) } })" />
          </div>
        </section>
      </div>
    </div>

    <div class="luma-theme-settings__actions">
      <ElButton class="luma-theme-settings__reset" plain @click="resetPreferences">
        <LumaIcon name="luma:reset" :size="16" />恢复默认
      </ElButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.luma-theme-settings { container-type: inline-size; display: flex; height: 100%; min-height: 0; flex-direction: column; overflow: hidden; color: var(--el-text-color-primary); }
.luma-theme-settings__tabs { display: grid; grid-template-columns: repeat(3, 1fr); flex: none; gap: 4px; margin-top: 12px; padding: 4px; border: 1px solid var(--el-border-color-lighter); border-radius: 9px; background: var(--el-fill-color); }
.luma-theme-settings__tab { min-height: 34px; padding: 0 8px; border: 0; border-radius: 6px; color: var(--el-text-color-secondary); cursor: pointer; background: transparent; font-size: 13px; font-weight: 600; transition: color .2s, background-color .2s, box-shadow .2s; }
.luma-theme-settings__tab:hover { color: var(--el-text-color-primary); }
.luma-theme-settings__tab.is-active { color: var(--el-color-primary); background: var(--el-bg-color); box-shadow: 0 1px 3px color-mix(in srgb, var(--el-color-black) 12%, transparent); }
.luma-theme-settings__scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 4px 22px; scrollbar-width: thin; }
.luma-theme-settings__pane { display: grid; gap: 26px; }
.luma-theme-settings__section { display: grid; gap: 12px; }
.luma-theme-settings__section + .luma-theme-settings__section { padding-top: 0; border-top: 0; }
h4 { margin: 0; color: var(--el-text-color-primary); font-size: 14px; font-weight: 700; letter-spacing: .01em; }
.luma-theme-settings__row { display: flex; min-height: 34px; align-items: center; justify-content: space-between; gap: 12px; padding: 0 4px; font-size: 13px; }
.luma-theme-settings__row.is-stacked { display: grid; grid-template-columns: 1fr auto; }
.luma-theme-settings__row.is-stacked :deep(.el-slider) { grid-column: 1; width: 100%; }
.luma-theme-settings__row.is-stacked :deep(.el-input-number) { grid-column: 2; grid-row: 2; width: 112px; }
.is-disabled { opacity: .48; }
.luma-theme-settings__card-grid, .luma-theme-settings__layout-grid, .luma-theme-settings__transition-grid { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.luma-theme-settings__card-grid.is-three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.luma-theme-settings__layout-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.luma-theme-settings__transition-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
button { font: inherit; }
.luma-theme-settings__mode-card, .luma-theme-settings__layout-card, .luma-theme-settings__transition-card { display: flex; min-width: 0; min-height: 62px; align-items: center; justify-content: center; flex-direction: column; gap: 6px; padding: 8px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; color: var(--el-text-color-secondary); cursor: pointer; background: var(--el-bg-color); box-shadow: 0 1px 2px color-mix(in srgb, var(--el-color-black) 4%, transparent); transition: border-color .2s, color .2s, background-color .2s, box-shadow .2s; }
.luma-theme-settings__mode-card:hover, .luma-theme-settings__layout-card:hover, .luma-theme-settings__transition-card:hover { border-color: var(--el-color-primary-light-5); color: var(--el-text-color-primary); box-shadow: 0 3px 8px color-mix(in srgb, var(--el-color-black) 8%, transparent); }
.luma-theme-settings__mode-card.is-active, .luma-theme-settings__layout-card.is-active, .luma-theme-settings__transition-card.is-active { border-color: var(--el-color-primary); color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 30%, transparent); }
.luma-theme-settings__mode-card:focus-visible, .luma-theme-settings__layout-card:focus-visible, .luma-theme-settings__transition-card:focus-visible, .luma-theme-settings__tab:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
.luma-theme-settings__mode-icon { flex: none; }
.luma-theme-settings__mode-card > span:last-child { white-space: nowrap; word-break: keep-all; }
.luma-theme-settings__color-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.luma-theme-settings__color-card { position: relative; display: flex; min-width: 0; min-height: 68px; align-items: center; justify-content: center; flex-direction: column; gap: 7px; padding: 8px 6px; overflow: hidden; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; color: var(--el-text-color-secondary); cursor: pointer; background: var(--el-bg-color); transition: border-color .2s, color .2s, background-color .2s, box-shadow .2s; }
.luma-theme-settings__color-card:hover { border-color: var(--el-color-primary-light-5); color: var(--el-text-color-primary); }
.luma-theme-settings__color-card.is-active { border-color: var(--el-color-primary); color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 25%, transparent); }
.luma-theme-settings__color-card i { width: 28px; height: 20px; flex: none; border-radius: 6px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-black) 8%, transparent); }
.luma-theme-settings__color-card i.is-custom { background: linear-gradient(135deg, #3b82f6, #8b5cf6 50%, #ef4444); }
.luma-theme-settings__color-card > span { min-width: 0; max-width: 100%; overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; word-break: keep-all; }
.luma-theme-settings__color-card input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.luma-theme-settings__radius-grid, .luma-theme-settings__segments { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.luma-theme-settings__radius-grid button, .luma-theme-settings__segments button { min-height: 32px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; color: var(--el-text-color-secondary); cursor: pointer; background: var(--el-bg-color); }
.luma-theme-settings__radius-grid button.is-active, .luma-theme-settings__segments button.is-active { border-color: var(--el-color-primary); color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.luma-theme-settings__segments { grid-column: 1 / -1; grid-template-columns: repeat(3, 1fr); }
.luma-theme-settings__tab-style { grid-template-columns: repeat(4, 1fr); }
.luma-theme-settings__layout-preview { width: 100%; max-height: 48px; color: var(--el-color-primary); }
.luma-theme-settings__layout-preview rect { fill: var(--el-fill-color); stroke: color-mix(in srgb, var(--el-border-color) 80%, transparent); stroke-width: 1; }
.luma-theme-settings__layout-preview rect.is-background { fill: var(--el-fill-color-lighter); }
.luma-theme-settings__layout-preview rect.is-medium { fill: var(--el-color-primary-light-7); stroke: var(--el-color-primary-light-5); }
.luma-theme-settings__layout-preview rect.is-strong { fill: var(--el-color-primary-light-5); stroke: var(--el-color-primary-light-3); }
.luma-theme-settings__transition-card { min-height: 64px; padding: 7px 4px; font-size: 12px; }
.luma-theme-settings__transition-preview { position: relative; width: 42px; height: 30px; border-radius: 6px; background: var(--el-fill-color-light); }
.luma-theme-settings__transition-preview i { position: absolute; inset: 7px 10px; border-radius: 5px; background: var(--el-color-primary-light-5); opacity: .3; }
.luma-theme-settings__transition-preview i:last-child { opacity: 1; }
.luma-theme-settings__transition-card:not(:disabled).is-fade-side i:last-child { animation: luma-settings-side 2.4s infinite; }
.luma-theme-settings__transition-card:not(:disabled).is-fade i:last-child { animation: luma-settings-fade 2.4s infinite; }
.luma-theme-settings__transition-card:not(:disabled).is-fade-bottom i:last-child { animation: luma-settings-bottom 2.4s infinite; }
.luma-theme-settings__transition-card:not(:disabled).is-zoom-fade i:last-child { animation: luma-settings-zoom 2.4s infinite; }
.luma-theme-settings__transition-card:disabled { cursor: not-allowed; opacity: .45; }
.luma-theme-settings__actions { flex: none; padding: 12px 4px 0; border-top: 1px solid var(--el-border-color-lighter); background: var(--el-bg-color-page); }
.luma-theme-settings__reset { width: 100%; min-height: 38px; gap: 8px; border-color: var(--el-border-color); background: var(--el-bg-color); }
@keyframes luma-settings-side { 0%, 20%, 100% { opacity: 0; transform: translateX(-10px); } 40%, 80% { opacity: 1; transform: translateX(0); } }
@keyframes luma-settings-fade { 0%, 20%, 100% { opacity: 0; } 40%, 80% { opacity: 1; } }
@keyframes luma-settings-bottom { 0%, 20%, 100% { opacity: 0; transform: translateY(8px); } 40%, 80% { opacity: 1; transform: translateY(0); } }
@keyframes luma-settings-zoom { 0%, 20%, 100% { opacity: 0; transform: scale(.82); } 40%, 80% { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .luma-theme-settings *, .luma-theme-settings *::before, .luma-theme-settings *::after { scroll-behavior: auto !important; animation: none !important; transition-duration: .01ms !important; } }
@container (max-width: 320px) { .luma-theme-settings__transition-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
