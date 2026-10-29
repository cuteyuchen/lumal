<script setup lang="ts">
import type { LumalPreferences, LumalPreferencesDefaults, LumalPreferencesVisibility } from '@lumal/core/theme'
import { LumalThemeSettingsPanel } from '@lumal/core/theme'
import { viewportLength } from '@lumal/viewport'
import { ElDrawer } from 'element-plus'
import { computed } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  defaults?: LumalPreferencesDefaults
  preferences: LumalPreferences
  visibility?: LumalPreferencesVisibility
  visible?: boolean
}>(), {
  visible: false,
})

const emit = defineEmits<{
  'change': [preferences: LumalPreferences]
  'reset': [preferences: LumalPreferences]
  'update:preferences': [preferences: LumalPreferences]
  'update:visible': [visible: boolean]
}>()

/***********************双向绑定代理*********************/
const visibleModel = computed({
  get: () => props.visible,
  set: visible => emit('update:visible', visible),
})

/***********************事件处理*********************/
function handleChange(nextPreferences: LumalPreferences): void {
  emit('change', nextPreferences)
}

function handlePreferencesUpdate(nextPreferences: LumalPreferences): void {
  emit('update:preferences', nextPreferences)
}

function handleReset(nextPreferences: LumalPreferences): void {
  emit('reset', nextPreferences)
}
</script>

<template>
  <ElDrawer
    v-model="visibleModel"
    class="lumal-admin-settings-drawer"
    title="偏好设置"
    :size="viewportLength(384)"
    append-to-body
    destroy-on-close
  >
    <template #header>
      <strong class="lumal-admin-settings-drawer__title">偏好设置</strong>
    </template>
    <LumalThemeSettingsPanel
      :defaults="defaults"
      :preferences="preferences"
      :visibility="visibility"
      @change="handleChange"
      @reset="handleReset"
      @update:preferences="handlePreferencesUpdate"
    />
  </ElDrawer>
</template>

<style lang="scss">
.lumal-admin-settings-drawer {
  max-width: 100%;
  background: var(--el-bg-color);
}

.lumal-admin-settings-drawer .el-drawer__header {
  min-height: 64px;
  flex: none;
  margin: 0;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
}

.lumal-admin-settings-drawer .el-drawer__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 16px 16px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.lumal-admin-settings-drawer__title {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: calc(var(--lumal-font-size-base, 14px) * 1.14285714);
  font-weight: 600;
  line-height: 1.5;
}

@media (max-width: 640px) {
  html:has(.lumal-layout.is-responsive, .public-layout.is-responsive) .lumal-admin-settings-drawer {
    width: min(384px, 100vw) !important;
  }

  html:has(.lumal-layout.is-responsive, .public-layout.is-responsive) .lumal-admin-settings-drawer .el-drawer__header,
  html:has(.lumal-layout.is-responsive, .public-layout.is-responsive) .lumal-admin-settings-drawer .el-drawer__body {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>
