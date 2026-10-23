import type { AppModule } from '../../../app/module';

export const menus: AppModule['menus'] = [
  {
    path: '/system/organizations',
    name: 'SystemOrganizations',
    component: 'system/organizations',
    meta: { title: '机构管理', authority: ['system:organization:list'], keepAlive: true, order: 4 },
  },
];
export const views: AppModule['views'] = { 'system/organizations': () => import('./OrganizationView.vue') };
export const permissions: AppModule['permissions'] = [
  {
    id: 'system-organization',
    label: '机构管理',
    children: [
      { id: 'system:organization:list', label: '查询机构', permission: 'system:organization:list' },
      { id: 'system:organization:create', label: '新增机构', permission: 'system:organization:create' },
      { id: 'system:organization:update', label: '修改机构', permission: 'system:organization:update' },
      { id: 'system:organization:delete', label: '删除机构', permission: 'system:organization:delete' },
    ],
  },
];
