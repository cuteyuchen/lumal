<script setup lang="ts">
/***********************迁移业务场景装配*********************/
import VbenUsers from '../../components/migration/VbenUsers.vue'
import { service } from '../../services/session'
</script>

<template>
  <main class="lumal-admin-page">
    <VbenUsers :service="service" />
  </main>
</template>
