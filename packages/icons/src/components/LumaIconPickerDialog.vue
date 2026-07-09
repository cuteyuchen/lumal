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
  background: rgb(15 23 42 / 32%);
}

.luma-icon-picker-dialog__body {
  width: min(520px, 100%);
  max-height: min(520px, 80vh);
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgb(15 23 42 / 18%);
}
</style>
