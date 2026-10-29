import { createApp } from 'vue'
import App from './App.vue'
import { enforceDarkThemeMode } from './services/preferences'
import 'element-plus/dist/index.css'
import '@lumal/cockpit/style.css'
import '@lumal/datav/style.css'
import '@lumal/icons-vue/style.css'
import './styles/index.css'
import './styles/designer.css'
import './styles/designer-detail.css'
import './styles/motion.css'

// 纯暗色大屏：清掉历史存档里可能残留的浅色偏好
enforceDarkThemeMode()

createApp(App).mount('#app')
