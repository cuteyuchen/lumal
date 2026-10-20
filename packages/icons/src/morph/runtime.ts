import type { IconMorphSource, PreparedIconMorph } from './types'
import { resolveAnyIconDefinition } from '../index'
import { readMorphSvg } from './svg'

interface IconMorphRuntime {
  adapter: typeof import('morphicons/adapters')
  dom: typeof import('morphicons/dom')
  region: typeof import('morphicons/region')
}

let runtimePromise: Promise<IconMorphRuntime> | undefined

export function loadIconMorphRuntime(): Promise<IconMorphRuntime> {
  runtimePromise ??= Promise.all([
    import('morphicons/adapters'),
    import('morphicons/dom'),
  ]).then(async ([adapter, dom]) => ({
    adapter,
    dom,
    // 首次显示前完成填充归一化，避免混合图形短暂退化为描边。
    region: await dom.preloadRegion(),
  })).catch((error: unknown) => {
    runtimePromise = undefined
    throw error
  })
  return runtimePromise
}

export function resolveMorphSvgText(source: IconMorphSource): string {
  if (typeof source === 'string' && source.trim().startsWith('<svg'))
    return source
  const definition = typeof source === 'string' ? resolveAnyIconDefinition(source) : source
  return definition?.source === 'local-svg' ? definition.svgText ?? '' : ''
}

/** unsupported、SSR 或可选引擎加载失败时返回 undefined，由消费层保留静态资源。 */
export async function prepareIconMorph(source: IconMorphSource): Promise<PreparedIconMorph | undefined> {
  try {
    const svg = readMorphSvg(resolveMorphSvgText(source))
    if (!svg)
      return undefined
    const { adapter, dom, region } = await loadIconMorphRuntime()
    const input = adapter.svgToIcon(svg.svgText)
    const icon = svg.filled ? region.toRegion(input, { strokeWidth: svg.strokeWidth }) : input
    const d = dom.canonicalD(icon)
    if (!d || /NaN|Infinity/.test(d))
      return undefined
    return { ...svg, icon, d, shape: `${svg.filled}:${d}` }
  }
  catch {
    return undefined
  }
}
