import { createLumalAdmin } from '@lumal/core'
import { registerAuthorityDirectives } from '@lumal/core/directives'
import App from './App.vue'
import { localIcons, registerAdminIcons } from './icons'
import { router } from './router'
import { permissionStore } from './services/permission'
import { mockDictionaryFetcher } from './views/examples/dictionary'
import '@lumal/core/theme-chalk/index.scss'
import '@lumal/core/style.css'
import '@lumal/icons-vue/style.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles.scss'

/***********************图标注册*********************/
registerAdminIcons()

/***********************应用启动*********************/
void createLumalAdmin({
  components: false,
  rootComponent: App,
  router,
  dictionary: {
    fetcher: mockDictionaryFetcher,
  },
  icons: {
    localSvg: localIcons,
  },
  permissionStore,
  preset: 'admin-default',
  setup({ app }) {
    registerAuthorityDirectives(app, permissionStore)
  },
}).mount('#app')
