/***********************查询序列化*********************/
/**
 * 把参数对象序列化为查询字符串（不含前导 `?`）。
 * - null / undefined 值跳过；
 * - 数组展开为重复键；
 * - 一层嵌套对象展开为 `key[subKey]` 形式。
 */
export function serializeQuery(params: Record<string, unknown>): string {
  const pairs: string[] = []

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined) {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
        }
      })
      return
    }

    if (typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
        if (subValue !== null && subValue !== undefined) {
          pairs.push(`${encodeURIComponent(`${key}[${subKey}]`)}=${encodeURIComponent(String(subValue))}`)
        }
      })
      return
    }

    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  })

  return pairs.join('&')
}
