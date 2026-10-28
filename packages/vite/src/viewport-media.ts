import type { AtRule, Rule } from 'postcss'
import type { ViewportTransformOptions } from './viewport-transform'
import selectorParser from 'postcss-selector-parser'
import valueParser from 'postcss-value-parser'
import { createViewportSelectorFilter } from './viewport-selector'

/** 只有显式的根元素模式才能固定设计稿断点，不改变普通响应式和无障碍媒体条件。 */
export function createViewportMediaTransformer(options: ViewportTransformOptions) {
  if (!options.mediaQueries)
    return undefined
  if (options.output !== 'runtime')
    throw new Error('mediaQueries 需要 output: runtime')
  const selector = selectorParser().astSync(options.mediaQueries.runtimeSelector)
  const root = selector.first
  if (selector.nodes.length !== 1 || !root
    || !root.nodes.some(node => node.type === 'tag' && node.value === 'html')
    || root.nodes.some(node => node.type === 'combinator' || node.type === 'pseudo')) {
    throw new Error('mediaQueries.runtimeSelector 必须为单个 html 根元素复合选择器')
  }
  const active = `:where(${root.toString()})`
  const inactive = `:where(html:not(${root.toString()}))`
  const width = options.viewportWidth ?? 1920
  const precision = options.precision ?? 6
  const excludedSelector = createViewportSelectorFilter(options.excludeSelectors)
  const pixels = String.raw`(?:\d+(?:\.\d*)?|\.\d+)px`
  const feature = '(?:width|height)'
  const operator = '(?:[<>]=?|=)'
  // 包产物通常已将 max-width:768px 压缩成 width<=768px，二者必须采用相同策略。
  const sizeQuery = new RegExp(`^(?:(?:min-|max-)?${feature}\\s*:\\s*${pixels}|${feature}\\s*${operator}\\s*${pixels}|${pixels}\\s*${operator}\\s*${feature}(?:\\s*${operator}\\s*${pixels})?)$`, 'i')

  function scope(rule: Rule, condition: string) {
    rule.selector = selectorParser((selectors) => {
      selectors.each((entry) => {
        // html/:root 选择器不能再放到另一个 html 的后代中。
        const first = entry.first
        if (first?.type === 'tag' && first.value === 'html') {
          first.replaceWith(selectorParser().astSync(condition).first!.first!.clone())
        }
        else if (first?.type === 'pseudo' && first.value === ':root') {
          first.replaceWith(selectorParser().astSync(condition).first!.first!.clone())
        }
        else {
          entry.prepend(selectorParser.combinator({ value: ' ' }))
          entry.prepend(selectorParser().astSync(condition).first!.first!.clone())
        }
      })
    }).processSync(rule.selector)
  }

  return (rule: AtRule) => {
    if (!/^(?:media|container)$/i.test(rule.name))
      return
    let scoped = false
    let nested = false
    rule.walkRules((child) => {
      scoped ||= child.selector.includes(active) || child.selector.includes(inactive)
      // 混合规则整体保留，不能改变原子化方案或显式排除组件的断点。
      scoped ||= excludedSelector(child.selector)
      nested ||= child.parent?.type === 'rule'
    })
    rule.walkAtRules(() => {
      nested = true
    })
    // 不猜测嵌套媒体/选择器语义；重复 PostCSS 执行也不能再次包裹选择器。
    if (scoped || nested || rule.parent?.type !== 'root')
      return
    const params = valueParser(rule.params)
    let changed = false
    params.walk((node) => {
      if (node.type !== 'function')
        return
      const expression = valueParser.stringify(node.nodes).trim()
      if (!sizeQuery.test(expression))
        return false
      node.nodes = valueParser(expression.replace(/(?:\d+(?:\.\d*)?|\.\d+)px\b/gi, value =>
        `${Number((Number.parseFloat(value) / width * 100).toFixed(precision))}vw`)).nodes
      changed = true
      return false
    })
    if (!changed)
      return
    const viewport = rule.clone({ params: params.toString() })
    viewport.walkRules(child => scope(child, active))
    rule.walkRules(child => scope(child, inactive))
    rule.after(viewport)
  }
}
