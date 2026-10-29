import { Buffer } from 'node:buffer'
import { writeFile } from 'node:fs/promises'
import { expect } from '@playwright/test'

/** 仅操作隔离 Chromium 标签，使用真实浏览器缩放而非 CSS zoom 或 DPR 模拟。 */
export async function browserZoom(worker, url, factor) {
  return worker.evaluate(async ({ url, factor }) => {
    const tabs = await globalThis.chrome.tabs.query({})
    const tab = tabs.find(tab => tab.url?.startsWith(url))
    if (!tab)
      throw new Error('隔离浏览器中未找到测试标签')
    await globalThis.chrome.tabs.setZoomSettings(tab.id, { mode: 'automatic', scope: 'per-tab' })
    await globalThis.chrome.tabs.setZoom(tab.id, factor)
    return globalThis.chrome.tabs.getZoom(tab.id)
  }, { url, factor })
}

export async function resizeNativeWindow(page, cdp, windowId, width, height) {
  // 原生窗口边框由浏览器环境决定，使用实际 inner/outer 差值校准内容尺寸。
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await page.evaluate(() => ({ innerWidth, innerHeight, outerWidth, outerHeight }))
    await cdp.send('Browser.setWindowBounds', { windowId, bounds: { width: width + current.outerWidth - current.innerWidth, height: height + current.outerHeight - current.innerHeight, windowState: 'normal' } })
    await expect.poll(() => page.evaluate(() => `${innerWidth},${innerHeight}`)).toBe(`${width},${height}`)
  }
}

export async function captureNativeScreenshot(cdp, path) {
  // Playwright 的固定 context DPR 不随 tabs.setZoom 更新，直接捕获浏览器表面避免裁切或补白。
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
  const image = Buffer.from(data, 'base64')
  await writeFile(path, image)
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) }
}
