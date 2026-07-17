<script setup lang="ts">
import type { LumaPreferences } from '@luma/core/theme'
import { LumaThemeSettingsPanel } from '@luma/core/theme'
import { LumaIcon } from '@luma/icons-vue'
import { ElDrawer } from 'element-plus'
import { computed } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  defaults?: import('@luma/core/theme').LumaPreferencesDefaults
  preferences: LumaPreferences
  visible?: boolean
}>(), {
  visible: false,
})

const emit = defineEmits<{
  'change': [preferences: LumaPreferences]
  'reset': [preferences: LumaPreferences]
  'update:preferences': [preferences: LumaPreferences]
  'update:visible': [visible: boolean]
}>()

/***********************双向绑定代理*********************/
const visibleModel = computed({
  get: () => props.visible,
  set: visible => emit('update:visible', visible),
})

/***********************事件处理*********************/
function handleChange(nextPreferences: LumaPreferences): void {
  emit('change', nextPreferences)
}

function handlePreferencesUpdate(nextPreferences: LumaPreferences): void {
  emit('update:preferences', nextPreferences)
}

function handleReset(nextPreferences: LumaPreferences): void {
  emit('reset', nextPreferences)
}
</script>

<template>
  <ElDrawer
    v-model="visibleModel"
    class="luma-admin-settings-drawer"
    title="偏好设置"
    size="384px"
    append-to-body
    destroy-on-close
  >
    <template #header>
      <div class="luma-admin-settings-drawer__title">
        <span class="luma-admin-settings-drawer__title-icon">
          <LumaIcon name="luma:settings" :size="18" />
        </span>
        <span class="luma-admin-settings-drawer__title-copy">
          <strong>偏好设置</strong>
          <small>自定义偏好设置 &amp; 实时预览</small>
        </span>
      </div>
    </template>
    <LumaThemeSettingsPanel
      :defaults="defaults"
      :preferences="preferences"
      @change="handleChange"
      @reset="handleReset"
      @update:preferences="handlePreferencesUpdate"
    />
  </ElDrawer>
</template>

<style lang="scss">
.luma-admin-settings-drawer {
  max-width: 100%;
  background: var(--el-bg-color-page);
}

.luma-admin-settings-drawer .el-drawer__header {
  min-height: 64px;
  margin: 0;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
}

.luma-admin-settings-drawer .el-drawer__body {
  height: calc(100% - 64px);
  min-height: 0;
  padding: 0 12px 12px;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.luma-admin-settings-drawer__title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-primary);
}

.luma-admin-settings-drawer__title-icon {
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

.luma-admin-settings-drawer__title-copy {
  display: grid;
  gap: 2px;
}

.luma-admin-settings-drawer__title-copy strong {
  font-size: calc(var(--luma-font-size-base, 14px) + 2px);
  font-weight: 700;
  line-height: 1.25;
}

.luma-admin-settings-drawer__title-copy small {
  color: var(--el-text-color-secondary);
  font-size: calc(var(--luma-font-size-base, 14px) - 3px);
  font-weight: 400;
  line-height: 1.25;
}

@media (max-width: 640px) {
  .luma-admin-settings-drawer {
    width: min(384px, 100vw) !important;
  }

  .luma-admin-settings-drawer .el-drawer__header,
  .luma-admin-settings-drawer .el-drawer__body {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>
