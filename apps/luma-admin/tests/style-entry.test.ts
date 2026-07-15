import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

interface StyleSource {
  path: string
  source: string
}

async function readStyleSources(directory: string): Promise<StyleSource[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry): Promise<StyleSource[]> => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      return readStyleSources(path)
    }
    if (!entry.name.endsWith('.vue') && !entry.name.endsWith('.scss')) {
      return []
    }

    return [{ path, source: await readFile(path, 'utf8') }]
  }))

  return nested.flat()
}

/***********************样式入口*********************/
describe('luma admin style entry', () => {
  it('会显式导入 Luma 组件样式和主题样式', async () => {
    const mainTs = await readFile(join(process.cwd(), 'src/main.ts'), 'utf8')

    expect(mainTs).toContain('import \'@luma/core/theme-chalk/index.scss\'')
    expect(mainTs).toContain('import \'@luma/core/style.css\'')
    expect(mainTs).toContain('import \'@luma/icons/style.css\'')
    expect(mainTs).toContain('import \'./styles.scss\'')
  })

  it('会注册 authority 与 permission 应用级权限指令', async () => {
    const mainTs = await readFile(join(process.cwd(), 'src/main.ts'), 'utf8')

    expect(mainTs).toContain('registerAuthorityDirectives(app, permissionStore)')
  })

  it('会在应用壳中启用路由动画和缓存示例', async () => {
    const appVue = await readFile(join(process.cwd(), 'src/App.vue'), 'utf8')

    expect(appVue).toContain(':view-key="routeViewKey"')
    expect(appVue).toContain(':transition-name="preferences.transition.name"')
    expect(appVue).toContain(':progress="preferences.transition.progress"')
    expect(appVue).toContain(':loading="preferences.transition.loading"')
    expect(appVue).toContain(':cache="routeViewCache"')
  })

  it('可见文本字号会统一消费全局字号令牌', async () => {
    const sources = await readStyleSources(join(process.cwd(), 'src'))
    const violations = sources.flatMap(({ path, source }) => (
      [...source.matchAll(/font-size\s*:\s*([^;}\r\n]+)/g)]
        .filter(match => match[1]?.includes('px') && !match[1].includes('var(--luma-font-size-base'))
        .map(match => `${path}:${source.slice(0, match.index).split(/\r?\n/).length}:${match[0]}`)
    ))

    expect(violations).toEqual([])
    expect(sources.some(({ source }) => source.includes('var(--luma-font-size-base, 14px)'))).toBe(true)
  })
})
