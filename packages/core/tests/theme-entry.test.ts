// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileAsync } from 'sass-embedded'
import { expect, it } from 'vitest'

it('主题入口仅引用有效样式，不依赖 Element Plus 已删除的空占位文件', async () => {
  const require = createRequire(import.meta.url)
  const root = dirname(require.resolve('element-plus/package.json'))
  const source = await readFile(new URL('../theme-chalk/index.scss', import.meta.url), 'utf8')
  const imports = [...source.matchAll(/@use "element-plus\/([^"]+)"/g)]
  expect(imports.length).toBeGreaterThan(20)
  for (const [, path] of imports)
    expect((await readFile(resolve(root, path!), 'utf8')).trim(), path).not.toBe('')
})

it('公开主题编译包含 Dropdown 菜单布局和鼠标、键盘交互样式', async () => {
  const require = createRequire(import.meta.url)
  const elementPlusRoot = dirname(require.resolve('element-plus/package.json'))
  // 编译消费者使用的共享入口，避免仅检查组件类名而漏掉实际未加载的样式。
  const { css } = await compileAsync(fileURLToPath(new URL('../theme-chalk/index.scss', import.meta.url)), {
    loadPaths: [dirname(elementPlusRoot)],
  })

  expect(/\.el-dropdown-menu\s*\{[^}]*list-style:\s*none/.test(css), '菜单去除原生列表符号').toBe(true)
  expect(/\.el-dropdown-menu__item\s*\{[^}]*display:\s*flex/.test(css), '菜单项使用 flex 布局').toBe(true)
  expect(/\.el-dropdown-menu__item\s*\{[^}]*line-height:\s*22px/.test(css), '菜单项保留行高').toBe(true)
  expect(/\.el-dropdown-menu__item\s*\{[^}]*cursor:\s*pointer/.test(css), '菜单项展示点击光标').toBe(true)
  expect(css.includes('.el-dropdown-menu__item:not(.is-disabled):hover'), '菜单项支持悬停反馈').toBe(true)
  expect(css.includes('.el-dropdown-menu__item:not(.is-disabled):focus'), '菜单项支持键盘焦点反馈').toBe(true)
}, 30_000)
