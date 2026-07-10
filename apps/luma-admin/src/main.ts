import type { IconDefinition } from '@luma/icons'
import { createLumaAdmin } from '@luma/core'
import { registerAuthorityDirectives } from '@luma/core/directives'
import App from './App.vue'
import { router } from './router'
import { permissionStore } from './services/permission'
import { mockDictionaryFetcher } from './views/examples/dictionary'
import './echarts'
import '@luma/core/theme-chalk/index.scss'
import '@luma/core/style.css'
import '@luma/icons/style.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
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
    key: 'app:system',
    label: '系统',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v4H4V4Zm0 6h7v10H4V10Zm9 0h7v4h-7v-4Zm0 6h7v4h-7v-4Z"/></svg>',
  },
  {
    key: 'app:user',
    label: '用户',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0H4Z"/></svg>',
  },
  {
    key: 'app:role',
    label: '角色',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 5a3 3 0 0 1 1.2 5.75A5.5 5.5 0 0 1 17.2 17H6.8a5.5 5.5 0 0 1 4-4.25A3 3 0 0 1 12 7Z"/></svg>',
  },
  {
    key: 'app:menu',
    label: '菜单',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h10v2H4v-2Z"/></svg>',
  },
  {
    key: 'app:dict',
    label: '字典',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h11a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3V4a1 1 0 0 1 1-1Zm2 14a1 1 0 0 0 0 2h10v-2H7Zm1-10h7V5H8v2Zm0 4h7V9H8v2Z"/></svg>',
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
    key: 'app:settings',
    label: '设置',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65-2-3.46-2.49 1a7.28 7.28 0 0 0-1.69-.98L15 3h-4l-.36 2.93c-.6.23-1.17.56-1.69.98l-2.49-1-2 3.46 2.11 1.65c-.04.32-.07.65-.07.98s.02.66.07.98l-2.11 1.65 2 3.46 2.49-1c.52.4 1.09.74 1.69.98L11 21h4l.36-2.93c.6-.23 1.17-.56 1.69-.98l2.49 1 2-3.46-2.11-1.65ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z"/></svg>',
  },
  {
    key: 'app:logout',
    label: '退出登录',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3h9Zm3-10H9a2 2 0 0 0-2 2v2h2V5h10v14H9v-2H7v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/></svg>',
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
  setup({ app }) {
    registerAuthorityDirectives(app, permissionStore)
  },
}).mount('#app')
