// @vitest-environment node
import * as fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseCliArgs } from '../src/cli'
import { createLumalAdminProject } from '../src/scaffold'

vi.mock('node:fs/promises', async (original) => {
  const actual = await original<typeof fs>()
  return { ...actual, open: vi.fn(actual.open) }
})
const temporary: string[] = []
async function directory(): Promise<string> {
  const path = await fs.mkdtemp(join(tmpdir(), 'lumal-generator-'))
  temporary.push(path)
  return path
}
afterEach(async () => {
  vi.mocked(fs.open).mockRestore()
  await Promise.all(temporary.splice(0).map(path => fs.rm(path, { recursive: true, force: true })))
})

describe('模板资源组合', () => {
  for (const preset of ['minimal', 'standard', 'vben-compatible'] as const) {
    for (const apiMode of ['local', 'http'] as const) {
      for (const routerMode of ['hash', 'history'] as const) {
        it(`${preset}/${apiMode}/${routerMode} 生成独立工程`, async () => {
          const targetDir = join(await directory(), 'demo')
          const result = await createLumalAdminProject({ name: 'demo-admin', targetDir, preset, apiMode, routerMode })
          expect(result.createdFiles).toEqual(expect.arrayContaining([
            'README.md',
            '.gitignore',
            '.env.example',
            '.env.development',
            '.env.production.example',
            'API-CONTRACT.md',
            'package.json',
            'tsconfig.json',
            'vite.config.ts',
            'vitest.config.ts',
            'src/router/index.ts',
            'src/services/session-runtime.ts',
            'tests/session.test.ts',
          ]))
          const manifest = JSON.parse(await fs.readFile(join(targetDir, 'package.json'), 'utf8'))
          expect(manifest.name).toBe('demo-admin')
          expect(Object.keys(manifest.dependencies)).toEqual(Object.keys(manifest.dependencies).sort((left, right) => left.localeCompare(right)))
          expect(manifest.dependencies['@lumal/vben-compat'] !== undefined).toBe(preset === 'vben-compatible')
          for (const heavy of ['@lumal/charts', '@lumal/datav', '@lumal/cockpit', 'vxe-table', 'echarts'])
            expect(manifest.dependencies[heavy]).toBeUndefined()
          expect(result.createdFiles.includes('src/views/system/SystemEntityView.vue')).toBe(preset !== 'minimal')
          expect(result.createdFiles.includes('src/views/migration/VbenUsersView.vue')).toBe(preset === 'vben-compatible')
          const config = await fs.readFile(join(targetDir, 'src/app.config.ts'), 'utf8')
          expect(config).toContain(`routerMode: '${routerMode}'`)
          const source = await fs.readFile(join(targetDir, 'src/services/data-source.ts'), 'utf8')
          if (apiMode === 'http') {
            expect(source).toContain('createRequestClient')
            expect(source).toContain('/auth/login')
            expect(source).toContain('/session/access')
            expect(source).not.toContain('lumal123')
            expect(source).not.toContain('demo-token')
          }
          else {
            expect(source).toContain('crypto.randomUUID()')
            expect(source).toContain('VITE_ENABLE_LOCAL_DEMO')
          }
          for (const file of result.createdFiles) {
            const text = await fs.readFile(join(targetDir, file), 'utf8')
            expect(text).not.toMatch(/workspace:|packages\/core\/src|apps\/lumal-admin\/src/)
          }
          const main = await fs.readFile(join(targetDir, 'src/main.ts'), 'utf8')
          expect(main).toContain('@lumal/core/minimal')
          expect(main).toContain('element-plus/theme-chalk/dark/css-vars.css')
          const app = await fs.readFile(join(targetDir, 'src/App.vue'), 'utf8')
          for (const contract of ['route-driven', ':cache-keys=', '@tab-refresh=', '@tabs-change=', ':preferences=', 'routeRefreshKeys', 'onErrorCaptured'])
            expect(app).toContain(contract)
        })
      }
    }
  }
  it('按需禁用业务模块，保留公共认证与布局', async () => {
    const targetDir = join(await directory(), 'no-features')
    const result = await createLumalAdminProject({ name: 'no-features', targetDir, preset: 'standard', features: [] })
    expect(result.createdFiles).not.toContain('src/modules/system.ts')
    expect(result.createdFiles).not.toContain('src/modules/examples.ts')
    expect(result.createdFiles).toContain('src/services/session-runtime.ts')
  })
  it('固定标签与路由使用相同的多角色匹配模式', async () => {
    const targetDir = join(await directory(), 'role-tabs')
    await createLumalAdminProject({ name: 'role-tabs', targetDir, preset: 'minimal' })
    const router = await fs.readFile(join(targetDir, 'src/router/index.ts'), 'utf8')
    expect(router).toContain('permissionStore.hasRole(route.meta.roles, \'some\')')
  })
  it('迁移业务页不依赖可选 system 层声明资源权限', async () => {
    const targetDir = join(await directory(), 'migration-only')
    const result = await createLumalAdminProject({ name: 'migration-only', targetDir, preset: 'vben-compatible', features: [] })
    expect(result.createdFiles).not.toContain('src/modules/system.ts')
    const module = await fs.readFile(join(targetDir, 'src/modules/vben.ts'), 'utf8')
    expect(module).toContain('permissionPrefix: \'system:user\'')
    expect(module).toContain('resource: \'users\'')
  })
})

describe('安全创建与恢复', () => {
  it.each(['Foo', '.hidden', '_bad', '-bad', '~bad', 'foo~bar', '@team/foo~bar', 'node_modules', 'node:fs', 'bad name', 'a/b', '', 'a'.repeat(215)])('拒绝非法 npm 名称 %s', async (name) => {
    const root = await directory()
    await expect(createLumalAdminProject({ name, targetDir: join(root, 'new') })).rejects.toThrow('非法 npm')
    expect(await fs.readdir(root)).toEqual([])
  })
  it('支持合法 scoped npm 名称', async () => {
    await expect(createLumalAdminProject({ name: '@team/admin', targetDir: join(await directory(), 'scoped') })).resolves.toMatchObject({ name: '@team/admin' })
  })
  it('非空目录和普通文件都拒绝覆盖', async () => {
    const targetDir = await directory()
    await fs.writeFile(join(targetDir, 'mine.txt'), 'user content')
    await expect(createLumalAdminProject({ name: 'test', targetDir })).rejects.toThrow('不是空目录')
    await expect(createLumalAdminProject({ name: 'test', targetDir: join(targetDir, 'mine.txt') })).rejects.toThrow('普通目录')
    expect(await fs.readFile(join(targetDir, 'mine.txt'), 'utf8')).toBe('user content')
  })
  it('拒绝目录符号链接与祖先 junction', async () => {
    const root = await directory()
    const real = join(root, 'real')
    const link = join(root, 'link')
    await fs.mkdir(real)
    await fs.symlink(real, link, 'junction')
    await expect(createLumalAdminProject({ name: 'test', targetDir: link })).rejects.toThrow('符号链接')
    await expect(createLumalAdminProject({ name: 'test', targetDir: join(link, 'child') })).rejects.toThrow('符号链接')
    expect(await fs.readdir(real)).toEqual([])
  })
  it('写入失败只回滚拥有文件，保留已有空目录和并发用户文件', async () => {
    const root = await directory()
    const realOpen = (await vi.importActual<typeof fs>('node:fs/promises')).open
    let calls = 0
    vi.mocked(fs.open).mockImplementation(async (...args) => {
      calls += 1
      if (calls === 4) {
        await fs.writeFile(join(root, 'user.txt'), 'concurrent-user')
        throw new Error('disk full')
      }
      return realOpen(...args)
    })
    await expect(createLumalAdminProject({ name: 'test', targetDir: root })).rejects.toThrow('disk full')
    expect(await fs.readdir(root)).toEqual(['user.txt'])
    expect(await fs.readFile(join(root, 'user.txt'), 'utf8')).toBe('concurrent-user')
  })
})

describe('cLI 参数', () => {
  it('保留无交互选项及可组合特性', () => {
    expect(parseCliArgs(['my-admin', '--preset', 'standard', '--api-mode', 'http', '--router-mode', 'history', '--features', 'system', '--no-interactive']))
      .toMatchObject({ target: 'my-admin', preset: 'standard', apiMode: 'http', routerMode: 'history', features: ['system'], interactive: false })
    expect(parseCliArgs(['--help']).help).toBe(true)
    expect(parseCliArgs(['--version']).version).toBe(true)
  })
  it.each([['--preset'], ['--preset', 'bad'], ['--unknown'], ['a', 'b'], ['--api-mode', 'bad'], ['--features', 'charts'], ['--router-mode', 'bad']])('错误参数不进入交互 %s', (...args) => {
    expect(() => parseCliArgs(args)).toThrow()
  })
})
