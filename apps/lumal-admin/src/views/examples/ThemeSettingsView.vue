<script setup lang="ts">
import type { LumalPreferences } from '@lumal/core/theme'
import { LumalInfoTable, LumalPage } from '@lumal/core/components'
import {
  LumalThemeSettingsPanel,
  resolveThemeMode,
} from '@lumal/core/theme'
import { LumalIcon } from '@lumal/icons-vue'
import { ElButton, ElTag } from 'element-plus'
import { computed } from 'vue'
import {
  adminPreferenceDefaults,
  adminPreferences,
  patchAdminPreferences,
} from '../../services/preferences'
import { openAdminSettings } from '../../services/settings'

/***********************偏好状态*********************/
const preferences = computed<LumalPreferences>({
  get: () => adminPreferences.value,
  set: value => patchAdminPreferences(value),
})

const resolvedMode = computed(() => resolveThemeMode(preferences.value.theme.mode, {
  matchMedia: query => ({
    matches: query.includes('dark'),
  }) as MediaQueryList,
}))

const preferenceItems = computed(() => [
  { label: '主题模式', value: preferences.value.theme.mode },
  { label: '解析模式', value: resolvedMode.value },
  { label: '主题色', value: preferences.value.theme.colorPrimary },
  { label: '布局模式', value: preferences.value.app.layout },
  { label: '圆角比例', value: preferences.value.theme.radiusScale.toFixed(2) },
  { label: '侧边栏宽度', value: `${preferences.value.sidebar.width}px` },
  { label: '标签页', value: preferences.value.tabbar.enable ? 'enabled' : 'disabled' },
  { label: '页面动画', value: preferences.value.transition.enable ? preferences.value.transition.name : 'disabled' },
])

const previewStyle = computed(() => ({
  '--lumal-admin-example-preview-color': preferences.value.theme.colorPrimary,
  '--lumal-admin-example-preview-radius': `${Math.round(8 * preferences.value.theme.radiusScale)}px`,
}))

/***********************事件处理*********************/
</script>

<template>
  <main class="lumal-admin-example is-fill">
    <LumalPage title="主题与动画" description="使用 LumalThemeSettingsPanel 驱动主题、动画和布局偏好。" fill>
      <template #actions>
        <LumalIcon name="lumal:palette" :size="22" title="主题设置" />
      </template>
      <div class="theme-entry">
        <div>
          <strong>全局偏好设置</strong>
          <p>内嵌面板与右侧设置抽屉共享同一份偏好，修改后会立即作用于当前系统。</p>
        </div>
        <ElButton type="primary" @click="openAdminSettings">
          打开右侧全局设置
        </ElButton>
      </div>
      <div class="lumal-admin-example__theme-layout">
        <LumalThemeSettingsPanel
          v-model:preferences="preferences"
          :defaults="adminPreferenceDefaults"
          class="lumal-admin-example__theme-panel"
        />

        <div class="lumal-admin-example__theme-detail">
          <div class="lumal-admin-example__theme-preview" :style="previewStyle">
            <strong>Lumal Theme Preview</strong>
            <span>主题变量会影响预览区颜色和圆角。</span>
            <div>
              <ElTag effect="dark">
                Primary
              </ElTag><ElButton>普通按钮</ElButton>
            </div>
          </div>

          <LumalInfoTable :items="preferenceItems" :columns="2" :label-width="96" />
        </div>
      </div>
    </LumalPage>
  </main>
</template>

<style scoped lang="scss">
.lumal-admin-example.is-fill :deep(.lumal-page__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.theme-entry {
  display: flex;
  flex: none;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
  margin-bottom: 16px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 10px;
  background: var(--el-color-primary-light-9);
}

.theme-entry p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.lumal-admin-example__theme-layout {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 24px;
  align-items: stretch;
  min-height: 0;
  overflow: hidden;
}

.lumal-admin-example__theme-panel {
  display: flex;
  flex: 0 1 380px;
  flex-direction: column;
  width: min(100%, 380px);
  max-height: 100%;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.lumal-admin-example__theme-detail {
  display: flex;
  flex: 1 1 280px;
  flex-direction: column;
  gap: 16px;
  min-width: 280px;
  min-height: 0;
  overflow: auto;
}

@media (max-width: 960px) {
  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .lumal-admin-example.is-fill :deep(.lumal-page__body),
  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .lumal-admin-example__theme-layout {
    overflow: auto;
  }

  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .lumal-admin-example__theme-panel {
    max-height: min(70vh, 640px);
  }
}
</style>
