import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/** 将已通过门禁的静态文件封装成 Build Output API v3，不重新构建。 */
export function prepareVercelOutput(source, projectDir) {
  const output = join(resolve(projectDir), '.vercel/output')
  if (!existsSync(join(source, 'index.html')))
    throw new Error(`静态产物缺少 index.html：${source}`)
  if (existsSync(output))
    throw new Error(`部署输出已存在，拒绝混入旧文件：${output}`)
  mkdirSync(output, { recursive: true })
  cpSync(source, join(output, 'static'), { recursive: true })
  writeFileSync(join(output, 'config.json'), `${JSON.stringify({ version: 3 }, null, 2)}\n`)
  return output
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4)
    throw new Error('用法：node scripts/prepare-vercel-output.mjs <dist> <project-dir>')
  console.log(`已准备 Vercel 静态产物：${prepareVercelOutput(process.argv[2], process.argv[3])}（未部署）`)
}
