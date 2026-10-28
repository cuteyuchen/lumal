import type { AnyNode, Declaration } from 'postcss'
import type { ViewportTransformOptions } from './viewport-transform'
import picomatch from 'picomatch'
import valueParser from 'postcss-value-parser'
import { createViewportSelectorFilter } from './viewport-selector'

/** CSS 文件与模板行内样式共用声明策略，不推断任何运行时变量的值。 */
export function createViewportCssTransformer(options: ViewportTransformOptions) {
  const viewportWidth = options.viewportWidth ?? 1920
  const precision = options.precision ?? 6
  const minPixelValue = options.minPixelValue ?? 1
  if (!(viewportWidth > 0) || !Number.isFinite(viewportWidth))
    throw new Error('viewportWidth 必须为正数')
  if (!Number.isInteger(precision) || precision < 0 || precision > 10)
    throw new Error('precision 必须为0到10的整数')
  if (!Number.isFinite(minPixelValue) || minPixelValue < 0)
    throw new Error('minPixelValue 必须为非负有限数')
  if (options.enabled && !options.include?.length)
    throw new Error('视口转换必须显式指定 include 范围')
  const propertyIncluded = picomatch(options.includeProperties ?? ['*'], { nocase: true })
  const propertyExcluded = picomatch(options.excludeProperties ?? [], { nocase: true })
  const excludedSelector = createViewportSelectorFilter(options.excludeSelectors)
  function excludedDeclaration(declaration: Declaration) {
    const previous = declaration.prev()
    const next = declaration.next()
    if ((previous?.type === 'comment' && /^!?\s*lumal-viewport-ignore-next\s*$/.test(previous.text))
      || (next?.type === 'comment' && /^!?\s*lumal-viewport-ignore\s*$/.test(next.text))) {
      return true
    }
    // 分组不拆分，并检查原生嵌套 CSS 的祖先，避免部分匹配对象被缩放。
    for (let parent: AnyNode | undefined = declaration.parent; parent; parent = parent.parent) {
      if (parent.type === 'rule' && excludedSelector(parent.selector))
        return true
    }
    return false
  }
  return (declaration: Declaration) => {
    if (!propertyIncluded(declaration.prop)
      || propertyExcluded(declaration.prop)
      || (!options.customProperties && declaration.prop.startsWith('--'))
      || declaration.prop.startsWith('--lumal-viewport-')
      || (options.fontSize === false && /^(?:font|font-size|line-height)$/i.test(declaration.prop))
      || (options.minSize === false && /^min-(?:width|height|inline-size|block-size)$/i.test(declaration.prop))
      || excludedDeclaration(declaration)) {
      return
    }
    const parsed = valueParser(declaration.value)
    let adapted = false
    // 整条声明先检查适配信号，不能先把 var()/clamp() 旁的 px 局部转换。
    parsed.walk((node) => {
      if (node.type === 'function') {
        const variable = /^var$/i.test(node.value)
        const viewportVariable = variable && node.nodes.some(child => child.type === 'word' && child.value.startsWith('--lumal-viewport-'))
        if (viewportVariable
          || /^(?:env|constant|attr)$/i.test(node.value)
          || (!options.variableFallbacks && /^(?:var|min|max|clamp)$/i.test(node.value))) {
          adapted = true
        }
        if (adapted || /^url$/i.test(node.value))
          return false
      }
      if (node.type === 'word') {
        const dimension = valueParser.unit(node.value)
        if (dimension && /^(?:[sld]?v(?:[whib]|min|max)|cq(?:[whib]|min|max)|r?(?:em|ex|ch|cap|ic|lh))$/i.test(dimension.unit))
          adapted = true
      }
    })
    if (adapted)
      return
    let changed = false
    parsed.walk((node) => {
      if (node.type === 'function' && /^url$/i.test(node.value))
        return false
      if (node.type !== 'word' || !/^-?(?:\d+(?:\.\d*)?|\.\d+)px$/i.test(node.value))
        return
      const pixels = Number.parseFloat(node.value)
      const viewportValue = pixels / viewportWidth * 100
      if (!Number.isFinite(viewportValue) || Math.abs(pixels) <= minPixelValue)
        return
      node.value = `${Number(viewportValue.toFixed(precision))}vw`
      changed = true
    })
    if (changed)
      declaration.value = parsed.toString()
  }
}
