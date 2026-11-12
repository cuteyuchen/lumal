import type { Plugin } from 'vite'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

/***********************构建身份*********************/
export interface VersionManifest {
  /** 每次实际构建唯一；客户端与 version.json 必须完全一致。 */
  buildId: string
  /** 仅用于展示，不参与更新判断。 */
  version: string
  /** 源码提交标识；无 Git 信息时为“未记录”。 */
  commit: string
  /** 本次构建的 ISO 时间，同一次构建只生成一次。 */
  builtAt: string
}

export interface CreateVersionManifestPluginOptions {
  /** 设为 false 时不注入 define，也不生成 version.json。 */
  enabled?: boolean
  /** 完整或部分构建身份；未提供的字段按 root 下的包与 Git 信息推导。 */
  info?: Partial<VersionManifest>
  /** 生成的静态文件名，默认 version.json。 */
  fileName?: string
  /** 注入到浏览器代码的全局变量名，默认 __LUMAL_VERSION_INFO__。 */
  defineName?: string
  /** 设为 false 时只生成 version.json，不注入 define。 */
  inject?: boolean
  /** SSR 构建是否也生成 version.json，默认 false；define 仍按需注入。 */
  ssr?: boolean
  /** 读取 package.json 与 Git 信息的目录，默认 process.cwd()。 */
  root?: string
}

export function createVersionBuildId(commit: string, builtAt: string): string {
  return `${commit}-${builtAt}`
}

function readCommit(root: string): string {
  const environmentCommit = process.env.LUMAL_BUILD_COMMIT
    || process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.GITHUB_SHA
  if (environmentCommit)
    return environmentCommit.slice(0, 7)

  try {
    const options = {
      cwd: root,
      encoding: 'utf8' as const,
      stdio: ['ignore', 'pipe', 'ignore'] as ['ignore', 'pipe', 'ignore'],
    }
    const commit = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], options).trim()
    const changes = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], options).trim()
    return changes ? `${commit}-dirty` : commit
  }
  catch {
    // 源码压缩包、只读 CI 缓存等没有 Git 信息时仍可完成构建。
    return '未记录'
  }
}

function readVersion(root: string): string {
  try {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version?: string }
    return manifest.version?.trim() || '0.0.0'
  }
  catch {
    return '0.0.0'
  }
}

/**
 * 构造一次构建的唯一身份。调用方应在单次构建内只调用一次，
 * 或显式传入 builtAt/buildId，避免 JS 与 version.json 出现不同时间戳。
 */
export function createVersionManifest(
  info: Partial<VersionManifest> = {},
  root = process.cwd(),
): VersionManifest {
  const builtAt = info.builtAt ?? new Date().toISOString()
  const commit = info.commit ?? readCommit(root)
  const version = info.version ?? readVersion(root)

  return {
    buildId: info.buildId ?? createVersionBuildId(commit, builtAt),
    version,
    commit,
    builtAt,
  }
}

/**
 * 构建期生成部署静态元数据，并向浏览器注入同一份构建身份。
 * 只应在实际构建中启用；Vite dev/preview 的启动流程不会创建版本快照。
 */
export function createVersionManifestPlugin(options: CreateVersionManifestPluginOptions = {}): Plugin {
  const defineName = options.defineName ?? '__LUMAL_VERSION_INFO__'
  const fileName = options.fileName ?? 'version.json'
  let manifest: VersionManifest | undefined
  let isSsrBuild = false

  // 一次构建内复用同一快照，define 与 version.json 不会因 new Date() 漂移。
  function resolveManifest(): VersionManifest {
    manifest ??= createVersionManifest(options.info, options.root)
    return manifest
  }

  return {
    name: 'lumal-version-manifest',
    apply: 'build',
    config() {
      if (options.enabled === false || options.inject === false)
        return

      return {
        define: {
          [defineName]: JSON.stringify(resolveManifest()),
        },
      }
    },
    configResolved(config) {
      isSsrBuild = Boolean(config.build.ssr)
    },
    generateBundle() {
      if (options.enabled === false || (isSsrBuild && options.ssr !== true))
        return

      // fileName 相对本次 build.outDir，因此 / 与 /px/ 各自生成自己的文件。
      this.emitFile({
        type: 'asset',
        fileName,
        source: `${JSON.stringify(resolveManifest(), null, 2)}\n`,
      })
    },
  }
}
