import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

// build:app 是内部的仅应用步骤；常规 build 会先按顺序构建工作区依赖。
export function checkCockpitBuildInputs(workspace = root) {
  const app = JSON.parse(readFileSync(resolve(workspace, 'apps/lumal-cockpit/package.json'), 'utf8'))
  // Vite 配置同样通过公开入口消费开发依赖，不能依赖本机遗留的 dist。
  const missing = Object.keys({ ...app.dependencies, ...app.devDependencies })
    .filter(name => name.startsWith('@lumal/'))
    .filter((name) => {
      const directory = resolve(workspace, 'packages', name.slice(7))
      const metadata = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'))
      const entry = metadata.exports['.']
      return ![entry.types, entry.import].every(path => existsSync(resolve(directory, path)))
    })
  if (missing.length) {
    throw new Error(`Cockpit 缺少预构建产物：${missing.join(', ')}。\n请在仓库根目录执行 pnpm cockpit:build，或先执行 pnpm cockpit:deps 再运行 build:app。`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    checkCockpitBuildInputs()
  }
  catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
