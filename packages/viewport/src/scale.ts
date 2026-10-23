export type ViewportScaleMode = 'contain' | 'width'

export interface ViewportScaleLimits {
  /** 下限可能使 contain 溢出；调用方应保留滚动或切换紧凑布局。 */
  minScale?: number
  maxScale?: number
}

export interface ViewportScaleResult {
  containerWidth: number
  containerHeight: number
  scale: number
  scaledWidth: number
  scaledHeight: number
  offsetX: number
  offsetY: number
}

/** contain 保持比例并留白居中；width 保持比例但可能超过容器高度。 */
export function computeViewportScale(
  containerWidth: number,
  containerHeight: number,
  designWidth: number,
  designHeight: number,
  mode: ViewportScaleMode = 'contain',
  limits: ViewportScaleLimits = {},
): ViewportScaleResult {
  if (![containerWidth, containerHeight, designWidth, designHeight].every(value => Number.isFinite(value) && value > 0)) {
    return {
      containerWidth: Math.max(0, containerWidth) || 0,
      containerHeight: Math.max(0, containerHeight) || 0,
      scale: 1,
      scaledWidth: designWidth,
      scaledHeight: designHeight,
      offsetX: 0,
      offsetY: 0,
    }
  }
  const natural = mode === 'width' ? containerWidth / designWidth : Math.min(containerWidth / designWidth, containerHeight / designHeight)
  const minimum = Number.isFinite(limits.minScale) ? Math.max(0, limits.minScale!) : 0
  const maximum = Number.isFinite(limits.maxScale) && limits.maxScale! > 0 ? Math.max(minimum, limits.maxScale!) : Number.POSITIVE_INFINITY
  const scale = Math.min(maximum, Math.max(minimum, natural))
  const scaledWidth = designWidth * scale
  const scaledHeight = designHeight * scale
  return {
    containerWidth,
    containerHeight,
    scale,
    scaledWidth,
    scaledHeight,
    offsetX: mode === 'width' ? 0 : Math.max(0, (containerWidth - scaledWidth) / 2),
    offsetY: mode === 'width' ? 0 : Math.max(0, (containerHeight - scaledHeight) / 2),
  }
}
