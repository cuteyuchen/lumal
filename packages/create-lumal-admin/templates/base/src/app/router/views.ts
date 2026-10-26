import type { AppModule } from '../module';
import { assembleModules } from '../module';

// 只加载元数据，页面仍以动态 import 分包；业务子模块无需修改中心注册文件。
const modules = import.meta.glob<AppModule>(['../../modules/*/module.ts', '../../modules/business/*/module.ts'], {
  eager: true,
});
const assembled = assembleModules(Object.values(modules));
export const localMenus = assembled.menus;
export const viewComponents = { ...assembled.views, 'app/iframe': () => import('../views/SafeIframeView.vue') };
export const permissionTree = assembled.permissions;
export const permissionCodes = assembled.permissionCodes;
