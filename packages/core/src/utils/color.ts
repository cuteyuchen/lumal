/**
 * 为六位十六进制颜色附加透明度。
 * 非标准颜色输入保持原值，避免工具函数擅自改变 CSS 语义。
 */
export function withAlpha(hexColor: string, alpha: number): string {
  const normalized = hexColor.trim().replace(/^#/, '')

  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return hexColor
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  const resolvedAlpha = Math.min(1, Math.max(0, alpha))

  return `rgba(${red}, ${green}, ${blue}, ${resolvedAlpha})`
}
