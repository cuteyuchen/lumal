import type { LumaMenuRecord, LumaStaticMenuRecord } from '@luma/core/router'

/***********************外链地址*********************/
// DataV 组件指南站按环境区分：开发用本地 dev server，生产用独立部署域名，
// 均通过 VITE_DATAV_GUIDE_URL 注入，缺省时回退到本地地址。
// 说明：此处作为后端菜单种子的一部分，运行时由 mock-api 进程读取环境变量。
const datavGuideUrl = process.env.VITE_DATAV_GUIDE_URL || 'http://localhost:5175/'

/***********************静态菜单种子*********************/
// 工作台 / 个人中心属于 Admin 壳层的静态路由，前端也会内置一份同名静态菜单；
// 后端保留它们仅用于生成权限树，保证权限视图与前端壳层一致。
export const staticAdminMenuSeed = [
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

/***********************远程菜单种子*********************/
// 后端返回给前端的动态菜单数据源（权威源）。前端通过 GET /menu 拉取后动态注册路由，
// 不再在前端源码中写死这份菜单结构。
export const adminMenuSeed: LumaMenuRecord[] = [
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
        component: 'system/organization',
        name: 'SystemOrganization',
        path: 'organization',
        meta: {
          authority: ['system:organization:list'],
          icon: 'app:organization',
          order: 4,
          title: '机构管理',
        },
      },
      {
        component: 'system/dict',
        name: 'SystemDict',
        path: 'dict',
        meta: {
          authority: ['system:dict:list'],
          icon: 'app:dict',
          order: 5,
          title: '字典分类',
        },
      },
      {
        component: 'system/dict-item',
        name: 'SystemDictItem',
        path: 'dict-item',
        meta: {
          authority: ['system:dict:list'],
          icon: 'app:dict',
          order: 6,
          title: '字典项',
        },
      },
      {
        component: 'system/config',
        name: 'SystemConfig',
        path: 'config',
        meta: {
          authority: ['system:config:view'],
          icon: 'app:settings',
          order: 7,
          title: '系统配置',
        },
      },
    ],
    name: 'System',
    path: '/system',
    redirect: '/system/user',
    meta: {
      icon: 'app:system',
      order: 99,
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
          badge: 'NEW',
          badgeTone: 'primary',
          badgeType: 'text',
          icon: 'app:examples',
          order: 1,
          title: '示例总览',
        },
      },
      {
        component: 'examples/overview',
        name: 'ExamplesDetail',
        path: 'detail',
        meta: {
          activeMenu: '/examples/overview',
          authority: ['examples:view'],
          hideInMenu: true,
          title: '示例详情',
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
          activeMenu: '/examples/overview',
          authority: ['examples:restricted'],
          hideInMenu: true,
          hideInBreadcrumb: true,
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
    children: [
      {
        externalLink: 'https://element-plus.org/zh-CN/',
        name: 'ExternalDocs',
        path: 'docs',
        meta: {
          externalTarget: '_blank',
          icon: 'app:examples',
          order: 1,
          title: 'Element Plus',
        },
      },
      {
        // 地址按环境从 VITE_DATAV_GUIDE_URL 注入；此处以内嵌方式在 Admin 壳层展示。
        component: 'shared/external-frame',
        externalLink: datavGuideUrl,
        name: 'DatavGuide',
        path: 'datav-guide',
        meta: {
          externalTarget: '_self',
          icon: 'app:examples',
          order: 2,
          title: 'DataV 组件指南',
        },
      },
    ],
    name: 'Resources',
    path: '/resources',
    redirect: '/resources/datav-guide',
    meta: {
      icon: 'app:examples',
      order: 5,
      title: '外部资源',
    },
  },
]
