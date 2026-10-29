<script setup lang="ts">
import type { ThemeColorPreset } from './theme-color-presets'
import type { LumalPreferences, LumalPreferencesDefaults, ResolvedPreferenceVisibility, ThemeMode } from './types'
import { LumalIcon } from '@lumal/icons-vue'
import { ElInputNumber } from 'element-plus'
import { computed } from 'vue'

/***********************属性与事件*********************/
const props = defineProps<{
  colorPresets: ThemeColorPreset[]
  preferences: LumalPreferences
  visibility: ResolvedPreferenceVisibility
}>()

const emit = defineEmits<{
  update: [patch: LumalPreferencesDefaults]
}>()

/***********************外观选项*********************/
const themeModeOptions: { icon: string, label: string, value: ThemeMode }[] = [
  { icon: 'lumal:sun', label: '浅色', value: 'light' },
  { icon: 'lumal:moon', label: '深色', value: 'dark' },
  { icon: 'lumal:monitor', label: '跟随系统', value: 'system' },
]
const radiusOptions = [0, 0.25, 0.5, 0.75, 1]
const presetColors = computed(() => props.colorPresets.filter(item => !item.custom))
const customColorActive = computed(() => !presetColors.value.some(item => item.value === props.preferences.theme.colorPrimary))

/***********************主题色更新*********************/
function setColor(color: string): void {
  emit('update', { theme: { colorPrimary: color } })
}
</script>

<template>
  <section v-if="visibility.theme.mode" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      主题模式
    </h4>
    <div class="lumal-theme-settings__card-grid is-three">
      <button
        v-for="item in themeModeOptions"
        :key="item.value"
        type="button"
        class="lumal-theme-settings__mode-card"
        :class="{ 'is-active': preferences.theme.mode === item.value }"
        :aria-pressed="preferences.theme.mode === item.value"
        @click="emit('update', { theme: { mode: item.value } })"
      >
        <span class="lumal-theme-settings__mode-preview">
          <LumalIcon class="lumal-theme-settings__mode-icon" :name="item.icon" :size="20" />
        </span>
        <span class="lumal-theme-settings__option-label">{{ item.label }}</span>
      </button>
    </div>
  </section>

  <section v-if="visibility.theme.colorPrimary" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      内置主题
    </h4>
    <div class="lumal-theme-settings__color-grid">
      <button
        v-for="preset in presetColors"
        :key="preset.value"
        type="button"
        class="lumal-theme-settings__color-card"
        :class="{ 'is-active': preferences.theme.colorPrimary === preset.value }"
        :aria-label="preset.label"
        :aria-pressed="preferences.theme.colorPrimary === preset.value"
        @click="setColor(preset.value)"
      >
        <span class="lumal-theme-settings__color-preview" :style="{ backgroundColor: preset.value }" />
        <span class="lumal-theme-settings__option-label">{{ preset.label }}</span>
      </button>
      <label class="lumal-theme-settings__color-card is-custom" :class="{ 'is-active': customColorActive }">
        <span
          class="lumal-theme-settings__color-preview is-custom"
          :style="customColorActive ? { backgroundColor: preferences.theme.colorPrimary } : undefined"
        >
          <LumalIcon name="lumal:palette" :size="18" />
        </span>
        <span class="lumal-theme-settings__option-label">自定义</span>
        <input
          type="color"
          :value="preferences.theme.colorPrimary"
          aria-label="自定义主题色"
          @input="setColor(($event.target as HTMLInputElement).value)"
        >
      </label>
    </div>
  </section>

  <section v-if="visibility.theme.radiusScale" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      圆角
    </h4>
    <div class="lumal-theme-settings__radius-grid">
      <button
        v-for="value in radiusOptions"
        :key="value"
        type="button"
        :class="{ 'is-active': preferences.theme.radiusScale === value }"
        :aria-label="`圆角比例 ${value}`"
        :aria-pressed="preferences.theme.radiusScale === value"
        @click="emit('update', { theme: { radiusScale: value } })"
      >
        {{ value }}
      </button>
    </div>
  </section>

  <section v-if="visibility.theme.fontSize" class="lumal-theme-settings__section">
    <h4 class="lumal-theme-settings__section-title">
      字体
    </h4>
    <div class="lumal-theme-settings__row">
      <span>全局字号</span>
      <ElInputNumber
        :model-value="preferences.theme.fontSize"
        :min="12"
        :max="20"
        :step="1"
        aria-label="全局字号"
        @update:model-value="emit('update', { theme: { fontSize: Number($event ?? 14) } })"
      />
    </div>
  </section>
</template>
