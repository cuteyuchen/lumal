<script setup lang="ts">
import ScreenView from './ScreenView.vue';
</script>

<template>
  <div class="screen-entry">
    <ScreenView />
  </div>
</template>

<style scoped>
.screen-entry {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 0;
}
</style>
