import assert from 'node:assert/strict'
import { realpath } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

export async function assertConsumerPackage(entry, root) {
  // 两侧均解析真实路径，兼容 Windows 短路径、目录联接及 pnpm 包目录。
  const [modules, resolved] = await Promise.all([
    realpath(resolve(root, 'node_modules')),
    realpath(entry),
  ])
  const path = relative(modules, resolved)
  assert.ok(
    !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`),
    '消费者必须从自己的 node_modules 解析 tarball',
  )
}
