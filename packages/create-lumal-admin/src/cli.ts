#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline/promises'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { createLumalAdminProject } from './create.js'
import { apiModes, features, presets, routerModes } from './presets.js'
import { getVersion } from './templates.js'

export function parseCliArgs(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      'api-mode': { type: 'string' },
      'features': { type: 'string' },
      'help': { type: 'boolean', short: 'h' },
      'name': { type: 'string' },
      'no-interactive': { type: 'boolean' },
      'preset': { type: 'string' },
      'router-mode': { type: 'string' },
      'version': { type: 'boolean', short: 'v' },
    },
  })
  if (positionals.length > 1)
    throw new Error('只能指定一个目标目录')
  function choice<T extends string>(name: string, value: string | undefined, choices: readonly T[]): T | undefined {
    if (value !== undefined && !choices.includes(value as T))
      throw new Error(`--${name} 仅支持 ${choices.join('、')}`)
    return value as T | undefined
  }
  const selected = values.features === undefined
    ? undefined
    : values.features === 'none' ? [] : values.features.split(',').map(value => choice('features', value, features)!)
  return {
    target: positionals[0],
    name: values.name,
    apiMode: choice('api-mode', values['api-mode'], apiModes),
    preset: choice('preset', values.preset, presets),
    routerMode: choice('router-mode', values['router-mode'], routerModes),
    features: selected,
    help: values.help,
    version: values.version,
    interactive: !values['no-interactive'],
  }
}

const help = `用法：pnpm create lumal-admin [目录] [选项]

  --preset minimal|standard|vben-compatible  模板（默认 standard）
  --api-mode local|http                     数据源（默认 local）
  --router-mode hash|history                路由（默认 hash）
  --features system,examples|none            业务模块（标准预设默认全部）
  --name <npm包名>                           项目名称（默认目录名）
  --no-interactive                           禁用交互，CI/非 TTY 自动禁用
  -h, --help                                显示帮助
  -v, --version                             显示版本

非空目录拒绝覆盖；HTTP 模式必须自行配置后端。`

export async function main(args = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(args)
  if (options.help) {
    console.log(help)
    return
  }
  if (options.version) {
    console.log(await getVersion())
    return
  }
  if (options.interactive && process.stdin.isTTY && process.stdout.isTTY && !process.env.CI) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    try {
      options.target ??= (await rl.question('项目目录 [lumal-admin]：')).trim() || 'lumal-admin'
      options.name ??= (await rl.question(`npm 项目名称 [${basename(resolve(options.target))}]：`)).trim() || basename(resolve(options.target))
      options.preset ??= parseCliArgs(['--preset', (await rl.question('模板 minimal / standard / vben-compatible [standard]：')).trim() || 'standard']).preset
      options.apiMode ??= parseCliArgs(['--api-mode', (await rl.question('数据源 local / http [local]：')).trim() || 'local']).apiMode
      options.routerMode ??= parseCliArgs(['--router-mode', (await rl.question('路由 hash / history [hash]：')).trim() || 'hash']).routerMode
      if (options.preset !== 'minimal')
        options.features ??= parseCliArgs(['--features', (await rl.question('可选能力 system,examples / none [system,examples]：')).trim() || 'system,examples']).features
    }
    finally {
      rl.close()
    }
  }
  const targetDir = resolve(options.target ?? 'lumal-admin')
  const result = await createLumalAdminProject({ ...options, name: options.name ?? basename(targetDir), targetDir })
  console.log(`已创建 ${result.preset} / ${result.apiMode} / ${result.routerMode} 项目：${result.targetDir}`)
  console.log(`下一步：\n  cd ${JSON.stringify(result.targetDir)}\n  pnpm install\n  pnpm dev`)
  if (result.apiMode === 'http')
    console.log('请先配置 .env.development 中的 VITE_API_BASE_URL，契约见 API-CONTRACT.md。')
}

// npm/pnpm 的 node_modules 链接路径与模块真实路径可能不同。
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(resolve(process.argv[1]))).href) {
  main().catch((error: unknown) => {
    console.error(`创建失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
