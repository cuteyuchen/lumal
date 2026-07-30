#!/usr/bin/env node
import { basename, resolve } from 'node:path'
import process from 'node:process'
import { createLumalAdminProject } from './create.js'

/***********************参数解析*********************/
function resolveApiMode(argv: string[]): 'http' | 'local' {
  const inline = argv.find(argument => argument.startsWith('--api-mode='))?.split('=')[1]
  const optionIndex = argv.indexOf('--api-mode')
  const value = inline ?? (optionIndex >= 0 ? argv[optionIndex + 1] : undefined) ?? 'local'
  if (value !== 'http' && value !== 'local')
    throw new Error('--api-mode 仅支持 local 或 http')
  return value
}

function resolveTargetDir(argv: string[]): string {
  const target = argv.slice(2).find(argument => !argument.startsWith('--') && argument !== 'http' && argument !== 'local')
  return resolve(process.cwd(), target ?? 'lumal-admin')
}

/***********************命令执行*********************/
async function main(): Promise<void> {
  const targetDir = resolveTargetDir(process.argv)
  const result = await createLumalAdminProject({
    apiMode: resolveApiMode(process.argv),
    name: basename(targetDir),
    targetDir,
  })

  console.log(`已创建 Lumal Admin 项目：${result.targetDir}`)
  console.log('下一步：')
  console.log(`  cd ${result.targetDir}`)
  console.log('  pnpm install')
  console.log('  pnpm dev')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`创建失败：${message}`)
  process.exit(1)
})
