<script setup lang="ts">
import type { CockpitConfig, CockpitDesignerSavePayload } from '@luma/cockpit'
import type { ThemeMode } from '@luma/core/theme'
import { LumaCockpitDesigner } from '@luma/cockpit/designer'
import { LumaCockpit } from '@luma/cockpit/runtime'
import { LumaIcon } from '@luma/icons'
import { ElButton, ElTooltip } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import designerTitleImage from './assets/cockpit-designer/dialog-header-bg.png'
import SceneCenter from './centers/scene-center/Center.vue'
import CockpitCard from './components/CockpitCard.vue'
import { standaloneCockpitRegistry } from './registry'
import { loadStandaloneConfig, saveStandaloneConfig } from './services/config'
import {
  setStandaloneThemeMode,
  standalonePreferences,
  standaloneResolvedThemeMode,
} from './services/preferences'

/***********************独立驾驶舱根组件*********************/

const config = shallowRef<CockpitConfig>(loadStandaloneConfig())
const designerVisible = ref(false)
const saving = ref(false)
const saveError = ref<string>('')

const activeLayoutId = ref<string | undefined>()
const fullscreenActive = ref(false)
const viewportMode = ref<'scale' | 'vwvh'>('scale')
const cockpitRef = ref<InstanceType<typeof LumaCockpit> | null>(null)

const themeModeIcon = computed(() => {
  const mode = standalonePreferences.value.theme.mode
  if (mode === 'light')
    return 'luma:sun'
  if (mode === 'dark')
    return 'luma:moon'
  return 'luma:monitor'
})

const themeModeLabel = computed(() => {
  const mode = standalonePreferences.value.theme.mode
  if (mode === 'light')
    return '浅色'
  if (mode === 'dark')
    return '深色'
  return '跟随系统'
})

function cycleThemeMode(): void {
  const order: ThemeMode[] = ['system', 'light', 'dark']
  const current = standalonePreferences.value.theme.mode
  const next = order[(order.indexOf(current) + 1) % order.length] ?? 'system'
  setStandaloneThemeMode(next)
}

function openDesigner(): void {
  designerVisible.value = true
}

function closeDesigner(): void {
  designerVisible.value = false
  saveError.value = ''
}

function syncFullscreenState(): void {
  fullscreenActive.value = Boolean(document.fullscreenElement)
}

async function toggleFullscreen(): Promise<void> {
  if (document.fullscreenElement) {
    await cockpitRef.value?.exitFullscreen()
  }
  else {
    await cockpitRef.value?.enterFullscreen()
  }
  syncFullscreenState()
}

function handleSave(payload: CockpitDesignerSavePayload): void {
  saving.value = true
  saveError.value = ''
  try {
    config.value = saveStandaloneConfig(payload.config)
    designerVisible.value = false
  }
  catch (error) {
    saveError.value = error instanceof Error ? error.message : '保存失败'
  }
  finally {
    saving.value = false
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState)
  syncFullscreenState()
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
})
</script>

<template>
  <div class="standalone-app">
    <LumaCockpit
      ref="cockpitRef"
      v-model:active-layout-id="activeLayoutId"
      :card-component="CockpitCard"
      :config="config"
      :registry="standaloneCockpitRegistry"
      :theme-mode="standaloneResolvedThemeMode"
      :viewport-mode="viewportMode"
      @configure="openDesigner"
    >
      <template #header-title="{ title }">
        <div class="standalone-app__heading">
          <h1>{{ title }}</h1>
          <nav class="standalone-app__layouts" aria-label="布局选择">
            <ElButton
              v-for="layout in config.layouts"
              :key="layout.id"
              :class="{ 'is-active': (activeLayoutId ?? config.activeLayoutId) === layout.id }"
              :aria-current="(activeLayoutId ?? config.activeLayoutId) === layout.id ? 'page' : undefined"
              @click="activeLayoutId = layout.id"
            >
              {{ layout.title }}
            </ElButton>
          </nav>
        </div>
      </template>
      <template #header-actions>
        <div class="standalone-app__actions">
          <ElTooltip :content="`切换主题，当前：${themeModeLabel}`">
            <ElButton circle data-action="cockpit-theme" :aria-label="`切换主题，当前：${themeModeLabel}`" @click="cycleThemeMode">
              <LumaIcon :name="themeModeIcon" :size="18" />
            </ElButton>
          </ElTooltip>
          <ElTooltip :content="fullscreenActive ? '退出全屏' : '进入全屏'">
            <ElButton circle data-action="cockpit-fullscreen" :aria-label="fullscreenActive ? '退出全屏' : '进入全屏'" @click="toggleFullscreen">
              <LumaIcon :name="fullscreenActive ? 'luma:fullscreen-exit' : 'luma:fullscreen'" :size="18" />
            </ElButton>
          </ElTooltip>
          <ElTooltip :content="viewportMode === 'scale' ? '当前：等比缩放' : '当前：VW/VH 适配'">
            <ElButton circle aria-label="切换大屏适配模式" @click="viewportMode = viewportMode === 'scale' ? 'vwvh' : 'scale'">
              <LumaIcon name="luma:screen" :size="18" />
            </ElButton>
          </ElTooltip>
          <ElTooltip content="打开配置器">
            <ElButton circle data-action="cockpit-configure" aria-label="打开配置器" @click="openDesigner">
              <LumaIcon name="luma:settings" :size="18" />
            </ElButton>
          </ElTooltip>
        </div>
      </template>
      <template #center="{ context }">
        <SceneCenter :key="context.instanceId" :context="context" />
      </template>
    </LumaCockpit>

    <div
      v-if="designerVisible"
      class="standalone-app__designer"
      role="dialog"
      aria-label="驾驶舱配置"
      :style="{ '--luma-cockpit-designer-title-image': `url(${designerTitleImage})` }"
    >
      <LumaCockpitDesigner
        :config="config"
        :registry="standaloneCockpitRegistry"
        :saving="saving"
        :save-error="saveError"
        :theme-mode="standaloneResolvedThemeMode"
        @save="handleSave"
        @cancel="closeDesigner"
      />
    </div>
  </div>
</template>

<style scoped>
.standalone-app {
  position: fixed;
  inset: 0;
}

.standalone-app__designer {
  position: fixed;
  inset: 0;
  z-index: 2050;
}

.standalone-app__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.standalone-app__heading {
  display: flex;
  gap: 24px;
  align-items: center;
}

.standalone-app__heading h1 {
  margin: 0;
  font: inherit;
}

.standalone-app__layouts {
  display: flex;
  gap: 8px;
}

.standalone-app__layouts :deep(.el-button) {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--luma-cockpit-border);
  border-radius: 6px;
  background: var(--luma-cockpit-floating-bg);
  color: inherit;
  cursor: pointer;
}

.standalone-app__layouts :deep(.el-button.is-active) {
  border-color: var(--luma-cockpit-accent);
  box-shadow: inset 0 -2px 0 var(--luma-cockpit-accent);
}

.standalone-app__actions :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  border: 1px solid var(--luma-cockpit-border);
  border-radius: var(--luma-cockpit-radius);
  background: var(--luma-cockpit-floating-bg);
  color: inherit;
  cursor: pointer;
}

.standalone-app__actions button:focus-visible {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: 2px;
}
</style>
