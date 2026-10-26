import type { Declaration, Plugin as PostcssPlugin } from 'postcss'
import type { Plugin as VitePlugin } from 'vite'
import { resolve } from 'node:path'
import process from 'node:process'
import picomatch from 'picomatch'
import { parse } from 'postcss'
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
  if (path.startsWith('file:')) {
    const url = new URL(path)
    path = `${url.host ? `//${url.host}` : ''}${decodeURIComponent(url.pathname)}`
  }
  const normalized = path.replaceAll('\\', '/').split('?')[0]!
  // 在 Unix CI 中也识别 Windows fixture / file URL 中的盘符路径。
  return normalized.match(/(?:^|\/)([a-z]:\/.*)$/i)?.[1] ?? normalized
}

const preprocessorLanguages = ['scss', 'sass', 'less', 'styl', 'stylus'] as const

function preprocessorLanguage(id: string) {
  return id.match(/\.(scss|sass|less|styl|stylus)(?:$|[?&])/i)?.[1]?.toLowerCase() as typeof preprocessorLanguages[number] | undefined
}

function createSourceFilter(options: ViewportTransformOptions, root: string) {
  const normalizedRoot = normalize(/^[a-z]:[/\\]/i.test(root) ? root : resolve(root)).replace(/\/$/, '')
  const match = picomatch(options.include ?? [], { dot: true })
  const exclude = picomatch(options.exclude ?? [], { dot: true })
  return (id: string | undefined) => {
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
}

function createPostcssPlugin(options: ViewportTransformOptions, root: string, sourceAllowed?: (id: string) => boolean): PostcssPlugin {
  const viewportWidth = options.viewportWidth ?? 1920
  const precision = options.precision ?? 6
  if (!(viewportWidth > 0) || !Number.isFinite(viewportWidth))
    throw new Error('viewportWidth 必须为正数')
  if (!Number.isInteger(precision) || precision < 0 || precision > 10)
    throw new Error('precision 必须为0到10的整数')
  if (options.enabled && !options.include?.length)
    throw new Error('视口转换必须显式指定 include 范围')
  const included = createSourceFilter(options, root)
  function originalSource(declaration: Declaration): string | undefined {
    const source = declaration.source
    if (!source)
      return undefined
    // Sass 等预处理器可能把边界外样式合并到入口；有 map 时必须按声明原址判断。
    if (source.input.map) {
      const origin = source.start && source.input.origin(source.start.line, source.start.column)
      return origin ? origin.file ?? origin.url : undefined
    }
    const file = source.input.file
    if (!file)
      return undefined
    if (sourceAllowed)
      return sourceAllowed(file) ? file : undefined
    // 低层PostCSS入口没有Vite原文证明，预处理输出必须携带原始map。
    const unknownSfc = /\.vue(?:$|\?)/i.test(file) && !/[?&]lang\.css(?:&|$)/i.test(file)
    return preprocessorLanguage(file) || unknownSfc ? undefined : file
  }
  return {
    postcssPlugin: 'lumal-scoped-viewport',
    Declaration(declaration) {
      if (!included(originalSource(declaration))
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

/** 在预处理后的 CSS AST 上操作，不扫描脚本、模板数字或任意文本。 */
export function createViewportPostcssPlugin(options: ViewportTransformOptions, root = process.cwd()): PostcssPlugin {
  return createPostcssPlugin(options, root)
}

function styleIndex(id: string) {
  return new URLSearchParams(id.split('?')[1]).get('index') ?? ''
}

function hasUntrackedImports(code: string, id: string): boolean {
  try {
    let unsafe = false
    // 使用已有 CSS/值解析器；无法解析的预处理语法同样保守跳过，不猜测导入范围。
    parse(code, { from: id }).walkAtRules(/^(?:use|forward|import)$/i, (rule) => {
      const values = valueParser(rule.params).nodes
      const sources = values.filter(node => node.type === 'string')
      if (!sources.length) {
        const nativeImport = rule.name.toLowerCase() === 'import' && values.some(node => node.type === 'function' && node.value.toLowerCase() === 'url')
        unsafe ||= !nativeImport
        return
      }
      for (const source of sources) {
        const builtin = source.value.startsWith('sass:')
        const nativeImport = rule.name.toLowerCase() === 'import' && /^(?:https?:)?\/\/|\.css(?:[?#]|$)/i.test(source.value)
        unsafe ||= !builtin && !nativeImport
      }
    })
    return unsafe
  }
  catch {
    return true
  }
}

/** 保留已有 inline/file PostCSS 配置，开发和构建都在同一 CSS 管线上执行。 */
export function createViewportTransformPlugin(options: ViewportTransformOptions): VitePlugin {
  const sources = new Map<string, Map<string, boolean>>()
  const preambles = new Map<string, boolean>()
  let included: ReturnType<typeof createSourceFilter> = () => false
  function sourceAllowed(id: string) {
    const styles = sources.get(normalize(id))
    return styles?.get(styleIndex(id)) ?? [...styles?.values() ?? []].every(Boolean)
  }
  return {
    name: 'lumal-scoped-viewport',
    enforce: 'pre',
    transform(code, id) {
      const language = preprocessorLanguage(id)
      if (!included(id) || !language)
        return
      const safe = preambles.get(language) !== false && !hasUntrackedImports(code, id)
      const path = normalize(id)
      const styles = sources.get(path) ?? new Map<string, boolean>()
      styles.set(styleIndex(id), safe)
      sources.set(path, styles)
      if (!safe)
        this.warn(`跳过视口转换 ${path}：预处理样式含跨文件导入或无法可靠解析的语法；请将外部样式与 Screen 声明分离，避免无原始 source map 时越过转换边界。`)
    },
    configResolved(config) {
      for (const language of preprocessorLanguages) {
        const additional = config.css.preprocessorOptions?.[language]?.additionalData
        // 函数可任意注入跨文件样式；没有原始map时不能凭入口路径批准其输出。
        preambles.set(language, additional === undefined || (typeof additional === 'string' && !hasUntrackedImports(additional, `${config.root}/injected.${language}`)))
      }
    },
    async config(config) {
      if (!options.enabled)
        return
      const root = resolve(config.root ?? process.cwd())
      included = createSourceFilter(options, root)
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
        plugins: [...inherited?.plugins ?? [], createPostcssPlugin(options, root, sourceAllowed)],
      }
    },
  }
}
