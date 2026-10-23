import type { AppModule } from '../../app/module'
import { assembleModules } from '../../app/module'
import * as config from './config/routes'
import * as dictionary from './dictionary/routes'
import * as menu from './menu/routes'
import * as organization from './organization/routes'
import * as role from './role/routes'
import * as user from './user/routes'

const children = assembleModules([user, role, menu, organization, dictionary, config])
export const menus: AppModule['menus'] = [
  { path: '/system', name: 'System', meta: { title: '系统管理', icon: 'lumal:settings', order: 20 }, children: children.menus },
]
export const views = children.views
export const permissions: AppModule['permissions'] = [
  { id: 'system', label: '系统管理', children: children.permissions },
]
