import type { FeatureModule } from '../router/views'

export const menus: FeatureModule['menus'] = [
  { path: '/examples/form', name: 'SchemaFormExample', component: 'examples/form', meta: { title: 'Schema 表单', keepAlive: true } },
  { path: '/examples/crud', name: 'CrudExample', component: 'examples/crud', meta: { title: 'CRUD 示例', keepAlive: true } },
]
export const views: FeatureModule['views'] = {
  'examples/form': () => import('../views/examples/FormExampleView.vue'),
  'examples/crud': () => import('../views/examples/CrudExampleView.vue'),
}
