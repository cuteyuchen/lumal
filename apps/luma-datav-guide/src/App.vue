<script setup lang="ts">
import { ref } from 'vue'
import { navGroups } from './navigation'

const sidebarOpen = ref(false)

function closeSidebar(): void {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="app-shell">
    <header class="app-topbar">
      <button
        class="app-topbar__toggle"
        type="button"
        aria-label="切换导航"
        @click="sidebarOpen = !sidebarOpen"
      >
        <span />
        <span />
        <span />
      </button>
      <div class="app-topbar__brand">
        <strong>@luma/datav</strong>
        <span>组件指南</span>
      </div>
      <a
        class="app-topbar__link"
        href="https://github.com/jiaminghi/DataV"
        target="_blank"
        rel="noreferrer"
      >
        DataV 2.10.0 基准
      </a>
    </header>

    <div class="app-body">
      <aside class="app-sidebar" :class="{ 'app-sidebar--open': sidebarOpen }">
        <nav class="app-nav">
          <section v-for="group in navGroups" :key="group.key" class="app-nav__group">
            <h2 class="app-nav__title">
              {{ group.label }}
            </h2>
            <ul class="app-nav__list">
              <li v-for="item in group.items" :key="item.slug">
                <RouterLink
                  class="app-nav__link"
                  :to="`/${item.slug}`"
                  @click="closeSidebar"
                >
                  <span class="app-nav__link-title">{{ item.title }}</span>
                  <span class="app-nav__link-summary">{{ item.summary }}</span>
                </RouterLink>
              </li>
            </ul>
          </section>
        </nav>
      </aside>

      <div
        v-if="sidebarOpen"
        class="app-scrim"
        @click="closeSidebar"
      />

      <main class="app-content">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </main>
    </div>
  </div>
</template>
