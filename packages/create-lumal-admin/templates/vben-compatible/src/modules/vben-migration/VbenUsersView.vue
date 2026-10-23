<script setup lang="ts">
import { service } from '../../app/services/session'
/***********************迁移业务场景装配*********************/
import VbenUsers from './components/VbenUsers.vue'
import '@lumal/vben-compat/style.css'
</script>

<template>
  <main class="lumal-admin-page">
    <VbenUsers :service="service" />
  </main>
</template>
