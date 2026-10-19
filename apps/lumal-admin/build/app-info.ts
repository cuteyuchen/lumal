import type { AdminBuildInfo } from '../src/services/app-info'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface PackageManifest {
  version: string
  license?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const appRoot = fileURLToPath(new URL('../', import.meta.url))

/***********************安装版本读取*********************/
function readManifest(path: string): PackageManifest {
  return JSON.parse(readFileSync(path, 'utf8')) as PackageManifest
}

function readInstalledPackage(name: string): PackageManifest {
  return readManifest(join(appRoot, 'node_modules', name, 'package.json'))
}

function resolveDependencyVersions(dependencies: Record<string, string> = {}): Record<string, string> {
  // 展示本次构建实际安装的版本，不能把 ^ / ~ 声明范围当成已安装版本。
  return Object.fromEntries(Object.keys(dependencies).sort().map(name => [
    name,
    readInstalledPackage(name).version,
  ]))
}

/***********************源码标识读取*********************/
function readCommit(): string {
  const options = {
    cwd: appRoot,
    encoding: 'utf8' as const,
    stdio: ['ignore', 'pipe', 'ignore'] as ['ignore', 'pipe', 'ignore'],
  }

  try {
    const commit = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], options).trim()
    const changes = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], options).trim()
    return changes ? `${commit}-dirty` : commit
  }
  catch {
    // 下载源码压缩包构建时可能没有 Git 信息，不影响版本和时间的生成。
    return '未记录'
  }
}

/***********************构建元信息*********************/
export function createAdminBuildInfo(mode: string): AdminBuildInfo {
  const manifest = readManifest(join(appRoot, 'package.json'))
  const coreManifest = readInstalledPackage('@lumal/core')

  return {
    builtAt: new Date().toISOString(),
    commit: readCommit(),
    dependencies: resolveDependencyVersions(manifest.dependencies),
    devDependencies: resolveDependencyVersions(manifest.devDependencies),
    license: coreManifest.license ?? '未声明',
    mode,
    // Demo 自身是 private 应用且版本为 0.0.0，使用框架包版本识别发布批次。
    version: coreManifest.version,
  }
}
