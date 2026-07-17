import type { LumaStaticMenuRecord } from '@luma/core/router'

/***********************静态菜单配置*********************/
// 仅保留 Admin 壳层的静态路由（工作台、个人中心）。这些页面不随权限变化，
// 由前端内置注册。动态菜单（系统管理、功能示例、项目、外部资源等）改由后端
// GET /menu 接口下发，前端不再写死其结构。
export const staticAdminRouteRecords = [
  {
    component: 'dashboard/index',
    name: 'Dashboard',
    path: '/dashboard',
    meta: {
      authority: ['dashboard:view'],
      icon: 'app:dashboard',
      order: 1,
      title: '工作台',
    },
  },
  {
    component: 'profile/index',
    name: 'Profile',
    path: '/profile',
    meta: {
      hideInMenu: true,
      icon: 'app:user',
      order: 2,
      title: '个人中心',
    },
  },
] satisfies LumaStaticMenuRecord[]
