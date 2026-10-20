import type { LumalMenuRecord } from '@lumal/core/router'
import type { FeatureModule } from '../router/views'

const definitions = [
  ['users', 'user', '用户管理'],
  ['roles', 'role', '角色管理'],
  ['menus', 'menu', '菜单管理'],
  ['organizations', 'organization', '机构管理'],
  ['dictionaries/types', 'dict', '字典管理'],
  ['dictionaries/items', 'dict', '字典项管理'],
  ['config', 'config', '系统配置'],
]
export const menus: LumalMenuRecord[] = definitions.map(([resource, code, title]) => ({
  component: `system/${resource}`,
  name: `System-${resource!.replaceAll('/', '-')}`,
  path: `/system/${resource}`,
  meta: {
    title,
    resource,
    permissionPrefix: `system:${code}`,
    authority: [`system:${code}:${code === 'config' ? 'view' : 'list'}`],
    keepAlive: true,
  },
}))
export const views: FeatureModule['views'] = Object.fromEntries(definitions.map(([resource]) => [
  `system/${resource}`,
  () => import('../views/system/SystemEntityView.vue'),
]))
