<script setup lang="ts">
import type { LumalPreferences, LumalPreferencesDefaults } from '@lumal/core/theme'
import { LumalThemeSettingsPanel } from '@lumal/core/theme'
import { ElDrawer } from 'element-plus'
import { computed } from 'vue'

/***********************偏好设置抽屉*********************/
const props = defineProps<{
  defaults: LumalPreferencesDefaults
  preferences: LumalPreferences
  visible: boolean
}>()

const emit = defineEmits<{
  'change': [preferences: LumalPreferences]
  'reset': [preferences: LumalPreferences]
  'update:preferences': [preferences: LumalPreferences]
  'update:visible': [visible: boolean]
}>()

const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})
</script>

<template>
  <ElDrawer v-model="visible" title="偏好设置" size="384px" append-to-body>
    <LumalThemeSettingsPanel
      :defaults="defaults"
      :preferences="preferences"
      @change="$emit('change', $event)"
      @reset="$emit('reset', $event)"
      @update:preferences="$emit('update:preferences', $event)"
    />
  </ElDrawer>
</template>
