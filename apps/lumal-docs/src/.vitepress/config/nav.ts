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
        { text: 'Admin', link: siteLinks.adminDemo },
        { text: '驾驶舱', link: siteLinks.cockpitDemo },
        { text: 'DataV 指南', link: siteLinks.datavGuide },
        { text: 'Vben 兼容示例', link: siteLinks.vbenCompatDemo },
      ],
    },
    {
      // 与公共包保持同版，由文档回归测试和发布边界校验共同检查。
      text: '0.1.0-beta.0',
      items: [
        { text: '开发路线图', link: '/reference/development-roadmap' },
        { text: '发布检查清单', link: '/reference/release-checklist' },
        { text: '更新日志', link: '/reference/changelog' },
        { text: '发布执行记录', link: '/reference/npm-release-0.1.0-beta.0' },
        { text: 'GitHub', link: siteLinks.github },
      ],
    },
  ]
}
