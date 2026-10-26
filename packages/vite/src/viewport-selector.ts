import selectorParser from 'postcss-selector-parser'

/** 只识别类名中的任意值语法，不把普通 CSS 属性选择器当成原子化工具输出。 */
export function createViewportSelectorFilter(excludeSelectors: (string | RegExp)[] = [], protectArbitraryClasses = true) {
  const matchers = excludeSelectors.map((selector) => {
    if (typeof selector === 'string')
      return (value: string) => value.includes(selector)
    const pattern = new RegExp(selector.source, selector.flags.replace(/[gy]/g, ''))
    return (value: string) => pattern.test(value)
  })
  const cache = new Map<string, boolean>()

  return (selector: string): boolean => {
    const cached = cache.get(selector)
    if (cached !== undefined)
      return cached

    let excluded = matchers.some(matches => matches(selector))
    if (!excluded && protectArbitraryClasses) {
      try {
        selectorParser().astSync(selector).walkClasses((node) => {
          const opening = node.value.indexOf('[')
          if (opening !== -1 && node.value.includes(']', opening + 1))
            excluded = true
        })
      }
      catch {
        // 无法可靠识别的选择器保守跳过，不能冒险缩放工具生成的规则。
        excluded = true
      }
    }
    cache.set(selector, excluded)
    return excluded
  }
}
