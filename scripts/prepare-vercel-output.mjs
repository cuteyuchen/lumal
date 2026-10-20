import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/** 将已通过门禁的静态文件封装成 Build Output API v3，不重新构建。 */
export function prepareVercelOutput(source, projectDir, { cleanUrls = false } = {}) {
  const output = join(resolve(projectDir), '.vercel/output')
  if (!existsSync(join(source, 'index.html')))
    throw new Error(`静态产物缺少 index.html：${source}`)
  if (existsSync(output))
    throw new Error(`部署输出已存在，拒绝混入旧文件：${output}`)
  const config = { version: 3 }
  if (cleanUrls) {
    if (!existsSync(join(source, '404.html')))
      throw new Error(`文档静态产物缺少 404.html：${source}`)
    // 映射无扩展名文档路径；目录首页保留文件系统默认规则，未知路径返回真实 404。
    config.overrides = Object.fromEntries(readdirSync(source, { recursive: true })
      .filter(name => name.endsWith('.html') && basename(name) !== 'index.html'
        && name !== '404.html' && statSync(join(source, name)).isFile())
      .sort()
      .map((name) => {
        const path = name.replaceAll('\\', '/')
        return [path, { path: path.slice(0, -'.html'.length) }]
      }))
    config.routes = [
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/404.html', status: 404 },
    ]
  }
  mkdirSync(output, { recursive: true })
  cpSync(source, join(output, 'static'), { recursive: true })
  writeFileSync(join(output, 'config.json'), `${JSON.stringify(config, null, 2)}\n`)
  return output
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [source, project, flag] = process.argv.slice(2)
  if (process.argv.length < 4 || process.argv.length > 5 || (flag && flag !== '--clean-urls'))
    throw new Error('用法：node scripts/prepare-vercel-output.mjs <dist> <project-dir> [--clean-urls]')
  console.log(`已准备 Vercel 静态产物：${prepareVercelOutput(source, project, { cleanUrls: flag === '--clean-urls' })}（未部署）`)
}
