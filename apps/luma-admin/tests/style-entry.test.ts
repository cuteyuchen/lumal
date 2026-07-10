import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

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
})
