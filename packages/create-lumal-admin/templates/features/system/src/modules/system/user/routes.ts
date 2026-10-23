import type { AppModule } from '../../../app/module'

export const menus: AppModule['menus'] = [
  { path: '/system/users', name: 'SystemUsers', component: 'system/users', meta: { title: '用户管理', icon: 'lumal:user', authority: ['system:user:list'], keepAlive: true, order: 1 } },
]
export const views: AppModule['views'] = { 'system/users': () => import('./UserView.vue') }
// 只声明真实存在的操作，不根据菜单前缀生成伪权限。
export const permissions: AppModule['permissions'] = [
  { id: 'system-user', label: '用户管理', children: [
    { id: 'system:user:list', label: '查询用户', permission: 'system:user:list' },
    { id: 'system:user:create', label: '新增用户', permission: 'system:user:create' },
    { id: 'system:user:update', label: '修改用户', permission: 'system:user:update' },
    { id: 'system:user:delete', label: '删除用户', permission: 'system:user:delete' },
    { id: 'system:user:status', label: '启用与停用', permission: 'system:user:status' },
    { id: 'system:user:assign-roles', label: '分配角色', permission: 'system:user:assign-roles' },
    { id: 'system:user:reset-password', label: '重置密码', permission: 'system:user:reset-password' },
  ] },
]
