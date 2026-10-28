import { registerAuthorityDirectives } from '@lumal/core/directives'
import { createLumalAdmin } from '@lumal/core/minimal'
import App from './App.vue'
import { localIcons, registerAdminIcons } from './icons'
import { router } from './router'
import { permissionStore } from './services/permission'
import { mockDictionaryFetcher } from './views/examples/dictionary'
import './styles/element-plus'
import '@lumal/core/style.css'
import '@lumal/icons-vue/style.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles.scss'

/***********************图标注册*********************/
registerAdminIcons()

/***********************应用启动*********************/
try {
  // 仅删除已移除的适配模式偏好，不触碰认证、业务和主题数据。
  localStorage.removeItem('lumal-admin:workspace-viewport')
}
catch {
  // 禁用本地存储不影响应用启动。
}
void createLumalAdmin({
  rootComponent: App,
  router,
  dictionary: {
    fetcher: mockDictionaryFetcher,
  },
  icons: {
    localSvg: localIcons,
  },
  permissionStore,
  setup({ app }) {
    registerAuthorityDirectives(app, permissionStore)
  },
}).mount('#app')
