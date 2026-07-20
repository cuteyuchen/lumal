import type { DefaultTheme } from 'vitepress'
import { siteLinks } from './links'

export function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: '文档',
      activeMatch: '^/(guide|packages|components|reference)/',
      items: [
        {
          text: '指南',
          link: '/guide/introduction/lumal',
          activeMatch: '^/guide/',
        },
        {
          text: '包使用',
          link: '/packages/',
          activeMatch: '^/packages/',
        },
        {
          text: '组件',
          link: '/components/introduction',
          activeMatch: '^/components/',
        },
        {
          text: '参考',
          link: '/reference/core-api',
          activeMatch: '^/reference/',
        },
      ],
    },
    {
      text: '演示',
      items: [
        {
          text: '本地演示（占位）',
          items: [
            { text: 'Admin', link: siteLinks.adminDemo },
            { text: '驾驶舱', link: siteLinks.cockpitDemo },
            { text: 'DataV 指南', link: siteLinks.datavGuide },
          ],
        },
        {
          text: '线上演示（部署后替换）',
          items: [
            { text: 'Admin Demo', link: siteLinks.adminDemo },
            { text: 'Cockpit Demo', link: siteLinks.cockpitDemo },
          ],
        },
      ],
    },
    {
      // 与可发布包版本对齐（@lumal/* / create-lumal-admin）
      text: '0.0.1-beta',
      items: [
        { text: '开发路线图', link: '/reference/development-roadmap' },
        { text: '发布检查清单', link: '/reference/release-checklist' },
        { text: '更新日志（占位）', link: siteLinks.github },
        { text: 'GitHub', link: siteLinks.github },
      ],
    },
  ]
}
