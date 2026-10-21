import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const version = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')).version
const siteTargets = [
  ['docs', 'LUMAL_DOCS_URL', 'https://lumal.cuteyuchen.top'],
  ['adminDemo', 'LUMAL_ADMIN_DEMO_URL', 'https://lumal-admin.cuteyuchen.top'],
  ['cockpitDemo', 'LUMAL_COCKPIT_DEMO_URL', 'https://lumal-cockpit.cuteyuchen.top'],
  ['datavGuide', 'LUMAL_DATAV_GUIDE_URL', 'https://lumal-datav.cuteyuchen.top'],
  ['vbenCompatDemo', 'LUMAL_VBEN_COMPAT_DEMO_URL', 'https://lumal-compat.cuteyuchen.top'],
] as const

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('published documentation links', () => {
  it.each(siteTargets)('%s 默认使用已绑定的自定义域名', async (key, variable, url) => {
    vi.stubEnv(variable, '')
    const { siteLinks } = await import('../apps/lumal-docs/src/.vitepress/config/links')
    expect(siteLinks).toHaveProperty(key, url)
  })

  it.each(siteTargets)('%s 仍允许环境变量覆盖并去除首尾空白', async (key, variable) => {
    vi.stubEnv(variable, ' https://preview.example.com ')
    const { siteLinks } = await import('../apps/lumal-docs/src/.vitepress/config/links')
    expect(siteLinks).toHaveProperty(key, 'https://preview.example.com')
  })

  it.each(siteTargets)('%s 不把纯空白环境变量当作有效地址', async (key, variable, url) => {
    vi.stubEnv(variable, '   ')
    const { siteLinks } = await import('../apps/lumal-docs/src/.vitepress/config/links')
    expect(siteLinks).toHaveProperty(key, url)
  })

  it('导航版本与公开包一致，演示菜单包含四个实际站点', async () => {
    for (const [, variable] of siteTargets)
      vi.stubEnv(variable, '')
    const { nav } = await import('../apps/lumal-docs/src/.vitepress/config/nav')
    const items = nav()
    expect(items.some(item => item.text === version)).toBe(true)
    expect(items.find(item => item.text === '演示')).toEqual({
      text: '演示',
      items: [
        { text: 'Admin', link: siteTargets[1][2] },
        { text: '驾驶舱', link: siteTargets[2][2] },
        { text: 'DataV 指南', link: siteTargets[3][2] },
        { text: 'Vben 兼容示例', link: siteTargets[4][2] },
      ],
    })
  })

  it('当前安装文档使用统一发布版本，不再标记为待发布或占位', () => {
    const files = [
      'index.md',
      'guide/essentials/installation.md',
      'guide/introduction/quick-start.md',
      'guide/introduction/scaffold.md',
      ...readdirSync(join(root, 'apps/lumal-docs/src/packages'))
        .filter(name => name.endsWith('.md'))
        .map(name => `packages/${name}`),
    ]
    for (const file of files) {
      const content = readFileSync(join(root, 'apps/lumal-docs/src', file), 'utf8')
      expect(content, file).toContain(version)
      expect(content, file).not.toMatch(/准备版本|尚未执行 npm 发布|发布后使用|包地址占位/)
      for (const match of content.matchAll(/(?:@lumal\/[\w-]+|lumal-admin)@(0\.0\.\d+-beta)/g))
        expect(match[1], file).toBe(version)
    }
  })

  it('安装页的 peer 兼容范围与公开包声明一致', () => {
    const content = readFileSync(join(root, 'apps/lumal-docs/src/guide/essentials/installation.md'), 'utf8')
    for (const directory of readdirSync(join(root, 'packages'))) {
      const pkg = JSON.parse(readFileSync(join(root, 'packages', directory, 'package.json'), 'utf8'))
      for (const [peer, range] of Object.entries(pkg.peerDependencies ?? {}))
        expect(content, `${pkg.name}: ${peer}`).toContain(`| \`${peer}\` | \`${range}\` |`)
    }
  })

  it('当前文档与应用入口不再引用旧站、平台默认域名或占位仓库', () => {
    const docs = join(root, 'apps/lumal-docs/src')
    const files = [
      ...readdirSync(docs, { recursive: true })
        .filter(name => /\.(?:md|ts|vue)$/.test(name))
        .map(name => join(docs, name)),
      join(root, 'README.md'),
      join(root, 'docs/changelog.md'),
      join(root, 'docs/release-checklist.md'),
      join(root, 'apps/lumal-admin/src/App.vue'),
      join(root, 'apps/lumal-admin/src/views/about/AboutView.vue'),
      join(root, 'apps/lumal-mock-api/domain/menu-seed.ts'),
      join(root, 'playwright.release.config.ts'),
      join(root, 'deploy/README.md'),
    ]
    // 历史执行报告不在扫描范围内，避免改写原部署失败证据。
    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      expect(content, file).not.toMatch(/https:\/\/[\w.-]+\.(?:vercel\.app|pages\.dev)\b/)
      expect(content, file).not.toContain('github.com/example/lumal')
    }
  })
})
