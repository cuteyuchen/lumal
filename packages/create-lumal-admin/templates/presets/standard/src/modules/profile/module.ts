import type { AppModule } from '../../app/module';

export const menus: AppModule['menus'] = [
  {
    path: '/profile',
    name: 'Profile',
    component: 'profile/index',
    meta: { title: '个人中心', icon: 'lumal:user', hideInMenu: true, keepAlive: false },
  },
];
export const views: AppModule['views'] = { 'profile/index': () => import('./ProfileView.vue') };
