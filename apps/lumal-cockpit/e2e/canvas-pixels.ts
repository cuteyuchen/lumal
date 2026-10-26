import type { Buffer } from 'node:buffer'
import { PNG } from 'pngjs'

interface CanvasBounds {
  x: number
  y: number
  width: number
  height: number
}

// 恢复采样只截中央地图，既排除两侧 Widget，也避免重复解码整幅软件 GPU 截图。
export function canvasSampleClip(bounds: CanvasBounds): CanvasBounds {
  const width = Math.min(768, bounds.width)
  const height = Math.min(512, bounds.height)
  return {
    x: bounds.x + (bounds.width - width) / 2,
    y: bounds.y + (bounds.height - height) / 2,
    width,
    height,
  }
}

// 在测试进程读取真实截图，避免与软件 GPU 共用浏览器主线程解码。
export function countCanvasColors(image: Buffer): number {
  const { width, height, data } = PNG.sync.read(image)
  const columns = Math.min(32, width)
  const rows = Math.min(32, height)
  const colors = new Set<string>()
  for (let row = 0; row < rows; row++) {
    const y = Math.floor((row + 0.5) * height / rows)
    for (let column = 0; column < columns; column++) {
      const x = Math.floor((column + 0.5) * width / columns)
      const index = (y * width + x) * 4
      colors.add(`${data[index]},${data[index + 1]},${data[index + 2]}`)
    }
  }
  return colors.size
}
