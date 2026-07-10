<script setup lang="ts">
import type { LumaLayoutMode, LumaPreferences, ThemeMode } from './types'
import {
  ElDivider,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSlider,
  ElSwitch,
} from 'element-plus'
import { computed } from 'vue'
import { mergePreferences } from './preferences'
import { themeColorPresets } from './theme-color-presets'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  /** 可选的主题色预设，默认使用内置 themeColorPresets。 */
  colorPresets?: { label: string, value: string, custom?: boolean }[]
  /** 是否展示布局模式切换。 */
  showLayout?: boolean
}>(), {
  colorPresets: () => themeColorPresets,
  showLayout: true,
})

/** 面板通过 v-model:preferences 双向绑定完整偏好对象。 */
const emit = defineEmits<{
  /** 任一偏好变更时抛出最新偏好，便于外部持久化或应用到 DOM。 */
  change: [preferences: LumaPreferences]
}>()

const preferences = defineModel<LumaPreferences>('preferences', {
  required: true,
})

/***********************选项常量*********************/
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

/***********************偏好更新*********************/
function update(patch: Parameters<typeof mergePreferences>[1]): void {
  const next = mergePreferences(preferences.value, patch)
  preferences.value = next
  emit('change', next)
}

/***********************主题色*********************/
const presetColors = computed(() => props.colorPresets.filter(preset => !preset.custom))
const isCustomColor = computed(() => !presetColors.value.some(preset => preset.value === preferences.value.theme.colorPrimary))

function setColor(color: string): void {
  update({ theme: { colorPrimary: color } })
}

/***********************双向绑定代理*********************/
const themeMode = computed<ThemeMode>({
  get: () => preferences.value.theme.mode,
  set: mode => update({ theme: { mode } }),
})

const layoutMode = computed<LumaLayoutMode>({
  get: () => preferences.value.app.layout,
  set: layout => update({ app: { layout } }),
})

const radiusScale = computed<number>({
  get: () => preferences.value.theme.radiusScale,
  set: radiusScale => update({ theme: { radiusScale } }),
})

const sidebarWidth = computed<number>({
  get: () => preferences.value.sidebar.width,
  set: width => update({ sidebar: { width } }),
})

const tabbarEnable = computed<boolean>({
  get: () => preferences.value.tabbar.enable,
  set: enable => update({ tabbar: { enable } }),
})

const tabbarCache = computed<boolean>({
  get: () => preferences.value.tabbar.cache,
  set: cache => update({ tabbar: { cache } }),
})

const transitionEnable = computed<boolean>({
  get: () => preferences.value.transition.enable,
  set: enable => update({ transition: { enable } }),
})
</script>

<template>
  <div class="luma-theme-settings">
    <!-- 外观模式 -->
    <section class="luma-theme-settings__section">
      <h4 class="luma-theme-settings__title">
        外观模式
      </h4>
      <div class="luma-theme-settings__modes">
        <button
          v-for="option in themeModeOptions"
          :key="option.value"
          type="button"
          class="luma-theme-settings__mode"
          :class="{ 'is-active': themeMode === option.value }"
          @click="themeMode = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <ElDivider />

    <!-- 主题色 -->
    <section class="luma-theme-settings__section">
      <h4 class="luma-theme-settings__title">
        主题色
      </h4>
      <div class="luma-theme-settings__colors">
        <button
          v-for="preset in presetColors"
          :key="preset.value"
          type="button"
          class="luma-theme-settings__color"
          :class="{ 'is-active': preferences.theme.colorPrimary === preset.value }"
          :style="{ backgroundColor: preset.value }"
          :title="preset.label"
          :aria-label="preset.label"
          @click="setColor(preset.value)"
        />
        <label class="luma-theme-settings__color-custom" :class="{ 'is-active': isCustomColor }">
          <input
            type="color"
            :value="preferences.theme.colorPrimary"
            @input="setColor(($event.target as HTMLInputElement).value)"
          >
        </label>
      </div>
    </section>

    <ElDivider />

    <!-- 布局模式 -->
    <section v-if="showLayout" class="luma-theme-settings__section">
      <h4 class="luma-theme-settings__title">
        布局模式
      </h4>
      <ElSelect v-model="layoutMode" class="luma-theme-settings__control">
        <ElOption
          v-for="option in layoutModeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
    </section>

    <ElDivider v-if="showLayout" />

    <!-- 圆角与尺寸 -->
    <section class="luma-theme-settings__section">
      <h4 class="luma-theme-settings__title">
        圆角与尺寸
      </h4>
      <div class="luma-theme-settings__row">
        <span class="luma-theme-settings__label">圆角</span>
        <ElSlider
          v-model="radiusScale"
          class="luma-theme-settings__control"
          :min="0"
          :max="1"
          :step="0.05"
        />
      </div>
      <div class="luma-theme-settings__row">
        <span class="luma-theme-settings__label">侧边栏宽度</span>
        <ElInputNumber
          v-model="sidebarWidth"
          :min="180"
          :max="360"
          :step="4"
          controls-position="right"
        />
      </div>
    </section>

    <ElDivider />

    <!-- 标签页与动画 -->
    <section class="luma-theme-settings__section">
      <h4 class="luma-theme-settings__title">
        标签页与动画
      </h4>
      <div class="luma-theme-settings__row">
        <span class="luma-theme-settings__label">开启标签页</span>
        <ElSwitch v-model="tabbarEnable" />
      </div>
      <div class="luma-theme-settings__row">
        <span class="luma-theme-settings__label">标签页缓存</span>
        <ElSwitch v-model="tabbarCache" :disabled="!tabbarEnable" />
      </div>
      <div class="luma-theme-settings__row">
        <span class="luma-theme-settings__label">页面动画</span>
        <ElSwitch v-model="transitionEnable" />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.luma-theme-settings {
  display: flex;
  flex-direction: column;
  min-width: 240px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__modes {
    display: flex;
    gap: 8px;
  }

  &__mode {
    flex: 1;
    min-height: 40px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: var(--el-fill-color-light);
    border: 1px solid transparent;
    border-radius: 6px;
    transition: all 0.2s;

    &.is-active {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__colors {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__color {
    width: 32px;
    height: 32px;
    padding: 0;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 6px;
    transition: transform 0.2s;

    &.is-active {
      border-color: var(--el-text-color-primary);
      transform: scale(1.1);
    }
  }

  &__color-custom {
    display: inline-flex;
    width: 32px;
    height: 32px;
    overflow: hidden;
    cursor: pointer;
    border: 2px dashed var(--el-border-color);
    border-radius: 6px;

    &.is-active {
      border-style: solid;
      border-color: var(--el-text-color-primary);
    }

    input {
      width: 200%;
      height: 200%;
      margin: -25%;
      cursor: pointer;
      border: none;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__label {
    font-size: 13px;
    color: var(--el-text-color-regular);
    white-space: nowrap;
  }

  &__control {
    flex: 1;
  }
}
</style>
