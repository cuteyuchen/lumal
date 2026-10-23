import type { AppModule } from '../../../app/module'

export const menus: AppModule['menus'] = [
  { path: '/system/roles', name: 'SystemRoles', component: 'system/roles', meta: { title: '角色管理', authority: ['system:role:list'], keepAlive: true, order: 2 } },
]
export const views: AppModule['views'] = { 'system/roles': () => import('./RoleView.vue') }
export const permissions: AppModule['permissions'] = [
  { id: 'system-role', label: '角色管理', children: [
    { id: 'system:role:list', label: '查询角色', permission: 'system:role:list' },
    { id: 'system:role:create', label: '新增角色', permission: 'system:role:create' },
    { id: 'system:role:update', label: '修改角色', permission: 'system:role:update' },
    { id: 'system:role:delete', label: '删除角色', permission: 'system:role:delete' },
    { id: 'system:role:authorize', label: '角色授权', permission: 'system:role:authorize' },
  ] },
]
