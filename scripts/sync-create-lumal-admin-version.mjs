import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const packageDir = process.cwd()
const packageJsonPath = join(packageDir, 'package.json')
const scaffoldPath = join(packageDir, 'dist/scaffold.js')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version

if (typeof version !== 'string' || !version.trim()) {
  throw new TypeError('create-lumal-admin package.json 缺少有效 version')
}

const source = readFileSync(scaffoldPath, 'utf8')
let replacementCount = 0
const output = source.replace(/(['"])\^0\.0\.0\1/g, () => {
  replacementCount += 1
  return JSON.stringify(version)
})

if (replacementCount !== 3) {
  throw new Error(`脚手架依赖版本占位符数量异常：期望 3，实际 ${replacementCount}`)
}

writeFileSync(scaffoldPath, output)
console.log(`create-lumal-admin 模板依赖已同步为 ${version}`)
