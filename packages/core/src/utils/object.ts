/***********************对象工具*********************/
/**
 * 过滤对象中值为 undefined 的字段，常用于组装请求参数。
 */
export function omitUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}
