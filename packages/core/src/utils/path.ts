/***********************路径工具*********************/
/**
 * 拼接路径片段，去除各段首尾多余斜杠，结果以单个前导斜杠开头。
 */
export function joinPath(...parts: Array<string | undefined>): string {
  const joined = parts
    .filter(Boolean)
    .map(part => String(part).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')

  return `/${joined}`
}
