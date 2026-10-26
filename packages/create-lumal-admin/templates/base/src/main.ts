import type { IconDefinition } from '@lumal/icons';
import { registerAuthorityDirectives } from '@lumal/core/directives';
import { createLumalAdmin } from '@lumal/core/minimal';
import App from './App.vue';
import { router } from './app/router';
import { permissionStore } from './app/services/access';
import '@lumal/core/theme-chalk/index.scss';
import '@lumal/core/style.css';
import '@lumal/icons-vue/style.css';
import 'element-plus/theme-chalk/el-alert.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './styles.scss';

/***********************本地图标定义*********************/
const localIcons: IconDefinition[] = [
  {
    key: 'app:dashboard',
    label: '控制台',
    source: 'local-svg',
    svgText:
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/></svg>',
  },
];

/***********************应用启动*********************/
const framework = createLumalAdmin({
  rootComponent: App,
  router,
  permissionStore,
  icons: {
    localSvg: localIcons,
  },
});

registerAuthorityDirectives(framework.app, permissionStore);
void framework.mount('#app').catch((error: unknown) => {
  console.error('应用启动失败', error);
  const element = document.getElementById('app');
  if (element) element.textContent = '应用启动失败，请检查配置与控制台。';
});
