import type { LumalMenuRecord } from '@lumal/core/router'

export interface FeatureModule {
  menus: LumalMenuRecord[]
  views: Record<string, () => Promise<unknown>>
}

const modules = import.meta.glob<FeatureModule>('../modules/*.ts', { eager: true })
export const localMenus: LumalMenuRecord[] = [
  { path: '/dashboard', name: 'Dashboard', component: 'dashboard/index', meta: { title: '工作台', icon: 'app:dashboard', affixTab: true, keepAlive: true } },
  ...Object.values(modules).flatMap(module => module.menus),
]
export const viewComponents: Record<string, () => Promise<unknown>> = {
  'dashboard/index': () => import('../views/dashboard/DashboardView.vue'),
  ...Object.assign({}, ...Object.values(modules).map(module => module.views)),
}
