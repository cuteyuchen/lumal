<script setup lang="ts">
import LumaIconPicker from './LumaIconPicker.vue'

/***********************模型定义*********************/
const visible = defineModel<boolean>('visible', { default: false })
const iconValue = defineModel<string>()
</script>

<template>
  <div v-if="visible" class="luma-icon-picker-dialog">
    <div class="luma-icon-picker-dialog__body">
      <LumaIconPicker v-model="iconValue" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.luma-icon-picker-dialog {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, CanvasText 32%, transparent);
}

.luma-icon-picker-dialog__body {
  width: min(520px, 100%);
  max-height: min(520px, 80vh);
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  background: var(--el-bg-color, Canvas);
  box-shadow: var(--luma-shadow-base, 0 18px 48px color-mix(in srgb, CanvasText 18%, transparent));
}
</style>
