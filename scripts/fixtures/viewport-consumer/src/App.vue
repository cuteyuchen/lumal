<script setup lang="ts">
import CooperativePanel from './cooperative/CooperativePanel.vue'
import FullPage from './full-page/FullPage.vue'
import RuntimeCanvas from './runtime/RuntimeCanvas.vue'
import ScreenPanel from './screen/ScreenPanel.vue'
</script>

<template>
  <main>
    <ScreenPanel />
    <RuntimeCanvas />
    <CooperativePanel />
    <FullPage />
  </main>
</template>
