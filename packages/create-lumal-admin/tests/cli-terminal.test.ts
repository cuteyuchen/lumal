// @vitest-environment node
import type { IPty } from '@lydell/node-pty'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import { spawn } from '@lydell/node-pty'
import { afterEach, describe, expect, it } from 'vitest'

const cli = process.env.LUMAL_TEST_CLI || resolve(import.meta.dirname, '../dist/cli.js')
const temporary: string[] = []
const processes: { pty: IPty, exited: Promise<void> }[] = []
let caseNumber = 0

async function terminal(args: string[] = [], entry = cli) {
  const cwd = await mkdtemp(join(tmpdir(), 'lumal-cli-pty-'))
  temporary.push(cwd)
  const env = Object.fromEntries(Object.entries(process.env).filter(([key, value]) => key !== 'CI' && value !== undefined)) as Record<string, string>
  const command = process.platform === 'win32' ? 'powershell.exe' : process.execPath
  const commandArgs = process.platform === 'win32'
    ? ['-NoLogo', '-NoProfile', '-Command', `& ${[process.execPath, entry, ...args].map(value => `'${value.replaceAll('\'', '\'\'')}'`).join(' ')}`]
    : [entry, ...args]
  const pty = spawn(command, commandArgs, {
    cwd,
    env: { ...env, TERM: 'xterm-256color', FORCE_COLOR: '0' },
    cols: 120,
    rows: 40,
    // 固定测试控制台实现，避免宿主系统版本改变 ANSI 渲染结果。
    useConptyDll: process.platform === 'win32',
  })
  let release: () => void = () => {}
  const exited = new Promise<void>((done) => {
    release = done
  })
  processes.push({ pty, exited })
  let output = ''
  let consumed = 0
  let exitCode: number | undefined
  const listeners = new Set<() => void>()
  pty.onData((data) => {
    output += data
    // Windows ConPTY 会请求光标位置，真实终端会发送同样的响应。
    if (data.includes('\x1B[6n'))
      pty.write('\x1B[1;1R')
    listeners.forEach(listener => listener())
  })
  pty.onExit((event) => {
    exitCode = event.exitCode
    release()
    listeners.forEach(listener => listener())
  })
  function wait(check: () => boolean, description = '退出'): Promise<void> {
    return new Promise((done, reject) => {
      const timer = setTimeout(() => {
        listeners.delete(update)
        reject(new Error(`终端等待失败（${description}）：\n${stripVTControlCharacters(output)}`))
      }, 10_000)
      function update() {
        if (check()) {
          clearTimeout(timer)
          listeners.delete(update)
          done()
        }
      }
      listeners.add(update)
      update()
    })
  }
  return {
    cwd,
    write: (keys: string) => pty.write(keys),
    async prompt(text: string, error = false) {
      // ConPTY 可把标题与剩余选项拆成多帧；完整底边出现后才发送按键。
      await wait(() => {
        const frame = stripVTControlCharacters(output.slice(consumed))
        const title = frame.indexOf(text)
        return title >= 0 && (error || frame.slice(title + text.length).includes('└'))
      }, text)
      consumed = output.length
    },
    async finish() {
      await wait(() => exitCode !== undefined)
      const evidence = resolve(import.meta.dirname, '../../../output/release/cli-terminal')
      await mkdir(evidence, { recursive: true })
      await writeFile(join(evidence, `${process.platform}-${++caseNumber}.log`), stripVTControlCharacters(output))
      return { output: stripVTControlCharacters(output), exitCode }
    },
  }
}

afterEach(async () => {
  for (const { pty, exited } of processes.splice(0)) {
    try {
      pty.kill()
    }
    catch { /* 已退出的 ConPTY 不需要再次终止。 */ }
    await exited
  }
  await Promise.all(temporary.splice(0).map((path) => {
    if (!resolve(path).startsWith(join(tmpdir(), 'lumal-cli-')))
      throw new Error('拒绝清理测试目录以外的路径')
    return rm(path, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }))
})

describe('真实终端向导', () => {
  it('screen 交互选择可视化和适配，并在摘要确认前保持无文件', async () => {
    const term = await terminal(['screen-project', '--template', 'screen', '--auth', 'none', '--data', 'none', '--router-mode', 'none'])
    await term.prompt('npm 项目名称')
    term.write('\r')
    await term.prompt('Screen 可视化')
    term.write('\x1B[B\x1B[B\r')
    await term.prompt('Screen 适配')
    term.write('\x1B[B\r')
    await term.prompt('确认创建项目')
    expect(existsSync(join(term.cwd, 'screen-project'))).toBe(false)
    term.write('\r')
    expect((await term.finish()).exitCode).toBe(0)
    const manifest = JSON.parse(await readFile(join(term.cwd, 'screen-project/package.json'), 'utf8'))
    expect(manifest.dependencies).toHaveProperty('@lumal/datav')
    expect(manifest.dependencies).not.toHaveProperty('@lumal/cockpit')
  }, 30_000)
  it('通用入口方向键选择 Blank，不询问或生成 Admin 能力', async () => {
    const term = await terminal(['blank-project'], cli.replace(/cli\.js$/, 'project-cli.js'))
    await term.prompt('npm 项目名称')
    term.write('\r')
    await term.prompt('项目类型')
    term.write('\x1B[B\x1B[B\r')
    await term.prompt('确认创建项目')
    expect(existsSync(join(term.cwd, 'blank-project'))).toBe(false)
    term.write('\r')
    const result = await term.finish()
    expect(result.exitCode).toBe(0)
    expect(result.output).not.toContain('可选功能')
    const manifest = JSON.parse(await readFile(join(term.cwd, 'blank-project/package.json'), 'utf8'))
    expect(manifest.dependencies).toEqual({ vue: '^3.5.0' })
  }, 30_000)

  it.each(['blank', 'screen'])('%s Escape 取消不留下部分工程', async (template) => {
    const term = await terminal(['cancel-project', '--template', template])
    await term.prompt('npm 项目名称')
    term.write('\x1B')
    expect((await term.finish()).output).toContain('已取消')
    expect(existsSync(join(term.cwd, 'cancel-project'))).toBe(false)
  }, 20_000)
  it('方向键单选、Space 多选、摘要确认之前不写入文件', async () => {
    const term = await terminal(['admin'])
    await term.prompt('npm 项目名称')
    term.write('\r')
    await term.prompt('项目模板')
    term.write('\x1B[B\r') // standard -> vben-compatible
    await term.prompt('数据源模式')
    term.write('\x1B[B\r') // local -> http
    await term.prompt('路由模式')
    term.write('\x1B[B\r') // hash -> history
    await term.prompt('可选功能')
    term.write(' \x1B[B \x1B[A \r') // 关闭 system/examples，再启用 system
    await term.prompt('确认创建项目')
    expect(existsSync(join(term.cwd, 'admin'))).toBe(false)
    term.write('\r')
    expect((await term.finish()).exitCode).toBe(0)
    const config = await readFile(join(term.cwd, 'admin/src/app.config.ts'), 'utf8')
    expect(config).toContain('preset: \'vben-compatible\'')
    expect(config).toContain('apiMode: \'http\'')
    expect(config).toContain('routerMode: \'history\'')
    expect(config).toContain('features: [\'system\']')
  }, 30_000)

  it('默认值、参数预填以及 minimal 不展示可选模块', async () => {
    const term = await terminal(['--preset', 'minimal', '--api-mode', 'local', '--router-mode', 'hash'])
    await term.prompt('项目目录')
    term.write('\r')
    await term.prompt('npm 项目名称')
    term.write('\r')
    await term.prompt('确认创建项目')
    term.write('\r')
    const result = await term.finish()
    expect(result.exitCode).toBe(0)
    expect(result.output).not.toContain('可选功能')
    expect(existsSync(join(term.cwd, 'lumal-admin/package.json'))).toBe(true)
  }, 30_000)

  it.each(['\x03', '\x1B'])('ctrl+C / Escape 取消不残留目录 %j', async (key) => {
    const term = await terminal(['cancelled'])
    await term.prompt('npm 项目名称')
    term.write(key)
    expect((await term.finish()).output).toContain('已取消')
    expect(existsSync(join(term.cwd, 'cancelled'))).toBe(false)
  }, 20_000)

  it('拒绝确认不创建项目，--features none 不再次询问', async () => {
    const term = await terminal(['cancelled', '--name', 'test-admin', '--preset', 'standard', '--api-mode', 'local', '--router-mode', 'hash', '--features', 'none'])
    await term.prompt('确认创建项目')
    term.write('n\r')
    const result = await term.finish()
    expect(result.output).toContain('功能模块：无')
    expect(result.output).not.toContain('可选功能')
    expect(existsSync(join(term.cwd, 'cancelled'))).toBe(false)
  }, 20_000)

  it('npm 名称错误在终端内反馈并允许修正', async () => {
    const term = await terminal(['admin', '--preset', 'minimal', '--api-mode', 'local', '--router-mode', 'hash'])
    await term.prompt('npm 项目名称')
    term.write('Bad Name\r')
    await term.prompt('非法 npm 项目名称', true)
    term.write('\x15good-name\r')
    await term.prompt('确认创建项目')
    term.write('\r')
    expect((await term.finish()).exitCode).toBe(0)
    const manifest = JSON.parse(await readFile(join(term.cwd, 'admin/package.json'), 'utf8'))
    expect(manifest.name).toBe('good-name')
  }, 30_000)

  it.each([{ CI: 'true' }, { TERM: 'dumb' }])('cI / 非 TTY 不读取 stdin %j', async (env) => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumal-cli-pipe-'))
    temporary.push(cwd)
    const result = spawnSync(process.execPath, [cli, 'admin', '--features', 'none'], {
      cwd,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      timeout: 10_000,
      input: '',
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('standard / local / hash')
    expect(result.stdout).not.toContain('确认创建项目')
  })
})
