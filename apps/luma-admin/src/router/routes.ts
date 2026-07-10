import type { LumaMenuRecord } from '@luma/core/router'

/***********************菜单配置*********************/
export const adminRouteRecords: LumaMenuRecord[] = [
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
    children: [
      {
        component: 'system/user',
        name: 'SystemUser',
        path: 'user',
        meta: {
          authority: ['system:user:list'],
          icon: 'app:user',
          order: 1,
          title: '用户管理',
        },
      },
      {
        component: 'system/role',
        name: 'SystemRole',
        path: 'role',
        meta: {
          authority: ['system:role:list'],
          icon: 'app:role',
          order: 2,
          title: '角色管理',
        },
      },
      {
        component: 'system/menu',
        name: 'SystemMenu',
        path: 'menu',
        meta: {
          authority: ['system:menu:list'],
          icon: 'app:menu',
          order: 3,
          title: '菜单管理',
        },
      },
      {
        component: 'system/dict',
        name: 'SystemDict',
        path: 'dict',
        meta: {
          authority: ['system:dict:list'],
          icon: 'app:dict',
          order: 4,
          title: '字典管理',
        },
      },
      {
        component: 'system/config',
        name: 'SystemConfig',
        path: 'config',
        meta: {
          authority: ['system:config:view'],
          icon: 'app:settings',
          order: 5,
          title: '系统配置',
        },
      },
    ],
    name: 'System',
    path: '/system',
    redirect: '/system/user',
    meta: {
      icon: 'app:system',
      order: 2,
      title: '系统管理',
    },
  },
  {
    children: [
      {
        component: 'examples/overview',
        name: 'ExamplesOverview',
        path: 'overview',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 1,
          title: '示例总览',
        },
      },
      {
        component: 'examples/theme-settings',
        name: 'ExamplesThemeSettings',
        path: 'theme-settings',
        meta: {
          authority: ['examples:view'],
          icon: 'app:theme',
          order: 2,
          title: '主题与动画',
        },
      },
      {
        component: 'examples/page-layout',
        name: 'ExamplesPageLayout',
        path: 'page-layout',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:table',
          order: 3,
          title: '页面布局',
        },
      },
      {
        component: 'examples/schema-form',
        name: 'ExamplesSchemaForm',
        path: 'schema-form',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:form',
          order: 4,
          title: 'Schema Form',
        },
      },
      {
        component: 'examples/schema-table',
        name: 'ExamplesSchemaTable',
        path: 'schema-table',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:table',
          order: 5,
          title: 'Schema Table',
        },
      },
      {
        component: 'examples/crud-table',
        name: 'ExamplesCrudTable',
        path: 'crud-table',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:table',
          order: 6,
          title: 'CRUD Table',
        },
      },
      {
        component: 'examples/dictionary',
        name: 'ExamplesDictionary',
        path: 'dictionary',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:form',
          order: 7,
          title: 'Dictionary',
        },
      },
      {
        component: 'examples/info-reference',
        name: 'ExamplesInfoReference',
        path: 'info-reference',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 8,
          title: 'Info Reference',
        },
      },
      {
        component: 'examples/composables',
        name: 'ExamplesComposables',
        path: 'composables',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 9,
          title: 'Composables',
        },
      },
      {
        component: 'examples/utils',
        name: 'ExamplesUtils',
        path: 'utils',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 10,
          title: 'Utils',
        },
      },
      {
        component: 'examples/services',
        name: 'ExamplesServices',
        path: 'services',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 11,
          title: 'Services',
        },
      },
      {
        component: 'examples/chart',
        name: 'ExamplesChart',
        path: 'chart',
        meta: {
          authority: ['examples:view'],
          icon: 'app:chart',
          order: 12,
          title: 'Chart',
        },
      },
      {
        component: 'examples/chart-panel',
        name: 'ExamplesChartPanel',
        path: 'chart-panel',
        meta: {
          authority: ['examples:view'],
          icon: 'app:chart',
          order: 13,
          title: 'Chart Panel',
        },
      },
      {
        component: 'examples/info-reference',
        name: 'ExamplesRestricted',
        path: 'restricted',
        meta: {
          authority: ['examples:restricted'],
          hideInMenu: true,
          title: '受限示例',
        },
      },
    ],
    name: 'Examples',
    path: '/examples',
    redirect: '/examples/overview',
    meta: {
      authority: ['examples:view'],
      icon: 'app:examples',
      order: 3,
      title: '功能示例',
    },
  },
  {
    component: 'project/index',
    name: 'Project',
    path: '/project',
    meta: {
      authority: ['project:list'],
      icon: 'app:dashboard',
      order: 4,
      title: '项目管理',
    },
  },
  {
    component: 'error/forbidden',
    name: 'Forbidden',
    path: '/403',
    meta: {
      hideInMenu: true,
      title: '无权限',
    },
  },
]
