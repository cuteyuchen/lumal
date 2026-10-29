#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import process from 'node:process'
import { PassThrough } from 'node:stream'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { cancel, confirm, intro, isCancel, multiselect, note, outro, select, spinner, text } from '@clack/prompts'
import { assertTargetDirectory } from './create.js'
import { apiModes, assertPackageName, availableFeatures, defaultFeatures, featureDefinitions, features, presets, routerModes } from './presets.js'
import { createLumalProject, projectRouterModes, projectTemplates, resolveProjectOptions, screenAuthModes, screenDataModes, screenVisualizations } from './projects.js'
import { getVersion } from './templates.js'

export function parseCliArgs(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      'api-mode': { type: 'string' },
      'template': { type: 'string' },
      'auth': { type: 'string' },
      'data': { type: 'string' },
      'visualization': { type: 'string' },
      'viewport': { type: 'boolean' },
      'no-viewport': { type: 'boolean' },
      'design-width': { type: 'string' },
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
  if (values.viewport && values['no-viewport'])
    throw new Error('--viewport 与 --no-viewport 冲突')
  const designWidth = values['design-width'] === undefined ? undefined : Number(values['design-width'])
  if (designWidth !== undefined && (!Number.isFinite(designWidth) || designWidth <= 0))
    throw new Error('--design-width 必须为正有限数')
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
    template: choice('template', values.template, projectTemplates),
    auth: choice('auth', values.auth, screenAuthModes),
    data: choice('data', values.data, screenDataModes),
    visualization: choice('visualization', values.visualization, screenVisualizations),
    viewport: values['no-viewport'] ? false : values.viewport,
    designWidth,
    preset: choice('preset', values.preset, presets),
    routerMode: choice('router-mode', values['router-mode'], projectRouterModes),
    features: selected,
    help: values.help,
    version: values.version,
    interactive: !values['no-interactive'],
  }
}

const help = `用法：pnpm create lumal-admin [目录] [选项]

  --preset minimal|standard|vben-compatible  模板（默认 standard）
  --template admin|screen|blank             项目类型（旧入口默认 admin）
  --api-mode local|http                     数据源（默认 local）
  --router-mode none|hash|history           路由（Admin 默认 hash；Screen/Blank 默认 none）
                                           Admin 仅 hash|history；Blank 仅 none
  --auth none|local-demo|http               Screen 认证（默认 none）
  --data none|local|http                    Screen 业务数据（默认 none）
  --visualization none|charts|datav|cockpit  Screen 可视化（默认 none）
  --viewport / --no-viewport                 启用 / 关闭 px→vw（Admin/Screen 默认启用，Blank 关闭）
  --design-width <number>                    唯一设计宽度（默认 1920）
  --features system,examples|none            业务模块（标准预设默认全部）
  --name <npm包名>                           项目名称（默认目录名）
  --no-interactive                           禁用交互，CI/非 TTY 自动禁用
  -h, --help                                显示帮助
  -v, --version                             显示版本

非空目录拒绝覆盖；HTTP 模式必须自行配置后端。`

export async function main(args = process.argv.slice(2), unified = false): Promise<void> {
  const options = parseCliArgs(args)
  if (!unified)
    options.template ??= 'admin'
  if (options.help) {
    console.log(help)
    return
  }
  if (options.version) {
    console.log(await getVersion())
    return
  }
  const interactive = canInteract()
    && options.interactive
  if (interactive) {
    intro(unified ? '创建 Lumal 项目' : '创建 Lumal Admin')
    const input = new PassThrough()
    const previousRawMode = process.stdin.isRaw
    // Clack 每题关闭 readline；保持原始终端为 raw，避免 Windows 在题间启动 cooked read。
    Object.assign(input, { isTTY: true, setRawMode: () => process.stdin.setRawMode(true) })
    process.stdin.setRawMode(true)
    process.stdin.pipe(input)
    // 每一步的取消都发生在首次文件写入之前。
    try {
      options.target ??= await answer(text({
        input,
        message: '项目目录',
        placeholder: 'lumal-admin',
        defaultValue: 'lumal-admin',
        validate: value => validation(() => assertTargetDirectory(value?.trim() || 'lumal-admin')),
      }))
      await assertTargetDirectory(options.target)
      const defaultName = basename(resolve(options.target))
      options.name ??= await answer(text({
        input,
        message: 'npm 项目名称',
        placeholder: defaultName,
        defaultValue: defaultName,
        validate: value => validation(() => assertPackageName(value?.trim() || defaultName)),
      }))
      assertPackageName(options.name)
      options.template ??= await answer(select({
        input,
        message: '项目类型',
        initialValue: 'admin',
        options: [
          { value: 'admin', label: 'Admin', hint: '完整管理后台' },
          { value: 'screen', label: 'Screen', hint: '独立大屏，无后台布局' },
          { value: 'blank', label: 'Blank', hint: '仅 Vue + TypeScript + Vite' },
        ] as const,
      }))
      if (options.template === 'admin') {
        options.preset ??= await answer(select({
          input,
          message: '项目模板',
          initialValue: 'standard',
          options: [
            { value: 'minimal', label: 'Minimal', hint: '极简开发基座' },
            { value: 'standard', label: 'Standard', hint: '完整轻量后台，推荐' },
            { value: 'vben-compatible', label: 'Vben Compatible', hint: '支持 Vben 5 高频业务 API 迁移' },
          ] as const,
        }))
        options.apiMode ??= await answer(select({
          input,
          message: '数据源模式',
          initialValue: 'local',
          options: [
            { value: 'local', label: 'Local Mock', hint: '开箱即用的本地开发演示数据' },
            { value: 'http', label: 'HTTP API', hint: '对接真实后端接口' },
          ] as const,
        }))
        options.routerMode ??= await answer(select({
          input,
          message: '路由模式',
          initialValue: 'hash',
          options: [
            { value: 'hash', label: 'Hash', hint: '部署简单' },
            { value: 'history', label: 'History', hint: '服务端需配置 SPA fallback' },
          ] as const,
        }))
        const available = availableFeatures(options.preset)
        if (options.features === undefined) {
          options.features = available.length
            ? await answer(multiselect({
                input,
                message: '可选功能（Space 勾选，方向键移动，Enter 确认）',
                options: available.map(value => ({ value, ...featureDefinitions[value] })),
                initialValues: defaultFeatures(options.preset),
                required: false,
              }))
            : []
        }
      }
      else if (options.template === 'screen') {
        options.auth ??= await answer(select({
          input,
          message: 'Screen 认证',
          initialValue: 'none',
          options: [
            { value: 'none', label: 'None', hint: '访客访问' },
            { value: 'local-demo', label: 'Local Demo', hint: '仅开发演示，生产禁用' },
            { value: 'http', label: 'HTTP', hint: '包含登录与刷新网络请求，与业务数据独立' },
          ] as const,
        }))
        options.data ??= options.apiMode ?? await answer(select({
          input,
          message: 'Screen 业务数据',
          initialValue: 'none',
          options: [
            { value: 'none', label: 'None', hint: '纯静态页面' },
            { value: 'local', label: 'Local', hint: '显式本地示例' },
            { value: 'http', label: 'HTTP', hint: '真实接口，失败不回退' },
          ] as const,
        }))
        options.routerMode ??= await answer(select({
          input,
          message: 'Screen 路由',
          initialValue: 'none',
          options: [
            { value: 'none', label: 'None', hint: '真正单页，无 Router 依赖' },
            ...routerModes.map(value => ({ value, label: value === 'hash' ? 'Hash' : 'History' })),
          ],
        }))
        options.visualization ??= await answer(select({
          input,
          message: 'Screen 可视化',
          initialValue: 'none',
          options: [
            { value: 'none', label: 'None', hint: '不安装图表或编排依赖' },
            { value: 'charts', label: 'Charts', hint: '按需注册 ECharts 引擎' },
            { value: 'datav', label: 'DataV', hint: '数字与边框独立组件，无 Cockpit' },
            { value: 'cockpit', label: 'Cockpit', hint: '仅 runtime，复杂编排时选择' },
          ] as const,
        }))
      }
      if (options.template !== 'blank') {
        options.viewport ??= await answer(confirm({
          input,
          message: '启用统一 px→vw 宽度适配？',
          initialValue: true,
        }))
        if (options.viewport && options.designWidth === undefined) {
          options.designWidth = Number(await answer(text({
            input,
            message: '设计宽度',
            defaultValue: '1920',
            validate: value => !value || (Number.isFinite(Number(value)) && Number(value) > 0) ? undefined : '请输入正有限数',
          })))
        }
      }
      const resolved = resolveProjectOptions({ ...options, name: options.name, targetDir: options.target })
      note([
        `项目名称：${resolved.name}`,
        `目标目录：${resolve(resolved.targetDir)}`,
        `项目类型：${resolved.template}`,
        ...('preset' in resolved
          ? [
              `模板：${resolved.preset}`,
              `数据源：${resolved.apiMode}`,
              `功能模块：${resolved.features.join('、') || '无'}`,
            ]
          : [
              `认证：${resolved.auth}${resolved.auth === 'http' ? '（包含认证网络请求）' : ''}`,
              `业务数据：${resolved.data}`,
              `可视化：${resolved.visualization}`,
            ]),
        `路由：${resolved.routerMode}`,
        `px→vw：${resolved.viewport ? `开启，设计宽度 ${resolved.designWidth}` : '关闭'}`,
      ].join('\n'), '配置摘要')
      if (!await answer(confirm({ input, message: '确认创建项目？', active: '创建', inactive: '取消' })))
        throw new PromptCancelled()
    }
    catch (error) {
      if (!(error instanceof PromptCancelled))
        throw error
      cancel('已取消，未创建任何文件。')
      return
    }
    finally {
      process.stdin.unpipe(input)
      input.destroy()
      process.stdin.setRawMode(previousRawMode)
      process.stdin.pause()
    }
  }
  const targetDir = resolve(options.target ?? 'lumal-admin')
  const controller = new AbortController()
  const abort = () => controller.abort(new Error('用户取消创建'))
  const progress = interactive ? spinner({ onCancel: abort }) : undefined
  process.once('SIGINT', abort)
  progress?.start('正在校验模板并创建文件')
  let result
  try {
    result = await createLumalProject({ ...options, name: options.name ?? basename(targetDir), targetDir, signal: controller.signal })
    progress?.stop('项目文件创建完成')
  }
  catch (error) {
    progress?.error('创建失败，本次拥有的文件已执行安全回滚')
    throw error
  }
  finally {
    process.off('SIGINT', abort)
  }
  const summary = 'preset' in result
    ? `${result.preset} / ${result.apiMode} / ${result.routerMode}`
    : `${result.template} / ${result.data} / ${result.routerMode}`
  console.log(`已创建 ${summary} 项目：${result.targetDir}`)
  console.log(`下一步：\n  cd ${JSON.stringify(result.targetDir)}\n  pnpm install\n  pnpm dev`)
  if (('apiMode' in result && result.apiMode === 'http') || ('data' in result && (result.data === 'http' || result.auth === 'http')))
    console.log('请先配置 .env.development 中的 VITE_API_BASE_URL，契约见 API-CONTRACT.md。')
  if (interactive)
    outro('创建成功')
}

class PromptCancelled extends Error {}

async function answer<T>(result: Promise<T>): Promise<Exclude<T, symbol>> {
  const value = await result
  if (isCancel(value))
    throw new PromptCancelled()
  return value as Exclude<T, symbol>
}

async function validation(check: () => void | Promise<void>): Promise<string | undefined> {
  try {
    await check()
  }
  catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

export function canInteract(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY
    && typeof process.stdin.setRawMode === 'function'
    && !process.env.CI && process.env.TERM !== 'dumb')
}

// npm/pnpm 的 node_modules 链接路径与模块真实路径可能不同。
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(resolve(process.argv[1]))).href) {
  main().catch((error: unknown) => {
    console.error(`创建失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
