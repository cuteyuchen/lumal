import type { Plugin as PostcssPlugin } from 'postcss'
import type { Plugin as VitePlugin } from 'vite'
import { resolve } from 'node:path'
import process from 'node:process'
import picomatch from 'picomatch'
import loadPostcssConfig from 'postcss-load-config'
import valueParser from 'postcss-value-parser'

export interface ViewportTransformOptions {
  /** 必须显式开启；不设置时不修改配置。 */
  enabled?: boolean
  /** 相对 Vite root 的 glob，例如 src/screen/**，不允许隐式全项目转换。 */
  include: string[]
  exclude?: string[]
  viewportWidth?: number
  precision?: number
  /** 默认保留 <=1px，避免细边框消失。 */
  minPixelValue?: number
  fontSize?: boolean
  customProperties?: boolean
  /** 默认排除全部依赖；仅此处显式列出的包可以转换。 */
  dependencies?: string[]
}

function normalize(path: string) {
  const normalized = path.replaceAll('\\', '/').split('?')[0]!
  // 在 Unix CI 中也识别 Windows fixture / file URL 中的盘符路径。
  return normalized.match(/(?:^|\/)([a-z]:\/.*)$/i)?.[1] ?? normalized
}

/** 在预处理后的 CSS AST 上操作，不扫描脚本、模板数字或任意文本。 */
export function createViewportPostcssPlugin(options: ViewportTransformOptions, root = process.cwd()): PostcssPlugin {
  const viewportWidth = options.viewportWidth ?? 1920
  const precision = options.precision ?? 6
  if (!(viewportWidth > 0) || !Number.isFinite(viewportWidth))
    throw new Error('viewportWidth 必须为正数')
  if (!Number.isInteger(precision) || precision < 0 || precision > 10)
    throw new Error('precision 必须为0到10的整数')
  if (options.enabled && !options.include?.length)
    throw new Error('视口转换必须显式指定 include 范围')
  const normalizedRoot = normalize(/^[a-z]:[/\\]/i.test(root) ? root : resolve(root)).replace(/\/$/, '')
  const match = picomatch(options.include ?? [], { dot: true })
  const exclude = picomatch(options.exclude ?? [], { dot: true })
  function included(id: string | undefined) {
    if (!id || !options.enabled)
      return false
    const path = normalize(id)
    const relative = path.toLowerCase().startsWith(`${normalizedRoot.toLowerCase()}/`) ? path.slice(normalizedRoot.length + 1) : path
    if (exclude(path) || exclude(relative))
      return false
    const dependencyPath = path.split('/node_modules/').at(-1)!
    if (dependencyPath !== path) {
      const parts = dependencyPath.split('/')
      const name = parts[0]!.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!
      return options.dependencies?.includes(name) ?? false
    }
    return match(relative) || match(path)
  }
  return {
    postcssPlugin: 'lumal-scoped-viewport',
    Declaration(declaration) {
      if (!included(declaration.source?.input.file)
        || (!options.customProperties && declaration.prop.startsWith('--'))
        || (!options.fontSize && /^(?:font|font-size)$/i.test(declaration.prop))) {
        return
      }
      const parsed = valueParser(declaration.value)
      let changed = false
      parsed.walk((node) => {
        if (node.type === 'function' && /^(?:url|var)$/i.test(node.value))
          return false
        if (node.type !== 'word' || !/^-?(?:\d+(?:\.\d*)?|\.\d+)px$/i.test(node.value))
          return
        const pixels = Number.parseFloat(node.value)
        if (Math.abs(pixels) <= (options.minPixelValue ?? 1))
          return
        node.value = `${Number((pixels / viewportWidth * 100).toFixed(precision))}vw`
        changed = true
      })
      if (changed)
        declaration.value = parsed.toString()
    },
  }
}

/** 保留已有 inline/file PostCSS 配置，开发和构建都在同一 CSS 管线上执行。 */
export function createViewportTransformPlugin(options: ViewportTransformOptions): VitePlugin {
  return {
    name: 'lumal-scoped-viewport',
    async config(config) {
      if (!options.enabled)
        return
      const root = resolve(config.root ?? process.cwd())
      const current = config.css?.postcss
      let inherited = typeof current === 'object' ? current : undefined
      if (!inherited) {
        try {
          const loaded = await loadPostcssConfig({}, typeof current === 'string' ? resolve(root, current) : root)
          inherited = { ...loaded.options, plugins: loaded.plugins }
        }
        catch (error) {
          // 只有“没有配置”可以忽略；配置语法错误与依赖错误必须显式失败。
          if (current || !(error instanceof Error) || !error.message.startsWith('No PostCSS Config found'))
            throw error
        }
      }
      config.css ??= {}
      // 直接替换，避免 Vite 合并数组时把已有插件重复安装。
      config.css.postcss = {
        ...inherited,
        plugins: [...inherited?.plugins ?? [], createViewportPostcssPlugin(options, root)],
      }
    },
  }
}
