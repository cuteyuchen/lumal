import { readdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import process from 'node:process'
import { format } from 'prettier'

const root = resolve(import.meta.dirname, '../packages/create-lumal-admin/templates')
const config = (await import('../packages/create-lumal-admin/templates/common/prettier.config.mjs')).default
const write = process.argv.includes('--write')
let failures = 0

async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await check(path)
      continue
    }
    const filepath = path.replace(/\.template$/, '')
    if (!['.vue', '.ts', '.mjs', '.json', '.scss', '.css', '.html', '.md'].includes(extname(filepath)))
      continue
    const original = await readFile(path, 'utf8')
    const formatted = await format(original, { ...config, filepath })
    if (original === formatted)
      continue
    if (write) {
      await writeFile(path, formatted)
    }
    else {
      failures++
      console.error(`模板格式不一致：${path}`)
    }
  }
}

await check(root)
if (failures)
  process.exitCode = 1
else
  console.log(`脚手架模板格式${write ? '更新' : '检查'}通过`)
