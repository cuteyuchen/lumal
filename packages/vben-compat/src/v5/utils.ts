export function assertSupported(value: object, keys: readonly string[], label: string): void {
  const unsupported = Object.keys(value).filter(key => !keys.includes(key))
  if (unsupported.length)
    throw new Error(`[lumal/v5] ${label} 暂不支持：${unsupported.join(', ')}`)
}

/** 配置统一经过 hook / setState 校验，组件仅透传展示和 DOM 事件属性。 */
export function assertComponentAttrs(attrs: Record<string, unknown>, additional: string[] = []): void {
  const invalid = Object.keys(attrs).filter(key => !['class', 'style', 'id', 'title', 'role', 'tabindex', ...additional].includes(key)
    && !/^(?:data-|aria-|on[A-Z])/.test(key))
  if (invalid.length)
    throw new Error(`[lumal/v5] 组件配置请通过 hook 或 api.setState 更新：${invalid.join(', ')}`)
}

export function cloneValues<T>(value: T): T {
  if (value instanceof Date)
    return new Date(value.getTime()) as T
  if (Array.isArray(value))
    return value.map(item => cloneValues(item)) as T
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValues(item)])) as T
  return value
}
