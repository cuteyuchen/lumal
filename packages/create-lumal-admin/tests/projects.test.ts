// @vitest-environment node
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createLumalProject } from '../src'
import { parseCliArgs } from '../src/cli'
import { resolveProjectOptions } from '../src/projects'

const temporary: string[] = []
afterEach(async () => {
  for (const path of temporary.splice(0))
    await rm(path, { recursive: true, force: true })
})

describe('通用项目生成器', () => {
  it.each(['blank', 'screen'] as const)('%s 默认不依赖后台或网络服务', async (template) => {
    const targetDir = await mkdtemp(join(tmpdir(), 'lumal-project-'))
    temporary.push(targetDir)
    const result = await createLumalProject({ template, name: `test-${template}`, targetDir })
    const manifest = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf8'))
    expect(manifest.dependencies).toEqual({ vue: '^3.5.0' })
    for (const path of ['.editorconfig', '.gitattributes', 'AGENTS.md', 'docs/DEVELOPMENT.md', 'tests/app.test.ts'])
      expect(result.createdFiles).toContain(path)
    expect(result.createdFiles.some(path => /auth|services|router|modules|app\//.test(path))).toBe(false)
    expect(result.createdFiles).not.toContain('API-CONTRACT.md')
    expect(result.createdFiles.some(path => path.startsWith('.env'))).toBe(false)
    const conventions = await readFile(join(targetDir, 'docs/DEVELOPMENT.md'), 'utf8')
    expect(conventions).not.toContain('## Admin')
  })

  it.each(['hash', 'history'] as const)('screen %s 按需引入 Router', async (routerMode) => {
    const targetDir = await mkdtemp(join(tmpdir(), 'lumal-project-'))
    temporary.push(targetDir)
    const result = await createLumalProject({ template: 'screen', name: 'router-screen', targetDir, routerMode })
    expect(result.createdFiles).toContain('src/router.ts')
    const manifest = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf8'))
    expect(manifest.dependencies).toEqual({ 'vue': '^3.5.0', 'vue-router': '^4.5.0' })
    const router = await readFile(join(targetDir, 'src/router.ts'), 'utf8')
    expect(router).toContain(routerMode === 'hash' ? 'createWebHashHistory' : 'createWebHistory')
  })

  it.each([
    { template: 'blank', data: 'http' },
    { template: 'blank', routerMode: 'hash' },
    { template: 'screen', preset: 'standard' },
    { template: 'screen', features: [] },
    { template: 'screen', data: 'local', apiMode: 'http' },
    { template: 'admin', routerMode: 'none' },
    { template: 'admin', auth: 'http' },
  ] as const)('拒绝不合理组合 %j', (options) => {
    expect(() => resolveProjectOptions({ ...options, features: 'features' in options ? [...options.features] : undefined, name: 'invalid', targetDir: 'unused' })).toThrow()
  })

  it('blank/Screen 取消仍复用文件所有权回滚', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'lumal-project-'))
    temporary.push(parent)
    const controller = new AbortController()
    controller.abort()
    for (const template of ['blank', 'screen'] as const) {
      await expect(createLumalProject({ template, name: 'cancelled', targetDir: join(parent, template), signal: controller.signal })).rejects.toThrow()
    }
    expect(await readdir(parent)).toEqual([])
  })

  it('新选项与旧选项共用参数解析且不猜测无效枚举', () => {
    expect(parseCliArgs(['demo', '--template', 'blank', '--no-interactive'])).toMatchObject({ template: 'blank', interactive: false })
    expect(parseCliArgs(['demo', '--template', 'screen', '--data', 'http', '--auth', 'http'])).toMatchObject({ template: 'screen', data: 'http', auth: 'http' })
    expect(() => parseCliArgs(['--template', 'unknown'])).toThrow()
  })

  it.each(['none', 'local-demo', 'http'] as const)('screen %s 认证与数据独立组合', async (auth) => {
    for (const data of ['none', 'local', 'http'] as const) {
      const targetDir = await mkdtemp(join(tmpdir(), 'lumal-screen-capability-'))
      temporary.push(targetDir)
      const result = await createLumalProject({ template: 'screen', name: 'capability', targetDir, auth, data })
      const paths = result.createdFiles
      expect(paths.includes('src/services/session.ts')).toBe(auth !== 'none')
      expect(paths.includes('src/services/metrics.ts')).toBe(data !== 'none')
      expect(paths.includes('src/services/http.ts')).toBe(auth === 'http' || data === 'http')
      expect(paths.includes('API-CONTRACT.md')).toBe(auth === 'http' || data === 'http')
      const manifest = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf8'))
      expect(Boolean(manifest.dependencies['@lumal/core'])).toBe(auth !== 'none' || data === 'http')
      for (const name of ['element-plus', 'pinia', 'vue-router', '@lumal/vben-compat', '@lumal/cockpit'])
        expect(manifest.dependencies).not.toHaveProperty(name)
      expect(paths.some(path => path.includes('/modules/') || path.includes('/app/'))).toBe(false)
    }
  })
  it.each(['charts', 'datav', 'cockpit'] as const)('可视化 %s 只组合所选能力，不生成Designer', async (visualization) => {
    const targetDir = await mkdtemp(join(tmpdir(), 'lumal-screen-visual-'))
    temporary.push(targetDir)
    const result = await createLumalProject({ template: 'screen', name: 'screen-visual', targetDir, visualization, viewport: 'contain' })
    const manifest = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf8'))
    expect(manifest.dependencies).toHaveProperty(`@lumal/${visualization}`)
    expect(manifest.dependencies).toHaveProperty('@lumal/viewport')
    for (const other of ['charts', 'datav', 'cockpit'].filter(item => item !== visualization))
      expect(manifest.dependencies).not.toHaveProperty(`@lumal/${other}`)
    expect(manifest.dependencies).not.toHaveProperty('@lumal/vben-compat')
    expect(Boolean(manifest.dependencies.echarts)).toBe(visualization === 'charts')
    const source = await readFile(join(targetDir, 'src/screen/components/ScreenVisualization.vue'), 'utf8')
    expect(source).not.toContain('/designer')
    if (visualization === 'cockpit')
      expect(source).toContain('viewport-mode="external"')
    expect(result.createdFiles).toContain('src/screen/ScreenViewport.vue')
  })
  it.each(['disabled', 'responsive', 'width', 'contain', 'scale', 'vw'] as const)('%s 适配参数与容器策略一致', async (viewport) => {
    const targetDir = await mkdtemp(join(tmpdir(), 'lumal-screen-viewport-'))
    temporary.push(targetDir)
    const result = await createLumalProject({ template: 'screen', name: 'screen-viewport', targetDir, viewport })
    const included = !['disabled', 'responsive'].includes(viewport)
    expect(result.createdFiles.includes('src/screen/ScreenViewport.vue')).toBe(included)
    if (included)
      expect(await readFile(join(targetDir, 'src/screen/ScreenViewport.vue'), 'utf8')).toContain(`mode: '${viewport === 'scale' ? 'contain' : viewport}'`)
  })
})
