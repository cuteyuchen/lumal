<script setup lang="ts">
import CooperativePanel from './cooperative/CooperativePanel.vue'
import RuntimeCanvas from './runtime/RuntimeCanvas.vue'
import ScreenPanel from './screen/ScreenPanel.vue'
</script>

<template>
  <main>
    <ScreenPanel />
    <RuntimeCanvas />
    <CooperativePanel />
  </main>
</template>
