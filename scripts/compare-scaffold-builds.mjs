import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { measureAdminBuild } from './measure-admin-build.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const baseline = process.argv[2]
if (!baseline)
  throw new Error('请显式指定已核对的基线：node scripts/compare-scaffold-builds.mjs <commit>')
const report = JSON.parse(await readFile(join(root, 'output/release/scaffold-report.json'), 'utf8'))
if (!report.tempRoot || !existsSync(join(report.tempRoot, 'runner/node_modules/create-lumal-admin/dist/cli.js')))
  throw new Error('消费者临时目录不存在；请先设置 KEEP_LUMAL_CONSUMER_TEMP=1 并运行 pnpm test:create-consumer')
const evidence = join(root, 'output/release/scaffold-comparison')
await mkdir(evidence, { recursive: true })
const source = await mkdtemp(join(evidence, 'source-'))

function command(program, args, cwd = root, capture = false) {
  const started = performance.now()
  const result = spawnSync(program, args, { cwd, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', env: { ...process.env, CI: 'true', VITE_ENABLE_LOCAL_DEMO: 'true' } })
  return { ...result, seconds: Number(((performance.now() - started) / 1000).toFixed(3)) }
}
function pnpm(args, cwd, capture = false) {
  const started = performance.now()
  const windows = process.platform === 'win32'
  const quoted = windows ? args.map(arg => /[\s"]/.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg) : args
  const result = spawnSync(windows ? 'pnpm.cmd' : 'pnpm', quoted, {
    cwd,
    shell: windows,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    env: { ...process.env, CI: 'true', VITE_ENABLE_LOCAL_DEMO: 'true' },
  })
  return { ...result, seconds: Number(((performance.now() - started) / 1000).toFixed(3)) }
}
function assertSuccess(result, label) {
  if (result.error || result.status !== 0)
    throw new Error(`${label}失败：${result.error ?? result.stderr ?? result.status}`)
  return result
}

// 从明确提交提取生成器，未修改原工作区，也不依赖先前遗留的基线目录。
const archive = join(evidence, 'baseline.tar')
assertSuccess(command('git', ['archive', '--format=tar', `--output=${archive}`, baseline, 'packages/create-lumal-admin', 'tsconfig.base.json']), '提取基线')
assertSuccess(command('tar', ['-xf', archive, '-C', source]), '解包基线')
const generator = join(source, 'packages/create-lumal-admin')
// 新基线使用Clack；在隔离目录安装其声明依赖，不借当前工作区的隐式hoist解析。
assertSuccess(pnpm(['install', '--ignore-workspace', '--ignore-scripts', '--frozen-lockfile=false', '--prefer-offline'], generator), '安装基线生成器')
assertSuccess(pnpm(['exec', 'tsc', '-p', join(generator, 'tsconfig.json')], root), '编译基线生成器')
const results = []
const runId = Date.now()

async function measureSample(cli, preset, sample, currentProject) {
  const target = resolve(report.tempRoot, `${sample}-${preset}-${runId}`)
  const manifest = await readFile(join(currentProject.projectDir, 'package.json'), 'utf8')
  const name = JSON.parse(manifest).name
  assertSuccess(command(process.execPath, [cli, target, '--name', name, '--preset', preset, '--no-interactive']), `生成 ${sample}`)
  const generated = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  // 两侧均从空目录冻结安装，统一名称、第三方解析和公开包 tarball，避免缓存布局影响比较。
  await writeFile(join(target, 'package.json'), manifest)
  await writeFile(join(target, 'pnpm-lock.yaml'), await readFile(join(currentProject.projectDir, 'pnpm-lock.yaml')))
  const install = assertSuccess(pnpm(['install', '--frozen-lockfile', '--prefer-offline'], target), `${sample} 安装`)
  assertSuccess(pnpm(['typecheck'], target), `${sample} 类型检查`)
  const build = pnpm(['exec', 'vite', 'build'], target, true)
  await writeFile(join(evidence, `${preset}-${sample}-build.log`), `${build.stdout}\n${build.stderr}`)
  assertSuccess(build, `${sample} 构建`)
  return {
    projectDir: target,
    generatedRuntimeDependencyCount: Object.keys(generated.dependencies ?? {}).length,
    generatedDevelopmentDependencyCount: Object.keys(generated.devDependencies ?? {}).length,
    installSeconds: install.seconds,
    buildSeconds: build.seconds,
    ...await measureAdminBuild(target),
  }
}

for (const preset of ['minimal', 'standard', 'vben-compatible']) {
  const currentProject = report.projects.find(project => project.preset === preset && project.apiMode === 'local' && project.routerMode === 'hash')
  if (!currentProject)
    throw new Error(`缺少 ${preset} 当前消费者证据，请先执行 pnpm test:create-consumer`)
  const before = await measureSample(join(generator, 'dist/cli.js'), preset, 'baseline', currentProject)
  const after = await measureSample(join(report.tempRoot, 'runner/node_modules/create-lumal-admin/dist/cli.js'), preset, 'current', currentProject)
  results.push({
    preset,
    before,
    after,
    delta: Object.fromEntries(['resolvedDependencies', 'installedDependencyInstances', 'initialEntryJsGzip', 'initialRouteJsGzip', 'productionJsGzip', 'productionCssGzip', 'buildSeconds'].map(key => [key, Number((after[key] - before[key]).toFixed(3))])),
  })
}
await writeFile(join(root, 'output/release/scaffold-comparison.json'), `${JSON.stringify({
  environment: { node: process.version, platform: process.platform, date: new Date().toISOString() },
  baseline,
  source,
  method: 'Local/Hash，两侧均全新目录、同名应用、冻结锁文件安装后构建，各采一次热缓存样本。时间不用于速度倍数结论。',
  normalization: '比较生成模板，而非旧发布包原样产物。两侧共用本轮候选 tarball，并将基线 package.json 与 lockfile 对齐当前消费者；不把开发工具依赖变化解释为运行时增量。',
  results,
}, null, 2)}\n`)
console.log('三预设基线对比完成：output/release/scaffold-comparison.json')
