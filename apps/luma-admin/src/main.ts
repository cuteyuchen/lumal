import type { IconDefinition } from '@luma/icons'
import { createLumaAdmin } from '@luma/core'
import App from './App.vue'
import '@luma/core/theme-chalk/index.scss'
import '@luma/icons/style.css'
import './styles.scss'

/***********************本地图标定义*********************/
const localIcons: IconDefinition[] = [
  {
    key: 'app:dashboard',
    label: '控制台',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/></svg>',
  },
]

/***********************应用启动*********************/
createLumaAdmin({
  rootComponent: App,
  icons: {
    localSvg: localIcons,
  },
}).mount('#app')
