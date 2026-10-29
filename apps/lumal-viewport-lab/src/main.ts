import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import DashboardPage from './pages/DashboardPage.vue'
import SystemPage from './pages/SystemPage.vue'
import WidthPage from './pages/WidthPage.vue'
import 'element-plus/dist/index.css'
import 'ol/ol.css'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: DashboardPage },
    { path: '/system', component: SystemPage },
    { path: '/width', component: WidthPage },
  ],
})

createApp(App).use(router).mount('#app')
