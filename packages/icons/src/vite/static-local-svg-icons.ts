export interface StaticLocalSvgIconsManifestSource {
  import: string
  exportName?: string
}

export interface CreateStaticLocalSvgIconsPluginOptions {
  localSvg?: StaticLocalSvgIconsManifestSource | string | false
}

interface VitePluginLike {
  name: string
  enforce?: 'pre' | 'post'
  resolveId?: (source: string, importer?: string) => string | null | undefined
  load?: (id: string) => string | null | undefined
}

const PROXY_ID = '\0@lumal/icons/static-local-svg'
const ICONS_ENTRY_ID = '@lumal/icons'

/***********************配置归一化*********************/
function normalizeSource(
  source?: StaticLocalSvgIconsManifestSource | string | false,
): StaticLocalSvgIconsManifestSource | undefined {
  if (!source) {
    return undefined
  }

  return typeof source === 'string' ? { import: source } : source
}

/***********************静态 SVG 注入插件*********************/
export function createStaticLocalSvgIconsPlugin(
  options: CreateStaticLocalSvgIconsPluginOptions = {},
): VitePluginLike {
  const source = normalizeSource(options.localSvg)

  return {
    name: 'lumal:static-local-svg-icons',
    enforce: 'pre',
    resolveId(id, importer) {
      // 代理模块的 re-export 必须交回 Vite 解析真实入口，不能再次解析为自身。
      if (!source || id !== ICONS_ENTRY_ID || importer === PROXY_ID) {
        return null
      }

      return PROXY_ID
    },
    load(id) {
      if (!source || id !== PROXY_ID) {
        return null
      }

      const importPath = JSON.stringify(source.import)
      const importStatement = source.exportName
        ? `import { ${source.exportName} as staticLocalSvgIcons } from ${importPath};`
        : `import staticLocalSvgIcons from ${importPath};`

      return [
        importStatement,
        `export * from ${JSON.stringify(ICONS_ENTRY_ID)};`,
        'import { registerStaticLocalSvgIcons } from "@lumal/icons";',
        'registerStaticLocalSvgIcons(Array.isArray(staticLocalSvgIcons) ? staticLocalSvgIcons : []);',
      ].join('\n')
    },
  }
}
