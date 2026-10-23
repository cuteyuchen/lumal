<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="lab-header">
    <strong>Lumal 视口验收</strong>
    <nav>
      <RouterLink to="/dashboard">
        工作台
      </RouterLink><RouterLink to="/system">
        系统管理
      </RouterLink>
    </nav>
  </header>
  <div class="lab-tabs">
    默认工作区
  </div>
  <main class="lab-main">
    <RouterView v-slot="{ Component }">
      <KeepAlive :max="2">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </main>
</template>
