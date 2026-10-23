import type { AppModule } from '../../app/module';

export const menus: AppModule['menus'] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: 'dashboard/index',
    meta: { title: '工作台', icon: 'app:dashboard', affixTab: true, keepAlive: true, order: 0 },
  },
];
export const views: AppModule['views'] = {
  'dashboard/index': () => import('./DashboardView.vue'),
  'app/iframe': () => import('../../app/views/SafeIframeView.vue'),
};
