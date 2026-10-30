import type { DefaultTheme } from 'vitepress'

export function sidebar(): DefaultTheme.Sidebar {
  return {
    '/guide/': { base: '/guide/', items: sidebarGuide() },
    '/packages/': { base: '/packages/', items: sidebarPackages() },
    '/components/': { base: '/components/', items: sidebarComponents() },
    '/reference/': { base: '/reference/', items: sidebarReference() },
  }
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '简介',
      collapsed: false,
      items: [
        { text: '关于 Lumal', link: 'introduction/lumal' },
        { text: '为什么选择 Lumal', link: 'introduction/why' },
        { text: '快速开始', link: 'introduction/quick-start' },
        { text: '脚手架项目', link: 'introduction/scaffold' },
        { text: '组件文档', base: '/', link: 'components/introduction' },
      ],
    },
    {
      text: '基础',
      collapsed: false,
      items: [
        { text: '基础概念', link: 'essentials/concept' },
        { text: '本地开发', link: 'essentials/development' },
        { text: 'AI Skill', link: 'essentials/ai-skills' },
        { text: '路由和菜单', link: 'essentials/route' },
        { text: '偏好与配置', link: 'essentials/settings' },
        { text: '图标', link: 'essentials/icons' },
        { text: '样式', link: 'essentials/styles' },
        { text: '安装与包地址', link: 'essentials/installation' },
        { text: '构建与部署', link: 'essentials/build' },
        { text: '服务端与 Mock', link: 'essentials/server' },
      ],
    },
    {
      text: '深入',
      collapsed: false,
      items: [
        { text: '登录与会话', link: 'in-depth/login' },
        { text: '主题', link: 'in-depth/theme' },
        { text: '权限', link: 'in-depth/access' },
        { text: '请求与适配', link: 'in-depth/request' },
        { text: '布局与标签', link: 'in-depth/layout' },
        { text: '字典', link: 'in-depth/dictionary' },
        { text: '从 Vben 迁移', link: 'in-depth/migration' },
      ],
    },
    {
      text: '工程',
      collapsed: false,
      items: [
        { text: '包边界与规范', link: 'project/boundaries' },
        { text: '目录说明', link: 'project/dir' },
        { text: 'CLI 脚手架', link: 'project/cli' },
        { text: 'Vite 配置', link: 'project/vite' },
        { text: '测试与验收', link: 'project/test' },
        { text: 'Changeset 发布', link: 'project/changeset' },
      ],
    },
    {
      text: '其他',
      collapsed: false,
      items: [
        { text: '常见问题', link: 'other/faq' },
      ],
    },
  ]
}

function sidebarPackages(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '包使用',
      items: [
        { text: '概览', link: '/' },
        { text: '@lumal/core', link: 'core' },
        { text: '@lumal/icons', link: 'icons' },
        { text: '@lumal/icons-vue', link: 'icons-vue' },
        { text: '@lumal/charts', link: 'charts' },
        { text: '@lumal/viewport', link: 'viewport' },
        { text: '@lumal/datav', link: 'datav' },
        { text: '@lumal/cockpit', link: 'cockpit' },
        { text: '@lumal/vite', link: 'vite' },
        { text: '@lumal/vben-compat', link: 'vben-compat' },
        { text: 'create-lumal-admin', link: 'create-lumal-admin' },
      ],
    },
  ]
}

function sidebarComponents(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '组件',
      items: [
        { text: '介绍', link: 'introduction' },
      ],
    },
    {
      text: '布局',
      collapsed: false,
      items: [
        { text: 'LumalLayout', link: 'layout/lumal-layout' },
        { text: 'LumalPage', link: 'layout/lumal-page' },
        { text: 'LumalPageLayout', link: 'layout/lumal-page-layout' },
      ],
    },
    {
      text: '表单',
      collapsed: false,
      items: [
        { text: 'LumalSchemaForm', link: 'form/lumal-schema-form' },
      ],
    },
    {
      text: '表格',
      collapsed: false,
      items: [
        { text: 'LumalSchemaTable', link: 'table/lumal-schema-table' },
        { text: 'LumalCrudTable', link: 'table/lumal-crud-table' },
      ],
    },
    {
      text: '图表',
      collapsed: false,
      items: [
        { text: 'LumalChart / Panel', link: 'charts/lumal-chart' },
      ],
    },
    {
      text: 'DataV',
      collapsed: false,
      items: [
        { text: '概览', link: 'datav/introduction' },
        { text: 'LumalBorderBox', link: 'datav/border-box' },
        { text: 'LumalDigitalFlop', link: 'datav/digital-flop' },
        { text: 'LumalCharts', link: 'datav/charts' },
      ],
    },
    {
      text: '驾驶舱',
      collapsed: false,
      items: [
        { text: 'LumalCockpit', link: 'cockpit/runtime' },
        { text: 'LumalCockpitDesigner', link: 'cockpit/designer' },
      ],
    },
  ]
}

function sidebarReference(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '参考',
      items: [
        { text: 'Core API', link: 'core-api' },
        { text: '架构说明', link: 'architecture' },
        { text: '图标系统', link: 'icons' },
        { text: 'DataV 示例', link: 'datav-examples' },
        { text: 'Demo 与业务接入', link: 'demo-integration-guide' },
        { text: '十包文档覆盖表', link: 'public-package-coverage' },
        { text: 'Demo 整改验收', link: 'cockpit-demo-remediation-2026-10-26' },
        { text: 'Mock API', link: 'mock-api' },
        { text: '驾驶舱开发规范', link: 'cockpit-development-spec' },
        { text: '从 Vben 迁移', link: 'migration-from-vben' },
        { text: '升级能力审计', link: 'upgrade-audit' },
        { text: '升级验收与性能', link: 'upgrade-verification' },
        { text: '脚手架专项重构验收', link: 'scaffold-refactor-2026-10-23' },
        { text: '下一阶段审计与验收', link: 'lumal-next-phase-audit' },
        { text: '项目模板', link: 'project-template-guide' },
        { text: '工程与AI规范', link: 'development-standards' },
        { text: '屏幕与工作区适配', link: 'screen-viewport-guide' },
        { text: '屏幕与缩放隔离验收', link: 'screen-viewport-verification' },
        { text: '真实消费者兼容', link: 'real-consumer-compatibility' },
        { text: '升级与迁移', link: 'upgrade-guide' },
        { text: '包边界', link: 'package-boundaries' },
        { text: '更新日志', link: 'changelog' },
        { text: '0.1.1-beta 发布记录', link: 'npm-release-0.1.1-beta' },
        { text: '0.0.7-beta 发布记录', link: 'npm-release-0.0.7-beta' },
        { text: '0.0.6-beta 发布记录', link: 'npm-release-0.0.6-beta' },
        { text: '0.0.5-beta 发布记录', link: 'npm-release-0.0.5-beta' },
        { text: '发布检查清单', link: 'release-checklist' },
        { text: '开发路线图', link: 'development-roadmap' },
      ],
    },
  ]
}
