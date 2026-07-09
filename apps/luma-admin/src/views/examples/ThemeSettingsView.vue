<script setup lang="ts">
import type { LumaPreferences, ThemeMode } from '@luma/core/theme'
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import { createDefaultPreferences, mergePreferences, resolveThemeMode } from '@luma/core/theme'
import { computed, shallowRef } from 'vue'

/***********************偏好状态*********************/
const themeModes: ThemeMode[] = ['light', 'dark', 'system']
const colorOptions = ['#1677ff', '#16a34a', '#dc2626']

const preferences = shallowRef<LumaPreferences>(createDefaultPreferences())

const resolvedMode = computed(() => resolveThemeMode(preferences.value.theme.mode, {
  matchMedia: query => ({
    matches: query.includes('dark'),
  }) as MediaQueryList,
}))

const preferenceItems = computed(() => [
  { label: '主题模式', value: preferences.value.theme.mode },
  { label: '解析模式', value: resolvedMode.value },
  { label: '主题色', value: preferences.value.theme.colorPrimary },
  { label: '动画', value: preferences.value.transition.enable ? preferences.value.transition.name : 'disabled' },
  { label: '进度条', value: preferences.value.transition.progress ? 'enabled' : 'disabled' },
  { label: '侧边栏宽度', value: `${preferences.value.sidebar.width}px` },
])

const previewStyle = computed(() => ({
  '--luma-admin-example-preview-color': preferences.value.theme.colorPrimary,
  '--luma-admin-example-preview-radius': `${Math.round(8 * preferences.value.theme.radiusScale)}px`,
}))

/***********************事件处理*********************/
function setMode(mode: ThemeMode): void {
  preferences.value = mergePreferences(preferences.value, {
    theme: {
      mode,
    },
  })
}

function setColor(colorPrimary: string): void {
  preferences.value = mergePreferences(preferences.value, {
    theme: {
      colorPrimary,
    },
  })
}

function toggleTransition(): void {
  preferences.value = mergePreferences(preferences.value, {
    transition: {
      enable: !preferences.value.transition.enable,
    },
  })
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="主题与动画" description="验证 Luma preferences 的主题、动画和布局偏好。">
      <div class="luma-admin-example__toolbar">
        <button
          v-for="mode in themeModes"
          :key="mode"
          class="luma-admin-example__button"
          type="button"
          @click="setMode(mode)"
        >
          {{ mode }}
        </button>
      </div>

      <div class="luma-admin-example__toolbar">
        <button
          v-for="color in colorOptions"
          :key="color"
          class="luma-admin-example__swatch"
          :style="{ backgroundColor: color }"
          type="button"
          :aria-label="color"
          @click="setColor(color)"
        />
        <button class="luma-admin-example__button" type="button" @click="toggleTransition">
          切换动画
        </button>
      </div>

      <div class="luma-admin-example__theme-preview" :style="previewStyle">
        <strong>Luma Theme Preview</strong>
        <span>主题变量会影响预览区颜色和圆角。</span>
      </div>

      <LumaInfoTable :items="preferenceItems" :columns="2" label-width="96px" />
    </LumaPage>
  </main>
</template>
