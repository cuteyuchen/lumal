import { describe, expect, it } from 'vitest'
import { computeFullScreenScale } from '../src/composables/useFullScreenScale'

describe('computeFullScreenScale', () => {
  it('按宽高较小比例等比缩放并居中', () => {
    // 容器 1920×540：高度受限，scale = 540/1080 = 0.5
    const result = computeFullScreenScale(1920, 540, 1920, 1080)
    expect(result.scale).toBe(0.5)
    expect(result.scaledWidth).toBe(960)
    expect(result.scaledHeight).toBe(540)
    expect(result.offsetX).toBe((1920 - 960) / 2)
    expect(result.offsetY).toBe(0)
    expect(result.containerWidth).toBe(1920)
    expect(result.containerHeight).toBe(540)
  })

  it('容器等于设计稿时 scale 为 1 且无偏移', () => {
    const result = computeFullScreenScale(1920, 1080, 1920, 1080)
    expect(result.scale).toBe(1)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBe(0)
  })

  it('宽度受限时按宽度缩放并垂直居中', () => {
    // 容器 960×1080：宽度受限，scale = 960/1920 = 0.5
    const result = computeFullScreenScale(960, 1080, 1920, 1080)
    expect(result.scale).toBe(0.5)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBe((1080 - 540) / 2)
  })

  it('非法尺寸回退到 scale 1', () => {
    expect(computeFullScreenScale(0, 0, 1920, 1080).scale).toBe(1)
    expect(computeFullScreenScale(1920, 1080, 0, 0).scale).toBe(1)
  })
})
