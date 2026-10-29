// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { checkCockpitBuildInputs } from './check-cockpit-build-inputs.mjs'

const fixtures = []
afterEach(() => {
  fixtures.splice(0).forEach(path => rmSync(path, { recursive: true, force: true }))
})

it('无 dist 时给出标准构建命令，不用大量 TS2307 掩盖输入问题', () => {
  const root = mkdtempSync(join(tmpdir(), 'lumal-cockpit-inputs-'))
  fixtures.push(root)
  mkdirSync(join(root, 'apps/lumal-cockpit'), { recursive: true })
  writeFileSync(join(root, 'apps/lumal-cockpit/package.json'), JSON.stringify({
    dependencies: { '@lumal/viewport': '0.0.6-beta', 'vue': '^3.5.0' },
    devDependencies: { '@lumal/vite': '0.0.6-beta' },
  }))
  mkdirSync(join(root, 'packages/viewport'), { recursive: true })
  writeFileSync(join(root, 'packages/viewport/package.json'), JSON.stringify({
    exports: { '.': { types: './dist/src/index.d.ts', import: './dist/index.js' } },
  }))
  mkdirSync(join(root, 'packages/vite'), { recursive: true })
  writeFileSync(join(root, 'packages/vite/package.json'), JSON.stringify({
    exports: { '.': { types: './dist/src/index.d.ts', import: './dist/index.js' } },
  }))
  expect(() => checkCockpitBuildInputs(root)).toThrow(/pnpm cockpit:build/)
  mkdirSync(join(root, 'packages/viewport/dist/src'), { recursive: true })
  writeFileSync(join(root, 'packages/viewport/dist/src/index.d.ts'), 'export {}')
  expect(() => checkCockpitBuildInputs(root)).toThrow(/pnpm cockpit:build/)
  writeFileSync(join(root, 'packages/viewport/dist/index.js'), 'export {}')
  expect(() => checkCockpitBuildInputs(root)).toThrow(/@lumal\/vite/)
  mkdirSync(join(root, 'packages/vite/dist/src'), { recursive: true })
  writeFileSync(join(root, 'packages/vite/dist/src/index.d.ts'), 'export {}')
  expect(() => checkCockpitBuildInputs(root)).toThrow(/@lumal\/vite/)
  writeFileSync(join(root, 'packages/vite/dist/index.js'), 'export {}')
  expect(() => checkCockpitBuildInputs(root)).not.toThrow()
})

it.each(['test:scripts', 'cockpit:deps', 'datav-guide:deps'])('%s 从无 dist 的工作区自行构建 Vite 公开入口', (command) => {
  const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  expect(scripts[command].split(' && ')[0]).toBe('pnpm --filter @lumal/vite build')
})
