<script setup lang="ts">
import type { LumaPreferences } from '@luma/core/theme'
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import {
  LumaThemeSettingsPanel,
  resolveThemeMode,
} from '@luma/core/theme'
import { LumaIcon } from '@luma/icons-vue'
import { ElButton, ElTag } from 'element-plus'
import { computed } from 'vue'
import {
  adminPreferenceDefaults,
  adminPreferences,
  patchAdminPreferences,
} from '../../services/preferences'
import { openAdminSettings } from '../../services/settings'

/***********************偏好状态*********************/
const preferences = computed<LumaPreferences>({
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
  '--luma-admin-example-preview-color': preferences.value.theme.colorPrimary,
  '--luma-admin-example-preview-radius': `${Math.round(8 * preferences.value.theme.radiusScale)}px`,
}))

/***********************事件处理*********************/
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="主题与动画" description="使用 LumaThemeSettingsPanel 驱动主题、动画和布局偏好。">
      <template #actions>
        <LumaIcon name="luma:palette" :size="22" title="主题设置" />
      </template>
      <div class="theme-entry">
        <div><strong>全局偏好设置</strong><p>内嵌面板与右侧设置抽屉共享同一份偏好，修改后会立即作用于当前系统。</p></div><ElButton type="primary" @click="openAdminSettings">
          打开右侧全局设置
        </ElButton>
      </div>
      <div class="luma-admin-example__theme-layout">
        <LumaThemeSettingsPanel
          v-model:preferences="preferences"
          :defaults="adminPreferenceDefaults"
          class="luma-admin-example__theme-panel"
        />

        <div class="luma-admin-example__theme-detail">
          <div class="luma-admin-example__theme-preview" :style="previewStyle">
            <strong>Luma Theme Preview</strong>
            <span>主题变量会影响预览区颜色和圆角。</span>
            <div>
              <ElTag effect="dark">
                Primary
              </ElTag><ElButton>普通按钮</ElButton>
            </div>
          </div>

          <LumaInfoTable :items="preferenceItems" :columns="2" label-width="96px" />
        </div>
      </div>
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.luma-admin-example__theme-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}
.theme-entry{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px;margin-bottom:20px;border:1px solid var(--el-color-primary-light-7);border-radius:10px;background:var(--el-color-primary-light-9)}.theme-entry p{margin:6px 0 0;color:var(--el-text-color-secondary)}

.luma-admin-example__theme-panel {
  flex: 0 1 380px;
  width: min(100%, 380px);
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.luma-admin-example__theme-detail {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-width: 280px;
}
</style>
