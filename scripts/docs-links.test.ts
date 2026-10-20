import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docsUrl = 'https://lumal-docs-yu-chens-projects-3f7e3071.vercel.app'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('published documentation links', () => {
  it('默认文档地址指向已有 Vercel 项目的生产域名', async () => {
    vi.stubEnv('LUMAL_DOCS_URL', '')
    const { siteLinks } = await import('../apps/lumal-docs/src/.vitepress/config/links')
    expect(siteLinks.docs).toBe(docsUrl)
  })

  it('仍允许消费方通过环境变量覆盖文档地址', async () => {
    vi.stubEnv('LUMAL_DOCS_URL', 'https://docs.example.com')
    const { siteLinks } = await import('../apps/lumal-docs/src/.vitepress/config/links')
    expect(siteLinks.docs).toBe('https://docs.example.com')
  })

  it('在线文档、关于页与部署说明不再引用已停用的 CF 文档站', () => {
    const docs = join(root, 'apps/lumal-docs/src')
    const files = [
      ...readdirSync(docs, { recursive: true })
        .filter(name => /\.(?:md|ts|vue)$/.test(name))
        .map(name => join(docs, name)),
      join(root, 'apps/lumal-admin/src/views/about/AboutView.vue'),
      join(root, 'deploy/README.md'),
    ]
    // 历史执行报告不在扫描范围内，避免改写原部署失败证据。
    for (const file of files)
      expect(readFileSync(file, 'utf8'), file).not.toContain('lumal-docs-cf.pages.dev')
  })
})
