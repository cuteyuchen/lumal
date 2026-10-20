import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { parse } from 'yaml'

/** 统一统计 Vite manifest 的静态闭包；路由增量不重复计算应用入口。 */
export async function measureAdminBuild(projectDir, lockfile = join(projectDir, 'pnpm-lock.yaml')) {
  const dist = join(projectDir, 'dist')
  const lock = parse(await readFile(lockfile, 'utf8'))
  const installed = await readdir(join(dirname(lockfile), 'node_modules/.pnpm'), { withFileTypes: true })
  const manifest = JSON.parse(await readFile(join(dist, '.vite/manifest.json'), 'utf8'))
  const sizes = new Map()
  for (const file of await readdir(dist, { recursive: true })) {
    if (!/\.(?:css|js)$/.test(file))
      continue
    const data = await readFile(join(dist, file))
    sizes.set(file.replaceAll('\\', '/'), { bytes: data.byteLength, gzip: gzipSync(data).byteLength })
  }
  function closure(key, result = new Set()) {
    if (result.has(key))
      return result
    result.add(key)
    for (const imported of manifest[key]?.imports ?? [])
      closure(imported, result)
    return result
  }
  function gzip(keys) {
    return [...keys].reduce((sum, key) => sum + (sizes.get(manifest[key]?.file)?.gzip ?? 0), 0)
  }
  const initial = new Set(Object.keys(manifest).filter(key => manifest[key].isEntry).flatMap(key => [...closure(key)]))
  const startup = new Set(initial)
  // Vben 的启动器通过动态 import 加载 bootstrap，不能把这部分启动代价漏掉。
  if (manifest['src/bootstrap.ts'])
    closure('src/bootstrap.ts', startup)
  const loginKeys = Object.keys(manifest).filter(key => /(?:LoginView\.vue|\/login\.vue|_login-[^/]+\.js)$/.test(key))
  const initialRoute = new Set(startup)
  if (manifest['src/layouts/auth.vue'])
    closure('src/layouts/auth.vue', initialRoute)
  loginKeys.forEach(key => closure(key, initialRoute))
  const lazyRoutes = Object.fromEntries(Object.keys(manifest)
    .filter(key => key.endsWith('.vue'))
    .map(key => [key, { file: manifest[key].file, additionalJsGzip: gzip(new Set([...closure(key)].filter(item => !startup.has(item)))) }]))
  return {
    resolvedDependencies: Object.keys(lock.snapshots ?? {}).length,
    installedDependencyInstances: installed.filter(entry => entry.isDirectory() && entry.name !== 'node_modules').length,
    productionJsBytes: [...sizes].filter(([path]) => path.endsWith('.js')).reduce((sum, [, size]) => sum + size.bytes, 0),
    productionCssBytes: [...sizes].filter(([path]) => path.endsWith('.css')).reduce((sum, [, size]) => sum + size.bytes, 0),
    productionJsGzip: [...sizes].filter(([path]) => path.endsWith('.js')).reduce((sum, [, size]) => sum + size.gzip, 0),
    productionCssGzip: [...sizes].filter(([path]) => path.endsWith('.css')).reduce((sum, [, size]) => sum + size.gzip, 0),
    initialEntryJsGzip: gzip(initial),
    startupJsGzip: gzip(startup),
    initialRouteJsGzip: gzip(initialRoute),
    lazyRoutes,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const project = resolve(process.argv[2] ?? '.')
  console.log(JSON.stringify(await measureAdminBuild(project, process.argv[3] ? resolve(process.argv[3]) : undefined), null, 2))
}
