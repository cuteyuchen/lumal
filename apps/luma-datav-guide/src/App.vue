<script setup lang="ts">
import { LumaLayout, LumaRouterView } from '@luma/core/layout'
import { LumaThemeSettingsPanel } from '@luma/core/theme'
import { LumaIcon } from '@luma/icons'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { guideMenus } from './navigation'
import {
  guidePreferenceDefaults,
  guidePreferences,
  guideResolvedThemeMode,
  patchGuidePreferences,
} from './services/preferences'

/***********************基础状态*********************/
const preferences = guidePreferences
const resolvedThemeMode = guideResolvedThemeMode
const route = useRoute()
const router = useRouter()

/**
 * 内嵌到 Admin（externalLink 带 ?embed=1）时隐藏 Header，
 * 单独访问文档站时显示完整顶栏。首帧优先读 URL，避免路由就绪前闪现。
 */
const isEmbed = computed(() => {
  if (route.query.embed === '1') {
    return true
  }
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search).get('embed') === '1'
      || window.location.hash.includes('embed=1')
  }
  return false
})

const menus = computed(() => guideMenus)
const activePath = computed({
  get: () => route.path,
  set: (path: string) => {
    if (path !== route.path && !path.startsWith('/group/')) {
      void router.push(path)
    }
  },
})

/***********************主题*********************/
const settingsVisible = ref(false)

function toggleTheme(): void {
  patchGuidePreferences({
    theme: { mode: resolvedThemeMode.value === 'dark' ? 'light' : 'dark' },
  })
}

function handleMenuSelect(path: string): void {
  if (!path.startsWith('/group/')) {
    void router.push(path)
  }
}
</script>

<template>
  <LumaLayout
    v-model:active-tab-path="activePath"
    title="@luma/datav"
    :menus="menus"
    :preferences="preferences"
    :show-header="!isEmbed"
    route-driven
    :active-menu-path="activePath"
    @menu-select="handleMenuSelect"
  >
    <template #logo>
      <span class="guide-brand">
        <strong>@luma/datav</strong>
        <span class="guide-brand__tag">组件指南</span>
      </span>
    </template>

    <template #headerActions>
      <button
        class="guide-action"
        type="button"
        :aria-label="resolvedThemeMode === 'dark' ? '切换到亮色' : '切换到暗色'"
        @click="toggleTheme"
      >
        <LumaIcon :name="resolvedThemeMode === 'dark' ? 'ep:sunny' : 'ep:moon'" />
      </button>
      <button
        class="guide-action"
        type="button"
        aria-label="外观设置"
        @click="settingsVisible = true"
      >
        <LumaIcon name="ep:setting" />
      </button>
    </template>

    <LumaRouterView
      :view-key="route.fullPath"
      :progress="preferences.transition.progress"
      :transition="preferences.transition.enable"
      :transition-name="preferences.transition.name"
    />

    <ElDrawer
      v-model="settingsVisible"
      title="外观设置"
      size="360px"
      append-to-body
    >
      <LumaThemeSettingsPanel
        :defaults="guidePreferenceDefaults"
        :preferences="preferences"
        @update:preferences="patchGuidePreferences"
        @reset="patchGuidePreferences"
      />
    </ElDrawer>
  </LumaLayout>
</template>

<style scoped>
.guide-brand {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}

.guide-brand strong {
  font-size: 16px;
  font-weight: 700;
}

.guide-brand__tag {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.guide-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.guide-action:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}
</style>
