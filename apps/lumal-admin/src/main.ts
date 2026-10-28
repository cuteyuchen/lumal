import { registerAuthorityDirectives } from '@lumal/core/directives'
import { createLumalAdmin } from '@lumal/core/minimal'
import { createViewportPlugin } from '@lumal/viewport'
import { viewportDesign } from '../viewport.config'
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
    app.use(createViewportPlugin({ ...viewportDesign, mode: 'responsive' }))
  },
}).mount('#app')
