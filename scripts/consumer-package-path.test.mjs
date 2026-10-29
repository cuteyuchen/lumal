// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { afterEach, expect, it } from 'vitest'
import { assertConsumerPackage } from './fixtures/viewport-consumer/assert-consumer-package.mjs'

const fixtures = []
afterEach(() => {
  for (const fixture of fixtures.splice(0))
    rmSync(fixture, { recursive: true, force: true })
})

function createConsumer() {
  const temporary = mkdtempSync(join(tmpdir(), 'lumal-consumer-path-'))
  fixtures.push(temporary)
  const root = join(temporary, 'consumer')
  mkdirSync(join(root, 'node_modules'), { recursive: true })
  return { root, temporary }
}

it('消费者目录别名和 Windows 大小写不影响 pnpm tarball 的真实来源', async () => {
  const { root, temporary } = createConsumer()
  const entry = join(root, 'node_modules/.pnpm/lumal-vite/node_modules/@lumal/vite/dist/index.cjs')
  mkdirSync(dirname(entry), { recursive: true })
  writeFileSync(entry, 'module.exports = {}')
  const alias = join(temporary, 'consumer-alias')
  symlinkSync(root, alias, 'junction')
  await expect(assertConsumerPackage(entry, alias)).resolves.toBeUndefined()
  if (process.platform === 'win32')
    await expect(assertConsumerPackage(entry, alias.toUpperCase())).resolves.toBeUndefined()
})

it.each(['../workspace/vite/dist/index.cjs', 'node_modules-other/vite/index.cjs', 'src/index.js'])('拒绝消费者 node_modules 外的入口：%s', async (path) => {
  const { root } = createConsumer()
  const entry = join(root, path)
  mkdirSync(dirname(entry), { recursive: true })
  writeFileSync(entry, 'module.exports = {}')
  await expect(assertConsumerPackage(entry, root)).rejects.toThrow('自己的 node_modules')
})

it('拒绝 node_modules 中意外指回工作区的包链接', async () => {
  const { root, temporary } = createConsumer()
  const workspacePackage = join(temporary, 'workspace/vite')
  mkdirSync(workspacePackage, { recursive: true })
  writeFileSync(join(workspacePackage, 'index.cjs'), 'module.exports = {}')
  mkdirSync(join(root, 'node_modules/@lumal'))
  const link = join(root, 'node_modules/@lumal/vite')
  symlinkSync(workspacePackage, link, 'junction')
  await expect(assertConsumerPackage(join(link, 'index.cjs'), root)).rejects.toThrow('自己的 node_modules')
})
