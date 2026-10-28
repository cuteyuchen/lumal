<script setup lang="ts">
import type { LumalPreferences } from '@lumal/core/theme'
import { LumalThemeSettingsPanel } from '@lumal/core/theme'
import { LumalIcon } from '@lumal/icons-vue'
import { ElDrawer } from 'element-plus'
import { computed } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  defaults?: import('@lumal/core/theme').LumalPreferencesDefaults
  preferences: LumalPreferences
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
    size="calc(384 * var(--lumal-viewport-unit, 1px))"
    append-to-body
    destroy-on-close
  >
    <template #header>
      <div class="lumal-admin-settings-drawer__title">
        <span class="lumal-admin-settings-drawer__title-icon">
          <LumalIcon name="lumal:settings" :size="18" />
        </span>
        <span class="lumal-admin-settings-drawer__title-copy">
          <strong>偏好设置</strong>
          <small>自定义偏好设置 &amp; 实时预览</small>
        </span>
      </div>
    </template>
    <LumalThemeSettingsPanel
      :defaults="defaults"
      :preferences="preferences"
      @change="handleChange"
      @reset="handleReset"
      @update:preferences="handlePreferencesUpdate"
    />
  </ElDrawer>
</template>

<style lang="scss">
.lumal-admin-settings-drawer {
  max-width: 100%;
  background: var(--el-bg-color-page);
}

.lumal-admin-settings-drawer .el-drawer__header {
  min-height: 64px;
  margin: 0;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
}

.lumal-admin-settings-drawer .el-drawer__body {
  height: calc(100% - 64px);
  min-height: 0;
  padding: 0 12px 12px;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.lumal-admin-settings-drawer__title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-primary);
}

.lumal-admin-settings-drawer__title-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: none;
  place-items: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.lumal-admin-settings-drawer__title-copy {
  display: grid;
  gap: 2px;
}

.lumal-admin-settings-drawer__title-copy strong {
  font-size: calc(var(--lumal-font-size-base, 14px) + 2px);
  font-weight: 700;
  line-height: 1.25;
}

.lumal-admin-settings-drawer__title-copy small {
  color: var(--el-text-color-secondary);
  font-size: calc(var(--lumal-font-size-base, 14px) - 3px);
  font-weight: 400;
  line-height: 1.25;
}

@media (max-width: 640px) {
  .lumal-admin-settings-drawer {
    width: min(384px, 100vw) !important;
  }

  .lumal-admin-settings-drawer .el-drawer__header,
  .lumal-admin-settings-drawer .el-drawer__body {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>
