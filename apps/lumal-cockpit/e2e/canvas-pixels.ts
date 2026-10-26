import type { Buffer } from 'node:buffer'
import { PNG } from 'pngjs'

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
