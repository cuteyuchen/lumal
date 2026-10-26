import type { AppModule } from '../../../app/module';

export const menus: AppModule['menus'] = [
  {
    path: '/system/dictionaries/types',
    name: 'DictionaryTypes',
    component: 'system/dictionaries/types',
    meta: { title: '字典分类', authority: ['system:dict:list'], keepAlive: true, order: 5 },
  },
  {
    path: '/system/dictionaries/items',
    name: 'DictionaryItems',
    component: 'system/dictionaries/items',
    meta: { title: '字典项管理', authority: ['system:dict:list'], keepAlive: true, order: 6 },
  },
];
export const views: AppModule['views'] = {
  'system/dictionaries/types': () => import('./DictionaryTypeView.vue'),
  'system/dictionaries/items': () => import('./DictionaryItemView.vue'),
};
export const permissions: AppModule['permissions'] = [
  {
    id: 'system-dictionary',
    label: '字典管理',
    children: [
      { id: 'system:dict:list', label: '查询字典', permission: 'system:dict:list' },
      { id: 'system:dict:create', label: '新增字典', permission: 'system:dict:create' },
      { id: 'system:dict:update', label: '修改字典', permission: 'system:dict:update' },
      { id: 'system:dict:delete', label: '删除字典', permission: 'system:dict:delete' },
    ],
  },
];
