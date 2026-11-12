import type { RollupOutput } from 'rollup'
import type { Plugin, UserConfig } from 'vite'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'
import {
  createVersionBuildId,
  createVersionManifest,
  createVersionManifestPlugin,
} from '../src'

const fixedInfo = {
  buildId: 'abc1234-2026-11-04T08:00:00.000Z',
  builtAt: '2026-11-04T08:00:00.000Z',
  commit: 'abc1234',
  version: '0.1.2-beta',
}

function virtualEntry(source: string): Plugin {
  return {
    name: 'test-version-entry',
    resolveId(id) {
      if (id === 'virtual:version-entry')
        return '\0virtual:version-entry'
    },
    load(id) {
      if (id === '\0virtual:version-entry')
        return source
    },
  }
}

async function buildEntry(
  source: string,
  options: Parameters<typeof createVersionManifestPlugin>[0] = {},
  viteConfig: UserConfig = {},
): Promise<RollupOutput> {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    ...viteConfig,
    plugins: [
      virtualEntry(source),
      createVersionManifestPlugin(options),
    ],
    build: {
      write: false,
      ...viteConfig.build,
      rollupOptions: {
        input: 'virtual:version-entry',
        ...viteConfig.build?.rollupOptions,
      },
    },
  })

  if ('close' in result)
    throw new Error('测试构建不应返回 watcher')
  return result as RollupOutput
}

function readManifest(output: RollupOutput, fileName = 'version.json') {
  const asset = output.output.find(item => item.type === 'asset' && item.fileName === fileName)
  if (!asset || asset.type !== 'asset')
    throw new Error(`构建产物缺少 ${fileName}`)
  return JSON.parse(asset.source.toString()) as Record<string, unknown>
}

function readChunk(output: RollupOutput): string {
  const chunk = output.output.find(item => item.type === 'chunk')
  if (!chunk || chunk.type !== 'chunk')
    throw new Error('构建产物缺少 JS chunk')
  return chunk.code
}

describe('createVersionManifestPlugin', () => {
  it('同一次构建向 JS 与 version.json 注入完全相同的 buildId', async () => {
    const output = await buildEntry('globalThis.buildInfo = __LUMAL_VERSION_INFO__', { info: fixedInfo })

    expect(readManifest(output)).toEqual(fixedInfo)
    expect(readChunk(output)).toContain(fixedInfo.buildId)
    expect(readChunk(output)).not.toContain('__LUMAL_VERSION_INFO__')
  })

  it('默认文件只包含构建身份，不泄露依赖、环境变量或内部字段', async () => {
    const output = await buildEntry('globalThis.buildInfo = __LUMAL_VERSION_INFO__', { info: fixedInfo })

    expect(Object.keys(readManifest(output)).sort()).toEqual(['buildId', 'builtAt', 'commit', 'version'])
  })

  it('同版本号的不同构建仍可通过 buildId 区分', async () => {
    const first = await buildEntry('globalThis.buildInfo = __LUMAL_VERSION_INFO__', {
      info: { ...fixedInfo, buildId: undefined, builtAt: '2026-11-04T08:00:00.000Z' },
    })
    const second = await buildEntry('globalThis.buildInfo = __LUMAL_VERSION_INFO__', {
      info: { ...fixedInfo, buildId: undefined, builtAt: '2026-11-04T08:00:01.000Z' },
    })

    expect(readManifest(first).version).toBe(readManifest(second).version)
    expect(readManifest(first).buildId).not.toBe(readManifest(second).buildId)
    expect(readManifest(first).buildId).toBe(createVersionBuildId(fixedInfo.commit, '2026-11-04T08:00:00.000Z'))
  })

  it('子路径构建仍把 version.json 放在自己的 outDir 根目录', async () => {
    const output = await buildEntry('globalThis.buildInfo = __LUMAL_VERSION_INFO__', { info: fixedInfo }, { base: '/px/' })

    expect(readManifest(output)).toEqual(fixedInfo)
    expect(output.output.some(item => item.fileName === 'px/version.json')).toBe(false)
  })

  it('支持自定义文件名与 define 名称', async () => {
    const output = await buildEntry('globalThis.buildInfo = __LUMAL_CUSTOM_INFO__', {
      defineName: '__LUMAL_CUSTOM_INFO__',
      fileName: 'build-info.json',
      info: fixedInfo,
    })

    expect(readManifest(output, 'build-info.json')).toEqual(fixedInfo)
    expect(readChunk(output)).toContain(fixedInfo.buildId)
  })

  it('关闭注入时仍生成 manifest，关闭插件时两种产物都不生成', async () => {
    const manifestOnly = await buildEntry('globalThis.buildInfo = __LUMAL_VERSION_INFO__', {
      info: fixedInfo,
      inject: false,
    })
    expect(readManifest(manifestOnly)).toEqual(fixedInfo)
    expect(readChunk(manifestOnly)).toContain('__LUMAL_VERSION_INFO__')

    const disabled = await buildEntry('globalThis.buildInfo = __LUMAL_VERSION_INFO__', {
      enabled: false,
      info: fixedInfo,
    })
    expect(disabled.output.some(item => item.fileName === 'version.json')).toBe(false)
  })

  it('只在 build 阶段启用，开发与预览不会生成快照', () => {
    expect(createVersionManifestPlugin().apply).toBe('build')
  })

  it('ssr 构建默认不生成部署清单，可显式开启', () => {
    function emitForSsr(plugin: Plugin) {
      const hooks = plugin as unknown as {
        configResolved: (config: { build: { ssr: boolean } }) => void
        generateBundle: (this: { emitFile: (file: unknown) => void }) => void
      }
      const files: unknown[] = []
      hooks.configResolved({ build: { ssr: true } })
      hooks.generateBundle.call({ emitFile: file => files.push(file) })
      return files
    }

    expect(emitForSsr(createVersionManifestPlugin({ info: fixedInfo }))).toHaveLength(0)
    expect(emitForSsr(createVersionManifestPlugin({ info: fixedInfo, ssr: true }))).toHaveLength(1)
  })

  it('缺少显式身份时从构建目录读取包版本并生成稳定 buildId', () => {
    const manifest = createVersionManifest({
      builtAt: '2026-11-04T08:00:00.000Z',
      commit: 'abcdefg',
      version: '9.9.9',
    })

    expect(manifest).toEqual({
      buildId: 'abcdefg-2026-11-04T08:00:00.000Z',
      builtAt: '2026-11-04T08:00:00.000Z',
      commit: 'abcdefg',
      version: '9.9.9',
    })
  })
})
