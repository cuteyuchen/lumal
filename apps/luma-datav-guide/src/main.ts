import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import '@luma/datav/style.css'
import './styles/index.scss'

createApp(App).use(router).mount('#app')
