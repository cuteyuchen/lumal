<script setup lang="ts">
import { LumalViewport } from '@lumal/viewport'
import { viewportPolicy } from '../../viewport.config'
</script>

<template>
  <LumalViewport :policy="viewportPolicy">
    <div class="runtime-canvas" style="width: 192px; height: 96px" />
  </LumalViewport>
</template>

<style scoped>
.runtime-canvas {
  width: 192px;
  height: 96px;
}
</style>
