import type { resolveOptions } from './presets.js'
import type { TemplateFile } from './types.js'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const templateRoot = fileURLToPath(new URL('../templates/', import.meta.url))

export async function getVersion(): Promise<string> {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }
  return manifest.version
}

/***********************公共模板组合*********************/
async function readLayer(name: string, directory = '', result: TemplateFile[] = []): Promise<TemplateFile[]> {
  const entries = await readdir(join(templateRoot, name, directory), { withFileTypes: true })
  for (const entry of entries) {
    const path = directory ? `${directory}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      await readLayer(name, path, result)
    }
    else {
      result.push({
        path: path.replace(/\.template$/, '').replace(/^_gitignore$/, '.gitignore'),
        content: await readFile(join(templateRoot, name, path), 'utf8'),
      })
    }
  }
  return result
}

export async function composeTemplates(options: ReturnType<typeof resolveOptions>): Promise<TemplateFile[]> {
  const layers = ['base', `modes/${options.apiMode}`, ...options.features.map(feature => `features/${feature}`)]
  if (options.preset === 'vben-compatible')
    layers.push('vben-compatible')
  const files = new Map<string, string>()
  for (const layer of layers) {
    for (const file of await readLayer(layer))
      files.set(file.path, file.content)
  }

  const version = await getVersion()
  const manifest = JSON.parse(files.get('package.json')!) as {
    name: string
    dependencies: Record<string, string>
  }
  manifest.name = options.name
  for (const name of ['@lumal/core', '@lumal/icons', '@lumal/icons-vue'])
    manifest.dependencies[name] = version
  if (options.preset === 'vben-compatible')
    manifest.dependencies['@lumal/vben-compat'] = version
  manifest.dependencies = Object.fromEntries(Object.entries(manifest.dependencies).sort(([left], [right]) => left.localeCompare(right)))
  files.set('package.json', `${JSON.stringify(manifest, null, 2)}\n`)
  files.set('.env.development', 'VITE_API_BASE_URL=\nVITE_API_ADAPTER=standard\n')
  files.set('.env.production.example', 'VITE_API_BASE_URL=https://api.example.com\nVITE_API_ADAPTER=standard\n# Local 演示生产构建默认禁止登录；仅演示站点显式启用。\nVITE_ENABLE_LOCAL_DEMO=false\n')

  // 只注入小型配置；完整 SFC、服务和工程文件均保存在模板目录中。
  files.set('src/app.config.ts', `export const appConfig: {
  apiMode: 'http' | 'local'
  features: string[]
  preset: 'minimal' | 'standard' | 'vben-compatible'
  routerMode: 'hash' | 'history'
  title: string
} = {
  apiMode: '${options.apiMode}',
  features: [${options.features.map(feature => `'${feature}'`).join(', ')}],
  preset: '${options.preset}',
  routerMode: '${options.routerMode}',
  title: '${options.name}',
}\n`)
  return [...files].map(([path, content]) => ({ path, content })).sort((a, b) => a.path.localeCompare(b.path))
}
