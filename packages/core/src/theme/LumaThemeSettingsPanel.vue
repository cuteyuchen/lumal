<script setup lang="ts">
import type { LumaHeaderMenuAlign, LumaLayoutMode, LumaPreferences, LumaPreferencesDefaults, LumaTransitionName, ThemeMode } from './types'
import { ElButton, ElInputNumber, ElSlider, ElSwitch } from 'element-plus'
import { computed, ref } from 'vue'
import { createDefaultPreferences, mergePreferences } from './preferences'
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
const activeTab = ref<'common' | 'layout' | 'theme'>('common')

const themeModeOptions: { label: string, value: ThemeMode }[] = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'system' },
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
const radiusOptions = [0, 0.25, 0.5, 0.75, 1]
const alignOptions: { label: string, value: LumaHeaderMenuAlign }[] = [
  { label: '左侧', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右侧', value: 'right' },
]

const presetColors = computed(() => props.colorPresets.filter(item => !item.custom))
const customColorActive = computed(() => !presetColors.value.some(item => item.value === preferences.value.theme.colorPrimary))
const settingsTabs = computed(() => [
  { label: '通用', value: 'common' as const },
  { label: '主题', value: 'theme' as const },
  ...(props.showLayout ? [{ label: '布局', value: 'layout' as const }] : []),
])
const hasHeaderMenu = computed(() => preferences.value.app.layout !== 'sidebar-nav')
const hasSidebar = computed(() => preferences.value.app.layout !== 'top-nav' && preferences.value.sidebar.enable)
const hasTabbar = computed(() => preferences.value.tabbar.enable)

function update(patch: Parameters<typeof mergePreferences>[1]): void {
  const next = mergePreferences(preferences.value, patch, props.defaults)
  preferences.value = next
  emit('change', next)
}

function resetPreferences(): void {
  const next = createDefaultPreferences(props.defaults)
  preferences.value = next
  activeTab.value = 'common'
  emit('change', next)
  emit('reset', next)
}

function setColor(color: string): void {
  update({ theme: { colorPrimary: color } })
}
</script>

<template>
  <div class="luma-theme-settings">
    <div class="luma-theme-settings__tabs" role="tablist" aria-label="设置分类">
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
              <span class="luma-theme-settings__mode-icon" :class="`is-${item.value}`" aria-hidden="true"><i /></span><span>{{ item.label }}</span>
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
              <span class="luma-theme-settings__layout-preview"><i class="header" /><i class="sidebar" /><i class="content" /></span><span>{{ item.label }}</span>
            </button>
          </div>
        </section>
        <section class="luma-theme-settings__section">
          <h4>顶栏</h4>
          <div class="luma-theme-settings__row is-stacked" :class="{ 'is-disabled': !hasHeaderMenu }">
            <span>菜单位置</span>
            <div class="luma-theme-settings__segments">
              <button v-for="item in alignOptions" :key="item.value" type="button" :disabled="!hasHeaderMenu" :aria-pressed="preferences.header.menuAlign === item.value" :class="{ 'is-active': preferences.header.menuAlign === item.value }" @click="update({ header: { menuAlign: item.value } })">
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="luma-theme-settings__row is-stacked" :class="{ 'is-disabled': !hasHeaderMenu }">
            <span>菜单最大宽度</span><ElSlider :model-value="preferences.header.menuMaxWidth" :disabled="!hasHeaderMenu" :min="480" :max="1440" :step="40" @update:model-value="update({ header: { menuMaxWidth: Number($event) } })" /><ElInputNumber :model-value="preferences.header.menuMaxWidth" :disabled="!hasHeaderMenu" :min="480" :max="1440" :step="40" @update:model-value="update({ header: { menuMaxWidth: Number($event) } })" />
          </div>
        </section>
        <section class="luma-theme-settings__section">
          <h4>侧边栏</h4>
          <div class="luma-theme-settings__row">
            <span>显示侧边栏</span><ElSwitch :model-value="preferences.sidebar.enable" :disabled="preferences.app.layout === 'top-nav'" @update:model-value="update({ sidebar: { enable: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>折叠菜单</span><ElSwitch :model-value="preferences.sidebar.collapsed" :disabled="!hasSidebar" @update:model-value="update({ sidebar: { collapsed: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row is-stacked" :class="{ 'is-disabled': !hasSidebar }">
            <span>宽度</span><ElSlider :model-value="preferences.sidebar.width" :disabled="!hasSidebar" :min="200" :max="320" :step="8" @update:model-value="update({ sidebar: { width: Number($event) } })" /><ElInputNumber :model-value="preferences.sidebar.width" :disabled="!hasSidebar" :min="200" :max="320" :step="8" @update:model-value="update({ sidebar: { width: Number($event) } })" />
          </div>
        </section>
        <section class="luma-theme-settings__section">
          <h4>标签栏</h4>
          <div class="luma-theme-settings__row">
            <span>启用标签栏</span><ElSwitch :model-value="preferences.tabbar.enable" @update:model-value="update({ tabbar: { enable: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>页面缓存</span><ElSwitch :model-value="preferences.tabbar.cache" :disabled="!hasTabbar" @update:model-value="update({ tabbar: { cache: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>显示标签图标</span><ElSwitch :model-value="preferences.tabbar.showIcon" :disabled="!hasTabbar" @update:model-value="update({ tabbar: { showIcon: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>显示最大化按钮</span><ElSwitch :model-value="preferences.tabbar.showMaximize" :disabled="!hasTabbar" @update:model-value="update({ tabbar: { showMaximize: Boolean($event) } })" />
          </div>
          <div class="luma-theme-settings__row">
            <span>最大标签数</span><ElInputNumber :model-value="preferences.tabbar.maxCount" :disabled="!hasTabbar" :min="0" :max="30" @update:model-value="update({ tabbar: { maxCount: Number($event ?? 0) } })" />
          </div>
        </section>
      </div>
    </div>

    <div class="luma-theme-settings__actions">
      <ElButton class="luma-theme-settings__reset" plain @click="resetPreferences">
        恢复默认
      </ElButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.luma-theme-settings { display: flex; height: 100%; min-height: 0; flex-direction: column; overflow: hidden; color: var(--el-text-color-primary); }
.luma-theme-settings__tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; background: var(--el-fill-color-light); border-radius: 10px; }
.luma-theme-settings__tab { min-height: 40px; border: 0; border-radius: 7px; color: var(--el-text-color-regular); cursor: pointer; background: transparent; transition: color .2s, background-color .2s, box-shadow .2s; }
.luma-theme-settings__tab.is-active { color: var(--el-color-primary); background: var(--el-bg-color); box-shadow: var(--el-box-shadow-lighter); }
.luma-theme-settings__scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 2px 24px; }
.luma-theme-settings__pane { display: grid; gap: 24px; }
.luma-theme-settings__section { display: grid; gap: 14px; }
.luma-theme-settings__section + .luma-theme-settings__section { padding-top: 22px; border-top: 1px solid var(--el-border-color-lighter); }
h4 { margin: 0; font-size: 14px; font-weight: 650; }
.luma-theme-settings__row { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 32px; font-size: 13px; }
.luma-theme-settings__row.is-stacked { display: grid; grid-template-columns: 1fr auto; }
.luma-theme-settings__row.is-stacked :deep(.el-slider) { grid-column: 1; width: 100%; }
.luma-theme-settings__row.is-stacked :deep(.el-input-number) { grid-column: 2; grid-row: 2; width: 112px; }
.is-disabled { opacity: .48; }
.luma-theme-settings__card-grid, .luma-theme-settings__layout-grid, .luma-theme-settings__transition-grid { display: grid; gap: 10px; grid-template-columns: repeat(2, 1fr); }
.luma-theme-settings__card-grid.is-three { grid-template-columns: repeat(3, 1fr); }
button { font: inherit; }
.luma-theme-settings__mode-card, .luma-theme-settings__layout-card, .luma-theme-settings__transition-card { display: flex; min-height: 78px; align-items: center; justify-content: center; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid var(--el-border-color-light); border-radius: 10px; color: var(--el-text-color-regular); cursor: pointer; background: var(--el-bg-color); transition: border-color .2s, color .2s, background-color .2s, transform .2s; }
.luma-theme-settings__mode-card:hover, .luma-theme-settings__layout-card:hover, .luma-theme-settings__transition-card:hover { border-color: var(--el-color-primary-light-5); }
.luma-theme-settings__mode-card.is-active, .luma-theme-settings__layout-card.is-active, .luma-theme-settings__transition-card.is-active { border-color: var(--el-color-primary); color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.luma-theme-settings__mode-card:focus-visible, .luma-theme-settings__layout-card:focus-visible, .luma-theme-settings__transition-card:focus-visible, .luma-theme-settings__tab:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
.luma-theme-settings__mode-icon { position: relative; width: 24px; height: 24px; border: 2px solid currentColor; border-radius: 50%; }
.luma-theme-settings__mode-icon.is-dark { background: currentColor; box-shadow: inset 7px -3px 0 var(--el-bg-color); }
.luma-theme-settings__mode-icon.is-system { border-radius: 4px; }
.luma-theme-settings__mode-icon.is-system::after { position: absolute; right: 4px; bottom: -5px; left: 4px; height: 2px; content: ''; background: currentColor; }
.luma-theme-settings__mode-icon.is-light::before, .luma-theme-settings__mode-icon.is-light::after { position: absolute; inset: -6px 9px; content: ''; background: currentColor; }
.luma-theme-settings__mode-icon.is-light::after { transform: rotate(90deg); }
.luma-theme-settings__color-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.luma-theme-settings__color-card { position: relative; display: flex; min-height: 54px; align-items: center; gap: 8px; padding: 8px; overflow: hidden; border: 1px solid var(--el-border-color-light); border-radius: 9px; color: var(--el-text-color-regular); cursor: pointer; background: var(--el-bg-color); }
.luma-theme-settings__color-card.is-active { border-color: var(--el-color-primary); color: var(--el-color-primary); }
.luma-theme-settings__color-card i { width: 22px; height: 22px; flex: none; border-radius: 6px; }
.luma-theme-settings__color-card i.is-custom { background: linear-gradient(135deg, #3b82f6, #8b5cf6 50%, #ef4444); }
.luma-theme-settings__color-card input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.luma-theme-settings__radius-grid, .luma-theme-settings__segments { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.luma-theme-settings__radius-grid button, .luma-theme-settings__segments button { min-height: 36px; border: 1px solid var(--el-border-color-light); border-radius: 7px; color: var(--el-text-color-regular); cursor: pointer; background: var(--el-fill-color-light); }
.luma-theme-settings__radius-grid button.is-active, .luma-theme-settings__segments button.is-active { border-color: var(--el-color-primary); color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.luma-theme-settings__segments { grid-column: 1 / -1; grid-template-columns: repeat(3, 1fr); }
.luma-theme-settings__layout-preview { position: relative; width: 100%; height: 48px; border: 1px solid var(--el-border-color-light); border-radius: 6px; background: var(--el-fill-color-lighter); }
.luma-theme-settings__layout-preview i { position: absolute; display: block; border-radius: 3px; background: var(--el-color-primary-light-7); }
.luma-theme-settings__layout-preview .header { top: 5px; right: 5px; left: 5px; height: 8px; }
.luma-theme-settings__layout-preview .sidebar { top: 17px; bottom: 5px; left: 5px; width: 18%; }
.luma-theme-settings__layout-preview .content { top: 17px; right: 5px; bottom: 5px; left: 27%; }
.is-sidebar-nav .header { left: 27%; }.is-sidebar-nav .sidebar { top: 5px; }.is-top-nav .sidebar { display: none; }.is-top-nav .content { left: 5px; }
.luma-theme-settings__transition-preview { position: relative; width: 58px; height: 42px; border-radius: 6px; background: var(--el-fill-color-light); }
.luma-theme-settings__transition-preview i { position: absolute; inset: 7px 10px; border-radius: 5px; background: var(--el-color-primary-light-5); opacity: .3; }
.luma-theme-settings__transition-preview i:last-child { opacity: 1; }
.luma-theme-settings__transition-card:not(:disabled).is-fade-side i:last-child { animation: luma-settings-side 2.4s infinite; }
.luma-theme-settings__transition-card:not(:disabled).is-fade i:last-child { animation: luma-settings-fade 2.4s infinite; }
.luma-theme-settings__transition-card:not(:disabled).is-fade-bottom i:last-child { animation: luma-settings-bottom 2.4s infinite; }
.luma-theme-settings__transition-card:not(:disabled).is-zoom-fade i:last-child { animation: luma-settings-zoom 2.4s infinite; }
.luma-theme-settings__transition-card:disabled { cursor: not-allowed; opacity: .45; }
.luma-theme-settings__actions { flex: none; padding-top: 16px; border-top: 1px solid var(--el-border-color-lighter); background: var(--el-bg-color); }
.luma-theme-settings__reset { width: 100%; min-height: 40px; }
@keyframes luma-settings-side { 0%, 20%, 100% { opacity: 0; transform: translateX(-10px); } 40%, 80% { opacity: 1; transform: translateX(0); } }
@keyframes luma-settings-fade { 0%, 20%, 100% { opacity: 0; } 40%, 80% { opacity: 1; } }
@keyframes luma-settings-bottom { 0%, 20%, 100% { opacity: 0; transform: translateY(8px); } 40%, 80% { opacity: 1; transform: translateY(0); } }
@keyframes luma-settings-zoom { 0%, 20%, 100% { opacity: 0; transform: scale(.82); } 40%, 80% { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .luma-theme-settings *, .luma-theme-settings *::before, .luma-theme-settings *::after { scroll-behavior: auto !important; animation: none !important; transition-duration: .01ms !important; } }
@media (max-width: 420px) { .luma-theme-settings__color-grid, .luma-theme-settings__card-grid.is-three { grid-template-columns: repeat(2, 1fr); } }
</style>
