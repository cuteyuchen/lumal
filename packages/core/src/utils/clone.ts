import { isProxy, toRaw } from 'vue'

/***********************深拷贝*********************/
function unwrapValue<T>(value: T): T {
  return isProxy(value) ? (toRaw(value) as T) : value
}

function cloneFallback<T>(value: T, seen: WeakMap<object, unknown> = new WeakMap()): T {
  const normalized = unwrapValue(value)

  if (normalized === null || typeof normalized !== 'object') {
    return normalized
  }

  if (normalized instanceof Date) {
    return new Date(normalized.getTime()) as T
  }

  if (normalized instanceof RegExp) {
    return new RegExp(normalized) as T
  }

  if (seen.has(normalized)) {
    return seen.get(normalized) as T
  }

  if (Array.isArray(normalized)) {
    const nextArray: unknown[] = []
    seen.set(normalized, nextArray)
    normalized.forEach((item, index) => {
      nextArray[index] = cloneFallback(item, seen)
    })
    return nextArray as T
  }

  const nextObject: Record<string, unknown> = {}
  seen.set(normalized, nextObject)
  Object.entries(normalized).forEach(([key, currentValue]) => {
    nextObject[key] = cloneFallback(currentValue, seen)
  })

  return nextObject as T
}

/**
 * 深拷贝：优先使用 structuredClone，遇到不可克隆值（如函数、Vue 组件）回退到手写实现。
 * 会先解包 Vue 响应式代理，避免克隆出带响应性的对象。
 */
export function cloneDeep<T>(value: T): T {
  const normalized = unwrapValue(value)

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(normalized)
    }
    catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'DataCloneError') {
        throw error
      }
    }
  }

  return cloneFallback(normalized)
}

/**
 * 深拷贝带 children 的树结构（如菜单树），保持结构不变。
 */
export function cloneTree<T extends { children?: T[] }>(items: T[]): T[] {
  return items.map(item => ({
    ...item,
    children: item.children?.length ? cloneTree(item.children) : undefined,
  }))
}
