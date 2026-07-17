<script setup lang="ts">
import type { CockpitConfig, CockpitDesignerSavePayload, CockpitViewportMode } from '@luma/cockpit'
import type { ThemeMode } from '@luma/core/theme'
import { LumaCockpitDesigner } from '@luma/cockpit/designer'
import { LumaCockpit } from '@luma/cockpit/runtime'
import { LumaFullScreenContainer } from '@luma/datav'
import { LumaIcon } from '@luma/icons-vue'
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

// 三种大屏适配 UI 模式：scale 等比缩放 / vwvh 视口铺满 / container 由 @luma/datav 全屏容器缩放
type ViewportUiMode = 'scale' | 'vwvh' | 'container'

const activeLayoutId = ref<string | undefined>()
const fullscreenActive = ref(false)
const viewportMode = ref<ViewportUiMode>('scale')
const cockpitRef = ref<InstanceType<typeof LumaCockpit> | null>(null)

// 基准设计尺寸，供全屏容器与画布共用
const baseWidth = 1920
const baseHeight = 1080

// container 模式下让 LumaCockpit 使用 external（自身不缩放），交由 LumaFullScreenContainer
const cockpitViewportMode = computed<CockpitViewportMode>(() =>
  viewportMode.value === 'container' ? 'external' : viewportMode.value,
)
const useFullScreenContainer = computed(() => viewportMode.value === 'container')

const viewportModeLabel = computed(() => {
  const labels: Record<ViewportUiMode, string> = {
    scale: '等比缩放',
    vwvh: 'VW/VH 适配',
    container: '全屏容器缩放',
  }
  return labels[viewportMode.value]
})

// 循环切换三种适配模式
function cycleViewportMode(): void {
  const order: ViewportUiMode[] = ['scale', 'vwvh', 'container']
  const index = order.indexOf(viewportMode.value)
  viewportMode.value = order[(index + 1) % order.length] ?? 'scale'
}

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
    <!-- container 模式：用 @luma/datav 全屏容器承担缩放；其它模式透传，由 LumaCockpit 自缩放 -->
    <component
      :is="useFullScreenContainer ? LumaFullScreenContainer : 'div'"
      :class="useFullScreenContainer ? 'standalone-app__stage' : 'standalone-app__passthrough'"
      v-bind="useFullScreenContainer ? { width: baseWidth, height: baseHeight, mode: 'width' } : {}"
    >
      <LumaCockpit
        ref="cockpitRef"
        v-model:active-layout-id="activeLayoutId"
        :card-component="CockpitCard"
        :config="config"
        :registry="standaloneCockpitRegistry"
        :theme-mode="standaloneResolvedThemeMode"
        :base-width="baseWidth"
        :base-height="baseHeight"
        :viewport-mode="cockpitViewportMode"
        @configure="openDesigner"
      >
        <template #header-title="{ title }">
          <div class="standalone-app__heading">
            <div class="standalone-app__brand">
              <h1>{{ title }}</h1>
              <span>NATIONAL SMART OPERATIONS</span>
            </div>
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
            <span class="standalone-app__live"><i />实时在线</span>
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
            <ElTooltip :content="`切换大屏适配，当前：${viewportModeLabel}`">
              <ElButton circle aria-label="切换大屏适配模式" @click="cycleViewportMode">
                <LumaIcon name="luma:monitor" :size="18" />
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
    </component>

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

/* 非 container 模式：透传包裹，不影响 LumaCockpit 原有 fixed 铺满定位 */
.standalone-app__passthrough {
  display: contents;
}

/* container 模式：LumaCockpit 相对全屏容器 stage 铺满，替代其自身 fixed 定位 */
.standalone-app__stage :deep(.luma-cockpit) {
  position: absolute;
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
  gap: 28px;
  align-items: center;
}

.standalone-app__brand {
  display: grid;
  gap: 2px;
}

.standalone-app__brand h1 {
  margin: 0;
  font: inherit;
}

.standalone-app__brand span {
  color: var(--luma-cockpit-text-secondary);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.15em;
  white-space: nowrap;
}

:global(:root[data-luma-theme='dark']) .standalone-app__brand span {
  color: color-mix(in srgb, var(--luma-cockpit-accent), transparent 36%);
}

.standalone-app__layouts {
  display: flex;
  gap: 8px;
}

.standalone-app__layouts :deep(.el-button) {
  min-height: 36px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 18%);
  border-radius: 2px;
  background: color-mix(in srgb, var(--luma-cockpit-floating-bg), transparent 14%);
  color: var(--luma-cockpit-text-secondary);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  cursor: pointer;
}

.standalone-app__layouts :deep(.el-button.is-active) {
  border-color: var(--luma-cockpit-accent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--luma-cockpit-accent), transparent 80%), transparent);
  color: var(--luma-cockpit-title-text);
  box-shadow: inset 0 -2px 0 var(--luma-cockpit-accent), 0 0 12px color-mix(in srgb, var(--luma-cockpit-accent), transparent 78%);
}

.standalone-app__live {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-success), transparent 60%);
  background: color-mix(in srgb, var(--luma-cockpit-success), transparent 92%);
  color: var(--luma-cockpit-success);
  font-size: 11px;
  white-space: nowrap;
}

.standalone-app__live i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--luma-cockpit-success);
  box-shadow: 0 0 8px var(--luma-cockpit-success);
}

.standalone-app__actions :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 18%);
  border-radius: 2px;
  background: color-mix(in srgb, var(--luma-cockpit-floating-bg), transparent 14%);
  color: inherit;
  cursor: pointer;
}

.standalone-app__actions :deep(.el-button:hover) {
  border-color: var(--luma-cockpit-accent);
  background: color-mix(in srgb, var(--luma-cockpit-accent), transparent 88%);
  color: var(--luma-cockpit-title-text);
}

.standalone-app__actions button:focus-visible {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: 2px;
}
</style>
