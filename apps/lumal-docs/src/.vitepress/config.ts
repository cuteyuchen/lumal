import { defineConfig } from 'vitepress'
import { siteLinks } from './config/links'
import { nav } from './config/nav'
import { sidebar } from './config/sidebar'

export default defineConfig({
  title: 'Lumal',
  description: '轻量 Vue Admin 基础设施 · 包使用与组件文档',
  lang: 'zh-CN',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  srcDir: '.',
  outDir: '../dist',
  cacheDir: '../.vitepress/cache',

  head: [
    ['meta', { name: 'theme-color', content: '#1677ff' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'Lumal Docs' }],
    ['meta', { name: 'og:description', content: '轻量 Vue Admin 基础设施文档' }],
  ],

  themeConfig: {
    siteTitle: 'Lumal',
    logo: '/logo.svg',
    nav: nav(),
    sidebar: sidebar(),

    socialLinks: [
      { icon: 'github', link: siteLinks.github },
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    editLink: {
      pattern: siteLinks.editPattern,
      text: '在 GitHub 上编辑此页面',
    },

    outline: {
      label: '页面导航',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },

    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',

    footer: {
      message: '基于 MIT 许可发布 · Vue 3 · TypeScript · Vite · Element Plus',
      copyright: `Copyright © 2024-${new Date().getFullYear()} Lumal`,
    },
  },
})
