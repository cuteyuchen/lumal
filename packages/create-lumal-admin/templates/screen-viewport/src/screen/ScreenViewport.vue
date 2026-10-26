<script setup lang="ts">
import { LumalViewport } from '@lumal/viewport';
import { viewportPolicy } from '../../viewport.config';
</script>

<template>
  <div class="screen-viewport">
    <LumalViewport :policy="viewportPolicy">
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
