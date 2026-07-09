<script setup lang="ts">
import type { IconDefinition } from '../types'
import { computed } from 'vue'
import { getRegisteredIconDefinitions } from '../registry/icons'
import LumaIcon from './LumaIcon.vue'

/***********************模型定义*********************/
const model = defineModel<string>()

/***********************图标列表*********************/
const icons = computed<IconDefinition[]>(() => getRegisteredIconDefinitions())
</script>

<template>
  <div class="luma-icon-picker">
    <button
      v-for="iconItem in icons"
      :key="iconItem.key"
      class="luma-icon-picker__item"
      type="button"
      :title="iconItem.label"
      @click="model = iconItem.key"
    >
      <LumaIcon :name="iconItem.key" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.luma-icon-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 8px;
}

.luma-icon-picker__item {
  display: inline-flex;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  background: #ffffff;
  cursor: pointer;
}
</style>
