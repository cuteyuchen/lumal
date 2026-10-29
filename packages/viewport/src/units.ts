export interface ViewportConfig {
  enabled: boolean
  designWidth: number
}

// 由消费项目的 @lumal/vite 注入；公共包构建时保留此引用，不写死设计基准。
declare const __LUMAL_VIEWPORT__: ViewportConfig | undefined

export function getViewportConfig(): Readonly<ViewportConfig> {
  return typeof __LUMAL_VIEWPORT__ === 'undefined'
    ? { enabled: false, designWidth: 1920 }
    : __LUMAL_VIEWPORT__
}

function designWidth(config: ViewportConfig) {
  if (!Number.isFinite(config.designWidth) || config.designWidth <= 0)
    throw new Error('designWidth 必须为正有限数')
  return config.designWidth
}

/** 仅用于设计尺寸。测量结果、指针和 Popper 坐标应直接使用，不调用此函数。 */
export function viewportLength(pixels: number, config = getViewportConfig()): string {
  if (!Number.isFinite(pixels))
    throw new Error('设计尺寸必须为有限数')
  return config.enabled ? `${Number((pixels / designWidth(config) * 100).toFixed(10))}vw` : `${pixels}px`
}

/** CSS 的 100vw 测量：包含滚动条策略造成的基准差异，不使用 screen 或 DPR。 */
export function getViewportWidth(): number {
  if (typeof window === 'undefined')
    return 0
  if (typeof document === 'undefined' || !document.documentElement)
    return window.innerWidth
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;width:100vw;height:0;visibility:hidden;pointer-events:none;contain:strict;'
  document.documentElement.append(probe)
  const width = probe.getBoundingClientRect().width
  probe.remove()
  return width || window.innerWidth
}

/** 为 ECharts 等必须接收数字的设计尺寸提供与 CSS vw 相同的计算。 */
export function viewportPixels(pixels: number, width = getViewportWidth(), config = getViewportConfig()): number {
  if (!Number.isFinite(pixels) || !Number.isFinite(width) || width < 0)
    throw new Error('设计尺寸和视口宽度必须为有限数，宽度不能为负')
  return config.enabled ? pixels * width / designWidth(config) : pixels
}
