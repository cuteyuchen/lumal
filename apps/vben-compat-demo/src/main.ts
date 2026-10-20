import type { IconDefinition } from '@lumal/icons'
import { createLumalAdmin } from '@lumal/core'
import { createPermissionStore } from '@lumal/core/permission'
import App from './App.vue'
import '@lumal/core/theme-chalk/index.scss'
import '@lumal/core/style.css'
import '@lumal/icons-vue/style.css'
import '@lumal/vben-compat/style.css'
import './styles.scss'

/***********************本地图标定义*********************/
const localIcons: IconDefinition[] = [
  {
    key: 'compat:vben',
    label: 'Vben 兼容',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 5.8 3.2L12 10.7 6.2 7.5 12 4.3ZM5 9.2l6 3.3v6.8l-6-3.4V9.2Zm8 10.1v-6.8l6-3.3v6.7l-6 3.4Z"/></svg>',
  },
]

/***********************应用启动*********************/
createLumalAdmin({
  rootComponent: App,
  permissionStore: createPermissionStore({ roles: ['admin'], permissions: ['user:write'] }),
  icons: {
    localSvg: localIcons,
  },
}).mount('#app')
