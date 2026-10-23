import type { AppModule } from '../../../app/module';

export const menus: AppModule['menus'] = [
  {
    path: '/system/config',
    name: 'SystemConfig',
    component: 'system/config',
    meta: { title: '系统配置', authority: ['system:config:view'], keepAlive: true, order: 7 },
  },
];
export const views: AppModule['views'] = { 'system/config': () => import('./ConfigView.vue') };
export const permissions: AppModule['permissions'] = [
  {
    id: 'system-config',
    label: '系统配置',
    children: [
      { id: 'system:config:view', label: '查看配置', permission: 'system:config:view' },
      { id: 'system:config:update', label: '保存配置', permission: 'system:config:update' },
    ],
  },
];
