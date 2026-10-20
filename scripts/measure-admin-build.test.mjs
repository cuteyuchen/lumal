import { Buffer } from 'node:buffer'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { measureAdminBuild } from './measure-admin-build.mjs'

describe('构建测量', () => {
  it('去重静态闭包并计入动态启动与登录布局，不把其他路由算入首屏', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumal-build-metrics-'))
    const chunks = { 'entry.js': 'entry', 'vendor.js': 'vendor', 'bootstrap.js': 'bootstrap', 'auth.js': 'auth', 'login.js': 'login', 'form.js': 'form', 'theme.css': 'body{}' }
    const manifest = {
      'index.html': { file: 'entry.js', isEntry: true, imports: ['vendor'] },
      'vendor': { file: 'vendor.js' },
      'src/bootstrap.ts': { file: 'bootstrap.js', imports: ['vendor'] },
      'src/layouts/auth.vue': { file: 'auth.js', imports: ['vendor'] },
      'src/views/login.vue': { file: 'login.js', imports: ['vendor'] },
      'src/views/form.vue': { file: 'form.js', imports: ['vendor'] },
    }
    const gzip = (...names) => names.reduce((sum, name) => sum + gzipSync(chunks[name]).length, 0)
    try {
      await mkdir(join(root, 'dist/.vite'), { recursive: true })
      await mkdir(join(root, 'node_modules/.pnpm/node_modules'), { recursive: true })
      await mkdir(join(root, 'node_modules/.pnpm/vue@3'), { recursive: true })
      await writeFile(join(root, 'pnpm-lock.yaml'), JSON.stringify({ snapshots: { 'vue@3': {}, 'optional@1': {} } }))
      await writeFile(join(root, 'dist/.vite/manifest.json'), JSON.stringify(manifest))
      await Promise.all(Object.entries(chunks).map(([name, value]) => writeFile(join(root, 'dist', name), value)))
      const result = await measureAdminBuild(root)
      expect(result.resolvedDependencies).toBe(2)
      expect(result.installedDependencyInstances).toBe(1)
      expect(result.initialEntryJsGzip).toBe(gzip('entry.js', 'vendor.js'))
      expect(result.startupJsGzip).toBe(gzip('entry.js', 'vendor.js', 'bootstrap.js'))
      expect(result.initialRouteJsGzip).toBe(gzip('entry.js', 'vendor.js', 'bootstrap.js', 'auth.js', 'login.js'))
      expect(result.lazyRoutes['src/views/form.vue'].additionalJsGzip).toBe(gzip('form.js'))
      expect(result.productionCssBytes).toBe(Buffer.byteLength(chunks['theme.css']))
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
