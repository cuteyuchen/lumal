import type { CreateLumalAdminProjectOptions, CreateLumalAdminProjectResult } from './types.js'
import { lstat, mkdir, open, readdir, rmdir, unlink } from 'node:fs/promises'
import { dirname, join, parse, resolve } from 'node:path'
import { resolveOptions } from './presets.js'
import { composeTemplates } from './templates.js'

export async function assertTargetDirectory(input: string): Promise<void> {
  if (!input.trim() || /\p{Cc}/u.test(input))
    throw new Error('目标目录不能为空或包含控制字符')
  const targetDir = resolve(input)
  if (targetDir === parse(targetDir).root)
    throw new Error('不能在文件系统根目录创建项目')
  const stat = await lstat(targetDir).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT')
      throw error
    return undefined
  })
  if (stat?.isSymbolicLink() || (stat && !stat.isDirectory()))
    throw new Error('目标必须是普通目录，不能是文件或符号链接')
  if (stat && (await readdir(targetDir)).length)
    throw new Error('目标目录不是空目录')
  // 不允许经由祖先符号链接 / junction 将输出重定向到另一个位置。
  for (let directory = dirname(targetDir); directory !== dirname(directory); directory = dirname(directory)) {
    const parent = await lstat(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT')
        throw error
      return undefined
    })
    if (parent?.isSymbolicLink())
      throw new Error('目标祖先目录不能包含符号链接')
  }
}

export async function createLumalAdminProject(
  input: CreateLumalAdminProjectOptions,
): Promise<CreateLumalAdminProjectResult> {
  const options = resolveOptions(input)
  const targetDir = resolve(options.targetDir)
  await assertTargetDirectory(targetDir)
  input.signal?.throwIfAborted()
  // 先读取、校验全部发布资源，再开始写入。回滚从不递归删除目标目录。
  const files = await composeTemplates(options)
  const ownedFiles: string[] = []
  const ownedDirectories: string[] = []
  async function ensureDirectory(directory: string): Promise<void> {
    try {
      await mkdir(directory)
      ownedDirectories.push(directory)
    }
    catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        await ensureDirectory(dirname(directory))
        await ensureDirectory(directory)
      }
      else if (code === 'EEXIST') {
        const existing = await lstat(directory)
        if (!existing.isDirectory() || existing.isSymbolicLink())
          throw new Error('写入路径必须是普通目录，不能包含符号链接')
      }
      else {
        throw error
      }
    }
  }

  try {
    await ensureDirectory(targetDir)
    for (const file of files) {
      input.signal?.throwIfAborted()
      const filePath = join(targetDir, file.path)
      await ensureDirectory(dirname(filePath))
      const handle = await open(filePath, 'wx')
      ownedFiles.push(filePath)
      try {
        await handle.writeFile(file.content, 'utf8')
      }
      finally {
        await handle.close()
      }
    }
    input.signal?.throwIfAborted()
  }
  catch (error) {
    const cleanupErrors: unknown[] = []
    for (const file of ownedFiles.reverse())
      await unlink(file).catch(reason => cleanupErrors.push(reason))
    for (const directory of ownedDirectories.reverse()) {
      await rmdir(directory).catch((reason: NodeJS.ErrnoException) => {
        // 并发写入者的文件必须保留；只移除本次创建且仍为空的目录。
        if (reason.code !== 'ENOTEMPTY' && reason.code !== 'ENOENT')
          cleanupErrors.push(reason)
      })
    }
    if (cleanupErrors.length)
      throw new AggregateError([error, ...cleanupErrors], '创建失败，部分文件清理失败，请检查目标目录')
    throw error
  }
  return { ...options, targetDir, createdFiles: files.map(file => file.path) }
}
