import type { IconDefinition } from '@luma/icons'
import { createLumaAdmin } from '@luma/core'
import LumaDatav from '@luma/datav'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import { router } from './router'
import '@luma/core/theme-chalk/index.scss'
import '@luma/core/style.css'
import '@luma/icons-vue/style.css'
import '@luma/datav/style.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.scss'

/***********************导航分组图标*********************/
const guideIcons: IconDefinition[] = [
  { key: 'guide:book', label: '指南', source: 'local-svg', svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h11a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3V4a1 1 0 0 1 1-1Zm2 14a1 1 0 0 0 0 2h10v-2H7Zm1-10h7V5H8v2Zm0 4h7V9H8v2Z"/></svg>' },
  { key: 'guide:border', label: '边框', source: 'local-svg', svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3V3Zm2 2v14h14V5H5Zm2 2h10v10H7V7Z"/></svg>' },
  { key: 'guide:decoration', label: '装饰', source: 'local-svg', svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 2 2.4 5.6L20 8l-4.5 3.9L17 18l-5-3.2L7 18l1.5-6.1L4 8l5.6-.4L12 2Z"/></svg>' },
  { key: 'guide:digital', label: '数字', source: 'local-svg', svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4V4Zm2 2v12h12V6H6Zm2 2h3v8H8v-1h2V9H8V8Zm5 0h3v8h-1V9h-2V8Z"/></svg>' },
  { key: 'guide:chart', label: '图表', source: 'local-svg', svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h2v16h14v2H5a2 2 0 0 1-2-2V3h2Zm5 13H8V9h2v7Zm4 0h-2V5h2v11Zm4 0h-2v-5h2v5Z"/></svg>' },
  { key: 'guide:flyline', label: '飞线', source: 'local-svg', svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm16-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-9 3a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-4.3 1.3 3-3 1.4 1.4-3 3-1.4-1.4Zm6.7-3.9 3.2-3.2 1.4 1.4-3.2 3.2-1.4-1.4Z"/></svg>' },
  { key: 'guide:board', label: '轮播表', source: 'local-svg', svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14H4V5Zm2 3v3h12V8H6Zm0 5v3h12v-3H6Z"/></svg>' },
  { key: 'guide:container', label: '容器', source: 'local-svg', svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z"/></svg>' },
]

/***********************应用启动*********************/
void createLumaAdmin({
  elementPlus: {
    options: { locale: zhCn },
    plugin: ElementPlus,
  },
  rootComponent: App,
  router,
  preset: 'minimal',
  icons: {
    localSvg: guideIcons,
  },
  setup({ app }) {
    app.use(LumaDatav)
  },
}).mount('#app')
