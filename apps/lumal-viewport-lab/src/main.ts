import { createViewportPlugin } from '@lumal/viewport'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import DashboardPage from './pages/DashboardPage.vue'
import SystemPage from './pages/SystemPage.vue'
import 'element-plus/dist/index.css'
import 'ol/ol.css'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: DashboardPage, meta: { viewport: { mode: 'responsive', designWidth: 1920, designHeight: 964, minFontSize: 12 } } },
    { path: '/system', component: SystemPage, meta: { viewport: false } },
  ],
})

// 应用级默认只供显式使用 LumalViewport 的区域读取，不修改 DOM 根。
createApp(App).use(createViewportPlugin({ mode: 'responsive' })).use(router).mount('#app')
