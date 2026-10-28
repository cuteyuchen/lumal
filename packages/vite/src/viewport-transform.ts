import type { AtRule, Declaration, Plugin as PostcssPlugin } from 'postcss'
import type { Plugin as VitePlugin } from 'vite'
import { resolve } from 'node:path'
import process from 'node:process'
import picomatch from 'picomatch'
import { parse } from 'postcss'
import loadPostcssConfig from 'postcss-load-config'
import valueParser from 'postcss-value-parser'
import { createViewportCssTransformer } from './viewport-css'
import { createViewportMediaTransformer } from './viewport-media'
import { transformViewportTemplate } from './viewport-template'

export interface ViewportTransformOptions {
  /** 必须显式开启；不设置时不修改配置。 */
  enabled?: boolean
  /** 相对 Vite root 的 glob，例如 src/screen/**，不允许隐式全项目转换。 */
  include: string[]
  exclude?: string[]
  viewportWidth?: number
  /** 默认直接输出 vw；runtime 由局部包装器或宿主根单位选择 vw / 1px。 */
  output?: 'vw' | 'runtime'
  precision?: number
  /** 默认保留 <=1px，避免细边框消失。 */
  minPixelValue?: number
  /** CSS 属性 glob 白名单，默认全部；空数组表示不转换任何属性。 */
  includeProperties?: string[]
  /** CSS 属性 glob 黑名单，优先于白名单和各类属性开关。 */
  excludeProperties?: string[]
  /** 字符串按选择器子串匹配；任一分组或祖先规则命中时整条声明保留。 */
  excludeSelectors?: (string | RegExp)[]
  /** 独立启用 Vue 模板 style/:style 的静态分析，默认 false；从不扫描脚本。 */
  inlineStyles?: boolean
  /** 默认同时保留 font-size、font 和 line-height。 */
  fontSize?: boolean
  /** 默认保留 min-width/min-height 及对应逻辑属性，显式 true 才转换。 */
  minSize?: boolean
  customProperties?: boolean
  /** 显式转换普通 var() fallback、min/max/clamp 中的 px；已有适配单位和视口变量仍受保护。 */
  variableFallbacks?: boolean
  /** runtime 输出下按根选择器切换媒体/容器宽高断点，未命中时保留原始响应式查询。 */
  mediaQueries?: { runtimeSelector: string }
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
  const transformDeclaration = createViewportCssTransformer(options)
  const transformMedia = createViewportMediaTransformer(options)
  const included = createSourceFilter(options, root)
  function originalSource(declaration: Declaration | AtRule): string | undefined {
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
      if (included(originalSource(declaration)))
        transformDeclaration(declaration)
    },
    AtRuleExit(rule) {
      if (!transformMedia || !included(originalSource(rule)))
        return
      // 混合 Sass 来源不能通过媒体查询入口绕过逐声明范围保护。
      let allowed = true
      rule.walkDecls((declaration) => {
        allowed &&= included(originalSource(declaration))
      })
      if (allowed)
        transformMedia(rule)
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
      if (options.inlineStyles && included(id) && /\.vue$/i.test(id))
        return transformViewportTemplate(code, id, options)
      const language = preprocessorLanguage(id)
      const cssStyle = /[?&]lang\.css(?:&|$)/i.test(id)
      if (!included(id) || (!language && !cssStyle))
        return
      // 普通 SFC CSS 也按块登记，不能被同组件的混合 SCSS 安全状态连带否决。
      const safe = !language || (preambles.get(language) !== false && !hasUntrackedImports(code, id))
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
