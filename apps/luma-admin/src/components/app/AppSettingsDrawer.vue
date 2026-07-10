<script setup lang="ts">
import type { LumaPreferences } from '@luma/core/theme'
import { LumaThemeSettingsPanel } from '@luma/core/theme'
import { ElDrawer } from 'element-plus'
import { computed } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  preferences: LumaPreferences
  visible?: boolean
}>(), {
  visible: false,
})

const emit = defineEmits<{
  'change': [preferences: LumaPreferences]
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
</script>

<template>
  <ElDrawer
    v-model="visibleModel"
    class="luma-admin-settings-drawer"
    title="主题与布局设置"
    size="420px"
    append-to-body
    destroy-on-close
  >
    <LumaThemeSettingsPanel
      :preferences="preferences"
      @change="handleChange"
      @update:preferences="handlePreferencesUpdate"
    />
  </ElDrawer>
</template>

<style lang="scss">
.luma-admin-settings-drawer {
  max-width: 100%;
}

.luma-admin-settings-drawer .el-drawer__header {
  min-height: 64px;
  margin: 0;
  padding: 0 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  font-weight: 700;
}

.luma-admin-settings-drawer .el-drawer__body {
  padding: 24px;
}

@media (max-width: 640px) {
  .luma-admin-settings-drawer {
    width: min(420px, 100vw) !important;
  }

  .luma-admin-settings-drawer .el-drawer__header,
  .luma-admin-settings-drawer .el-drawer__body {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>
