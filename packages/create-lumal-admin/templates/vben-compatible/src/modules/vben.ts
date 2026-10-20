import { adaptVbenMenus } from '@lumal/vben-compat/v5/router'
import '@lumal/vben-compat/style.css'

// Vben authority 是角色；按钮权限继续由应用 PermissionStore 管理。
export const menus = adaptVbenMenus([
  { path: '/migration/form', name: 'VbenForm', component: 'migration/form', meta: { title: 'Vben 表单迁移', keepAlive: true } },
  { path: '/migration/users', name: 'VbenUsers', component: 'migration/users', meta: { title: 'Vben 业务迁移', authority: ['admin'], keepAlive: true } },
]).map((menu) => {
  if (menu.component !== 'migration/users')
    return menu
  // 迁移页也可单独生成，资源权限不能依赖可选的 system 模块。
  return { ...menu, meta: { ...menu.meta, permissionPrefix: 'system:user', resource: 'users' } }
})
export const views = {
  'migration/form': () => import('../views/migration/VbenFormView.vue'),
  'migration/users': () => import('../views/migration/VbenUsersView.vue'),
}
