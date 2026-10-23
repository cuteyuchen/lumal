<script setup lang="ts">
import { LumalViewport } from '@lumal/viewport';

/***********************只适配实际内容区，登录栏独立占位*********************/
const policy = {
  mode: /* VIEWPORT_MODE */ 'contain',
  designWidth: 1920,
  designHeight: 1080,
  minFontSize: 12,
} as const;
</script>

<template>
  <div class="screen-viewport">
    <LumalViewport :policy="policy">
      <slot />
    </LumalViewport>
  </div>
</template>

<style scoped>
.screen-viewport {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.screen-viewport :deep([data-viewport-mode='vw'] .screen-view) {
  padding: max(16px, calc(32 * var(--lumal-viewport-x-unit)));
}
</style>
