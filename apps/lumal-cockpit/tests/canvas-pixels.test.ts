// @vitest-environment node
import { Buffer } from 'node:buffer'
import { PNG } from 'pngjs'
import { describe, expect, it } from 'vitest'
import { canvasFullClip, canvasSampleClip, countCanvasColors } from '../e2e/canvas-pixels'

describe('生产 Canvas 截图取样', () => {
  it('全幅保留原有整数画幅，忽略计算误差', () => {
    expect(canvasFullClip({ x: 17, y: 80, width: 1886, height: 962 })).toEqual({
      x: 17,
      y: 80,
      width: 1886,
      height: 962,
    })
    expect(canvasFullClip({ x: 17.0000001, y: 80.0000001, width: 1885.9999999, height: 961.9999999 })).toEqual({
      x: 17,
      y: 80,
      width: 1886,
      height: 962,
    })
  })

  it('全幅对小数边界向外取整，不丢弃最外缘像素', () => {
    expect(canvasFullClip({ x: 4.25, y: 8.75, width: 320.5, height: 180.1 })).toEqual({
      x: 4,
      y: 8,
      width: 321,
      height: 181,
    })
  })

  it('全幅画布只采样中央地图，保留实际页面偏移', () => {
    expect(canvasSampleClip({ x: 17, y: 80, width: 1886, height: 962 })).toEqual({
      x: 576,
      y: 305,
      width: 768,
      height: 512,
    })
  })

  it('小画布不会采样到边界之外', () => {
    expect(canvasSampleClip({ x: 4, y: 8, width: 320, height: 180 })).toEqual({
      x: 4,
      y: 8,
      width: 320,
      height: 180,
    })
  })

  it('空白或单色截图不能达到颜色门槛', () => {
    const image = new PNG({ width: 128, height: 64 })
    image.data.fill(255)
    expect(countCanvasColors(PNG.sync.write(image))).toBe(1)
  })

  it('小于取样网格的真实 PNG 仍可识别多色，且不会越界', () => {
    const image = new PNG({ width: 8, height: 8 })
    for (let index = 0; index < 64; index++) {
      image.data[index * 4] = index * 4
      image.data[index * 4 + 3] = 255
    }
    expect(countCanvasColors(PNG.sync.write(image))).toBe(64)
  })

  it('大图只做固定网格取样，保留真实颜色差异', () => {
    const image = new PNG({ width: 320, height: 180 })
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const index = (y * image.width + x) * 4
        image.data[index] = x % 256
        image.data[index + 1] = y
        image.data[index + 3] = 255
      }
    }
    expect(countCanvasColors(PNG.sync.write(image))).toBe(1024)
  })

  it('无效 PNG 必须报错，不能伪装成已绘制成功', () => {
    expect(() => countCanvasColors(Buffer.from('not a png'))).toThrow()
  })
})
