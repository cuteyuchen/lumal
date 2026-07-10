import type { IconDefinition } from '@luma/icons'
import { createLumaAdmin } from '@luma/core'
import App from './App.vue'
import { router } from './router'
import { mockDictionaryFetcher } from './views/examples/dictionary'
import './echarts'
import '@luma/core/theme-chalk/index.scss'
import '@luma/core/style.css'
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
  {
    key: 'app:examples',
    label: '示例',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"/></svg>',
  },
  {
    key: 'app:form',
    label: '表单',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 5h10V6H7v2Zm0 5h10v-2H7v2Zm0 5h6v-2H7v2Z"/></svg>',
  },
  {
    key: 'app:table',
    label: '表格',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14H4V5Zm2 4h4V5H6v4Zm6 0h6V5h-6v4Zm-6 4h4v-2H6v2Zm6 0h6v-2h-6v2Zm-6 4h4v-2H6v2Zm6 0h6v-2h-6v2Z"/></svg>',
  },
  {
    key: 'app:theme',
    label: '主题',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 0 0 0 18h1.5a2.5 2.5 0 0 0 1.8-4.24l-.43-.44a1.2 1.2 0 0 1 .86-2.02H17a4 4 0 0 0 3.74-5.43A9.02 9.02 0 0 0 12 3Zm-4 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm4-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm-4 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>',
  },
  {
    key: 'app:chart',
    label: '图表',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h2v16h14v2H5a2 2 0 0 1-2-2V3h2Zm5 13H8V9h2v7Zm4 0h-2V5h2v11Zm4 0h-2v-5h2v5Z"/></svg>',
  },
]

/***********************应用启动*********************/
createLumaAdmin({
  rootComponent: App,
  router,
  dictionary: {
    fetcher: mockDictionaryFetcher,
  },
  icons: {
    localSvg: localIcons,
  },
}).mount('#app')
