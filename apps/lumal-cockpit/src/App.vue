<script setup lang="ts">
import type { CockpitConfig, CockpitDesignerSavePayload, CockpitViewportMode } from '@lumal/cockpit'
import { LumalCockpitDesigner } from '@lumal/cockpit/designer'
import { LumalCockpit, LumalCockpitRegion } from '@lumal/cockpit/runtime'
import { LumalFullScreenContainer } from '@lumal/datav'
import { LumalIcon } from '@lumal/icons-vue'
import { ElButton, ElTooltip } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import designerTitleImage from './assets/cockpit-designer/dialog-header-bg.png'
import SceneCenter from './centers/scene-center/Center.vue'
import CockpitCard from './components/CockpitCard.vue'
import RegionCollapse from './components/RegionCollapse.vue'
import { standaloneCockpitRegistry } from './registry'
import { loadStandaloneConfig, saveStandaloneConfig } from './services/config'

/***********************独立驾驶舱根组件*********************/

// 本应用是纯暗色科技感大屏，不提供主题切换
const THEME_MODE = 'dark' as const

const config = shallowRef<CockpitConfig>(loadStandaloneConfig())
const designerVisible = ref(false)
const saving = ref(false)
const saveError = ref<string>('')

// 三种大屏适配 UI 模式：scale 等比缩放 / vwvh 视口铺满 / container 由 @lumal/datav 全屏容器缩放
type ViewportUiMode = 'scale' | 'vwvh' | 'container'

const activeLayoutId = ref<string | undefined>()
const fullscreenActive = ref(false)
const viewportMode = ref<ViewportUiMode>('scale')
const cockpitRef = ref<InstanceType<typeof LumalCockpit> | null>(null)

// 基准设计尺寸，供全屏容器与画布共用
const baseWidth = 1920
const baseHeight = 1080

// container 模式下让 LumalCockpit 使用 external（自身不缩放），交由 LumalFullScreenContainer
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
    <!-- container 模式：用 @lumal/datav 全屏容器承担缩放；其它模式透传，由 LumalCockpit 自缩放 -->
    <component
      :is="useFullScreenContainer ? LumalFullScreenContainer : 'div'"
      :class="useFullScreenContainer ? 'standalone-app__stage' : 'standalone-app__passthrough'"
      v-bind="useFullScreenContainer ? { width: baseWidth, height: baseHeight, mode: 'width' } : {}"
    >
      <LumalCockpit
        ref="cockpitRef"
        v-model:active-layout-id="activeLayoutId"
        auto-refresh
        :card-component="CockpitCard"
        :config="config"
        :registry="standaloneCockpitRegistry"
        :theme-mode="THEME_MODE"
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
            <ElTooltip :content="fullscreenActive ? '退出全屏' : '进入全屏'">
              <ElButton circle data-action="cockpit-fullscreen" :aria-label="fullscreenActive ? '退出全屏' : '进入全屏'" @click="toggleFullscreen">
                <LumalIcon :name="fullscreenActive ? 'lumal:fullscreen-exit' : 'lumal:fullscreen'" :size="18" />
              </ElButton>
            </ElTooltip>
            <ElTooltip :content="`切换大屏适配，当前：${viewportModeLabel}`">
              <ElButton circle aria-label="切换大屏适配模式" @click="cycleViewportMode">
                <LumalIcon name="lumal:monitor" :size="18" />
              </ElButton>
            </ElTooltip>
            <ElTooltip content="打开配置器">
              <ElButton circle data-action="cockpit-configure" aria-label="打开配置器" @click="openDesigner">
                <LumalIcon name="lumal:settings" :size="18" />
              </ElButton>
            </ElTooltip>
          </div>
        </template>
        <template #center="{ context }">
          <SceneCenter :key="context.instanceId" :context="context" />
        </template>
        <template #left="{ layout, region }">
          <RegionCollapse side="left">
            <LumalCockpitRegion side="left" :layout-id="layout.id" :region="region" />
          </RegionCollapse>
        </template>
        <template #right="{ layout, region }">
          <RegionCollapse side="right">
            <LumalCockpitRegion side="right" :layout-id="layout.id" :region="region" />
          </RegionCollapse>
        </template>
      </LumalCockpit>
    </component>

    <div
      v-if="designerVisible"
      class="standalone-app__designer"
      role="dialog"
      aria-modal="true"
      aria-label="驾驶舱配置"
      :style="{ '--lumal-cockpit-designer-title-image': `url(${designerTitleImage})` }"
    >
      <LumalCockpitDesigner
        :config="config"
        :registry="standaloneCockpitRegistry"
        :saving="saving"
        :save-error="saveError"
        :theme-mode="THEME_MODE"
        @save="handleSave"
        @cancel="closeDesigner"
      >
        <template #title-actions>
          <ElTooltip content="关闭">
            <ElButton
              class="standalone-app__designer-close"
              circle
              aria-label="关闭模块设置"
              @click="closeDesigner"
            >
              <LumalIcon name="lumal:close" :size="16" />
            </ElButton>
          </ElTooltip>
        </template>
      </LumalCockpitDesigner>
    </div>
  </div>
</template>

<style scoped>
.standalone-app {
  position: fixed;
  inset: 0;
}

.standalone-app__passthrough {
  display: contents;
}

.standalone-app__stage :deep(.lumal-cockpit) {
  position: absolute;
  inset: 0;
}

.standalone-app__designer {
  position: fixed;
  inset: 0;
  z-index: 2050;
}

.standalone-app__designer-close {
  --el-button-bg-color: color-mix(in srgb, var(--lumal-cockpit-floating-bg, #071b2a), transparent 4%);
  --el-button-border-color: var(--lumal-cockpit-border, rgb(72 187 211 / 22%));
  --el-button-text-color: var(--lumal-cockpit-title-text, #eefbff);
  --el-button-hover-bg-color: color-mix(in srgb, var(--lumal-cockpit-accent, #24d8ee), transparent 90%);
  --el-button-hover-border-color: var(--lumal-cockpit-accent, #24d8ee);
  --el-button-hover-text-color: var(--lumal-cockpit-title-text, #eefbff);
}

.standalone-app__heading {
  display: flex;
  align-items: center;
  gap: 30px;
  min-width: 0;
}

.standalone-app__brand {
  position: relative;
  display: grid;
  gap: 3px;
  min-width: 230px;
  padding-left: 14px;
}

.standalone-app__brand::before {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  width: 3px;
  border-radius: 999px;
  background: var(--lumal-cockpit-accent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--lumal-cockpit-accent), transparent 58%);
  content: '';
}

.standalone-app__brand h1 {
  margin: 0;
  color: var(--lumal-cockpit-title-text);
  font: inherit;
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 0.025em;
  line-height: 1.08;
}

.standalone-app__brand span {
  color: var(--lumal-cockpit-text-muted);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
  white-space: nowrap;
}

.standalone-app__brand span {
  color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 48%);
}

.standalone-app__layouts {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 24%);
  border-radius: 12px;
  background: color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 10%);
}

.standalone-app__layouts :deep(.el-button) {
  --el-button-bg-color: transparent;
  --el-button-border-color: transparent;
  --el-button-text-color: var(--lumal-cockpit-text-secondary);
  --el-button-hover-bg-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 92%);
  --el-button-hover-border-color: transparent;
  --el-button-hover-text-color: var(--lumal-cockpit-title-text);
  min-height: 34px;
  padding: 0 15px;
  border-radius: 9px;
  box-shadow: none;
}

.standalone-app__layouts :deep(.el-button.is-active) {
  --el-button-bg-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 90%);
  --el-button-border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 72%);
  --el-button-text-color: var(--lumal-cockpit-title-text);
  box-shadow: inset 0 -2px 0 var(--lumal-cockpit-accent);
}

.standalone-app__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.standalone-app__live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-success), transparent 66%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--lumal-cockpit-success), transparent 94%);
  color: var(--lumal-cockpit-success);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.standalone-app__live i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--lumal-cockpit-success);
  box-shadow: 0 0 8px color-mix(in srgb, var(--lumal-cockpit-success), transparent 20%);
}

.standalone-app__actions :deep(.el-button) {
  --el-button-bg-color: color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 6%);
  --el-button-border-color: var(--lumal-cockpit-border);
  --el-button-text-color: var(--lumal-cockpit-text-secondary);
  --el-button-hover-bg-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 91%);
  --el-button-hover-border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 52%);
  --el-button-hover-text-color: var(--lumal-cockpit-title-text);
  --el-button-active-bg-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 86%);
  --el-button-active-border-color: var(--lumal-cockpit-accent);
  --el-button-active-text-color: var(--lumal-cockpit-title-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
  height: 40px;
  min-height: 40px;
  border-radius: 10px;
  box-shadow: none;
}

.standalone-app__actions button:focus-visible {
  outline: 2px solid var(--lumal-cockpit-focus-ring);
  outline-offset: 2px;
}

@media (max-width: 1360px) {
  .standalone-app__heading {
    gap: 18px;
  }

  .standalone-app__brand {
    min-width: 190px;
  }

  .standalone-app__brand h1 {
    font-size: 22px;
  }

  .standalone-app__layouts :deep(.el-button) {
    padding-inline: 11px;
  }
}
</style>
