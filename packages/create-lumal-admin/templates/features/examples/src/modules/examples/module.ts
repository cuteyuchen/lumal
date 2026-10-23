import type { AppModule } from '../../app/module'

export const menus: AppModule['menus'] = [
  { path: '/examples', name: 'Examples', meta: { title: '开发示例', icon: 'lumal:code', order: 80 }, children: [
    { path: '/examples/form', name: 'SchemaFormExample', component: 'examples/form', meta: { title: 'Schema 表单', keepAlive: true } },
    { path: '/examples/crud', name: 'CrudExample', component: 'examples/crud', meta: { title: 'CRUD 示例', keepAlive: true } },
  ] },
]
export const views: AppModule['views'] = {
  'examples/form': () => import('./FormExampleView.vue'),
  'examples/crud': () => import('./CrudExampleView.vue'),
}
