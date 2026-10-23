import type { AppModule } from '../../app/module'
import { adaptVbenMenus } from '@lumal/vben-compat/v5/router'

// Vben authority 是角色；按钮权限继续由应用 PermissionStore 管理。
export const menus = adaptVbenMenus([
  { path: '/migration', name: 'VbenMigration', meta: { title: 'Vben 迁移示例', icon: 'lumal:code', order: 30 }, children: [
    { path: '/migration/form', name: 'VbenForm', component: 'migration/form', meta: { title: 'Vben 表单迁移', keepAlive: true } },
    { path: '/migration/users', name: 'VbenUsers', component: 'migration/users', meta: { title: 'Vben 业务迁移', authority: ['admin'], keepAlive: true } },
  ] },
])
export const views: AppModule['views'] = {
  'migration/form': () => import('./VbenFormView.vue'),
  'migration/users': () => import('./VbenUsersView.vue'),
}
// 独立生成迁移示例时仍使用明确的真实操作权限。
export const permissions: AppModule['permissions'] = [{ id: 'migration-user', label: '迁移用户服务', children: [
  { id: 'migration-list', label: '查询用户', permission: 'system:user:list' },
  { id: 'migration-create', label: '创建用户', permission: 'system:user:create' },
  { id: 'migration-update', label: '编辑用户', permission: 'system:user:update' },
  { id: 'migration-delete', label: '删除用户', permission: 'system:user:delete' },
] }]
