import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { chromium, expect } from '@playwright/test'
import { createServer } from 'vite'
import { serveProduction } from './scaffold-verification.mjs'

const root = resolve(import.meta.dirname, '..')
const app = join(root, 'apps/lumal-viewport-lab')
const evidence = join(root, 'output/playwright/viewport')
const reportFile = join(root, 'output/release/viewport-report.json')
const sizes = [[1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440]]
const zooms = [0.8, 1, 1.25, 1.5]

async function readMetrics(page) {
  return page.evaluate(() => {
    const names = ['workspace', 'map', 'tools', 'risk', 'statistics', 'legend', 'trend', 'chart']
    const boxes = Object.fromEntries(names.map((name) => {
      const element = document.querySelector(`[data-testid="${name}"]`)
      const box = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return [name, { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom, fontSize: style.fontSize }]
    }))
    return {
      innerWidth,
      innerHeight,
      outerWidth,
      outerHeight,
      devicePixelRatio,
      boxes,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      map: { ...document.querySelector('[data-testid="map"]').dataset },
      chart: { ...document.querySelector('[data-testid="chart"]').dataset },
      rootTransform: getComputedStyle(document.documentElement).transform,
      bodyTransform: getComputedStyle(document.body).transform,
    }
  })
}

async function verifyLayout(page) {
  await expect(page.getByTestId('map')).toHaveAttribute('data-instance', '1')
  await expect.poll(async () => {
    const metrics = await readMetrics(page)
    const [width, height] = metrics.chart.renderedSize.split(',').map(Number)
    return Math.abs(width - metrics.boxes.chart.width) < 2 && Math.abs(height - metrics.boxes.chart.height) < 2
  }).toBe(true)
  const metrics = await readMetrics(page)
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight + 1)
  expect(metrics.rootTransform).toBe('none')
  expect(metrics.bodyTransform).toBe('none')
  const workspace = metrics.boxes.workspace
  for (const name of ['tools', 'risk', 'statistics', 'legend', 'trend']) {
    const box = metrics.boxes[name]
    expect(box.x).toBeGreaterThanOrEqual(workspace.x - 1)
    expect(box.y).toBeGreaterThanOrEqual(workspace.y - 1)
    expect(box.right).toBeLessThanOrEqual(workspace.right + 1)
    expect(box.bottom).toBeLessThanOrEqual(workspace.bottom + 1)
    expect(box.height).toBeGreaterThan(20)
    expect(Number.parseFloat(box.fontSize)).toBeGreaterThanOrEqual(12)
  }
  expect(metrics.boxes.risk.bottom).toBeLessThan(metrics.boxes.legend.y)
  expect(metrics.boxes.statistics.bottom).toBeLessThan(metrics.boxes.trend.y)
  const map = page.getByTestId('map')
  const count = Number(await map.getAttribute('data-clicks'))
  // 点击未被浮层覆盖的地图中心，验证真实引擎的坐标反算精度。
  await page.mouse.click(workspace.x + workspace.width / 2, workspace.y + workspace.height / 2)
  await expect(map).toHaveAttribute('data-clicks', String(count + 1))
  expect(Number(await map.getAttribute('data-click-error'))).toBeLessThan(0.1)
  expect(await page.getByTestId('chart').locator('canvas').count()).toBeGreaterThan(0)
  for (const name of ['map', 'chart']) {
    const nonblank = await page.getByTestId(name).locator('canvas').first().evaluate((canvas) => {
      const context = canvas.getContext('2d')
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      return pixels.some((value, index) => index % 4 === 3 && value > 0)
    })
    expect(nonblank, `${name} Canvas 不得空白`).toBe(true)
  }
  return metrics
}

async function verifyOverlaysAndCache(page) {
  await page.getByRole('button', { name: '统计详情', exact: true }).hover()
  await expect(page.getByRole('tooltip', { name: '统计详情' })).toBeVisible()
  await page.getByRole('button', { name: '统计详情', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('columnheader', { name: '名称' })).toBeVisible()
  const box = await dialog.boundingBox()
  const metrics = await readMetrics(page)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(metrics.innerWidth + 1)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.locator('.tools .el-select').click()
  const option = page.getByRole('option', { name: '分组 A' })
  await expect(option).toBeVisible()
  await option.click()
  await page.getByRole('link', { name: '系统管理' }).click()
  await expect(page.getByTestId('system')).toBeVisible()
  expect(await page.locator('[data-viewport-mode]').getAttribute('data-viewport-mode')).toBe('disabled')
  expect(await page.getByTestId('system').evaluate(el => getComputedStyle(el).fontSize)).toBe('14px')
  await page.getByRole('link', { name: '工作台' }).click()
  await expect(page.getByTestId('workspace')).toBeVisible()
  await expect(page.getByTestId('map')).toHaveAttribute('data-instance', '1')
  await expect(page.locator('.tools .el-select')).toContainText('分组 A')
}

async function browserZoom(worker, url, factor) {
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

async function main() {
  const profile = await mkdtemp(join(tmpdir(), 'lumal-viewport-browser-'))
  const extension = join(root, 'scripts/fixtures/zoom-extension')
  const report = { environment: { node: process.version, platform: process.platform }, sizes, zooms, results: [] }
  let context
  let page
  let preview
  let dev
  try {
    await mkdir(evidence, { recursive: true })
    await mkdir(join(root, 'output/release'), { recursive: true })
    context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      viewport: null,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, '--window-size=1280,720'],
    })
    report.chromium = context.browser()?.version()
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker', { timeout: 15000 })
    page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    preview = await serveProduction(app)
    dev = await createServer({ root: app, server: { port: 0, host: '127.0.0.1' } })
    await dev.listen()
    const devUrl = dev.resolvedUrls.local[0].replace(/\/$/, '')
    const cdp = await context.newCDPSession(page)
    const { windowId } = await cdp.send('Browser.getWindowForTarget')
    for (const [environment, url] of [['production', preview.url], ['development', devUrl]]) {
      await page.goto(url)
      await expect(page.getByTestId('workspace')).toBeVisible()
      for (const [width, height] of sizes) {
        await browserZoom(worker, url, 1)
        // 调整原生浏览器窗口，不使用 Playwright viewport/deviceScaleFactor 模拟缩放。
        for (let attempt = 0; attempt < 3; attempt++) {
          const current = await page.evaluate(() => ({ innerWidth, innerHeight, outerWidth, outerHeight }))
          await cdp.send('Browser.setWindowBounds', { windowId, bounds: { width: width + current.outerWidth - current.innerWidth, height: height + current.outerHeight - current.innerHeight, windowState: 'normal' } })
          await expect.poll(() => page.evaluate(() => `${innerWidth},${innerHeight}`)).toBe(`${width},${height}`)
        }
        const baseline = await page.evaluate(() => ({ innerWidth, innerHeight, devicePixelRatio }))
        for (const zoom of zooms) {
          const actualZoom = await browserZoom(worker, url, zoom)
          await expect.poll(() => page.evaluate(() => devicePixelRatio)).toBeCloseTo(baseline.devicePixelRatio * zoom, 2)
          const metrics = await verifyLayout(page)
          expect(Math.abs(metrics.innerWidth - baseline.innerWidth / zoom)).toBeLessThanOrEqual(2)
          report.results.push({ environment, requestedWindowContent: { width, height }, requestedZoom: zoom, actualZoom, ...metrics, status: 'passed' })
          if (environment === 'production')
            await page.screenshot({ path: join(evidence, `${width}x${height}-${zoom}.png`) })
        }
      }
      await verifyOverlaysAndCache(page)
    }
    expect(errors).toEqual([])
    report.pageErrors = errors
    report.status = 'passed'
  }
  catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    if (page) {
      report.diagnostics = await readMetrics(page).catch(() => null)
      await page.screenshot({ path: join(evidence, 'failed.png') }).catch(() => {})
    }
    throw error
  }
  finally {
    await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`)
    await context?.close()
    await dev?.close()
    await preview?.close()
    // 此目录由 mkdtemp 在系统临时目录生成，仅清理当前隔离 profile。
    if (profile.startsWith(join(tmpdir(), 'lumal-viewport-browser-')))
      await rm(profile, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
