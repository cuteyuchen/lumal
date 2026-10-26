import type { AppModule } from '../../../app/module';

export const menus: AppModule['menus'] = [
  {
    path: '/system/menus',
    name: 'SystemMenus',
    component: 'system/menus',
    meta: { title: '菜单管理', authority: ['system:menu:list'], keepAlive: true, order: 3 },
  },
];
export const views: AppModule['views'] = { 'system/menus': () => import('./MenuView.vue') };
export const permissions: AppModule['permissions'] = [
  {
    id: 'system-menu',
    label: '菜单管理',
    children: [
      { id: 'system:menu:list', label: '查询菜单', permission: 'system:menu:list' },
      { id: 'system:menu:create', label: '新增节点', permission: 'system:menu:create' },
      { id: 'system:menu:update', label: '修改节点', permission: 'system:menu:update' },
      { id: 'system:menu:delete', label: '删除节点', permission: 'system:menu:delete' },
    ],
  },
];
