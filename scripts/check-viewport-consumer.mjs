import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { chromium, expect } from '@playwright/test'
import { createServer } from 'vite'
import { browserZoom, captureNativeScreenshot, resizeNativeWindow } from './browser-zoom.mjs'
import { serveProduction } from './scaffold-verification.mjs'

const root = resolve(import.meta.dirname, '..')
const app = join(root, 'apps/lumal-viewport-lab')
const evidence = join(root, 'output/playwright/viewport')
const reportFile = join(root, 'output/release/viewport-report.json')
const sizes = [[1280, 720], [1366, 768], [1920, 720], [1920, 920], [1920, 1080], [2560, 1440]]
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
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      bodyFontSize: getComputedStyle(document.body).fontSize,
      main: {
        height: document.querySelector('.lab-main').clientHeight,
        scrollHeight: document.querySelector('.lab-main').scrollHeight,
      },
    }
  })
}

async function readMapState(page) {
  return page.getByTestId('map').evaluate(element => ({
    instance: element.dataset.instance,
    center: element.dataset.center,
    zoom: element.dataset.zoom,
  }))
}

async function changeMapView(page) {
  const box = await page.getByTestId('map').boundingBox()
  // 通过地图真实交互改变非默认视图，再证明 resize/KeepAlive 没有重建或重置视图。
  await page.mouse.dblclick(box.x + box.width / 2 + 40, box.y + box.height / 2 - 24)
  await expect(page.getByTestId('map')).toHaveAttribute('data-zoom', '4')
  const state = await readMapState(page)
  expect(state.center).not.toBe('0,0')
  return state
}

async function verifyLayout(page, mapState) {
  expect(await readMapState(page)).toEqual(mapState)
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
  expect(workspace.height).toBeCloseTo(900 * metrics.innerWidth / 1920, 0)
  if (workspace.height > metrics.main.height + 1)
    expect(metrics.main.scrollHeight).toBeGreaterThan(metrics.main.height)
  for (const name of ['tools', 'risk', 'statistics', 'legend', 'trend']) {
    const box = metrics.boxes[name]
    expect(box.x).toBeGreaterThanOrEqual(workspace.x - 1)
    expect(box.y).toBeGreaterThanOrEqual(workspace.y - 1)
    expect(box.right).toBeLessThanOrEqual(workspace.right + 1)
    expect(box.bottom).toBeLessThanOrEqual(workspace.bottom + 1)
    expect(box.height).toBeGreaterThan(20)
    expect(Number.parseFloat(box.fontSize)).toBeCloseTo(14 * metrics.innerWidth / 1920, 1)
  }
  expect(metrics.boxes.risk.bottom).toBeLessThan(metrics.boxes.legend.y)
  expect(metrics.boxes.statistics.bottom).toBeLessThan(metrics.boxes.trend.y)
  const map = page.getByTestId('map')
  const count = Number(await map.getAttribute('data-clicks'))
  // 点击未被浮层覆盖的地图中心，验证真实引擎的坐标反算精度。
  await page.mouse.click(workspace.x + workspace.width / 2, metrics.boxes.tools.bottom + 24)
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
  return readMetrics(page)
}

async function verifyOverlaysAndCache(page, mapState) {
  await page.getByRole('button', { name: '统计详情', exact: true }).hover()
  const tooltip = page.getByRole('tooltip', { name: '统计详情' })
  await expect(tooltip).toBeVisible()
  const tooltipBox = await tooltip.boundingBox()
  await page.getByRole('button', { name: '统计详情', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveCSS('transform', 'none')
  await expect(dialog.getByRole('columnheader', { name: '名称' })).toBeVisible()
  const box = await dialog.locator('.el-dialog').boundingBox()
  const metrics = await readMetrics(page)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(metrics.innerWidth + 1)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.locator('.tools .el-select').click()
  const option = page.getByRole('option', { name: '分组 A' })
  await expect(option).toBeVisible()
  const dropdown = await page.locator('.el-select__popper:visible').boundingBox()
  expectInWindow(dropdown, metrics)
  expectAnchored(dropdown, await page.locator('.tools .el-select').boundingBox())
  await option.click()
  await page.getByRole('link', { name: '系统管理' }).click()
  await expect(page.getByTestId('system')).toBeVisible()
  expect(await page.locator('[data-viewport-mode]').count()).toBe(0)
  expect(Number.parseFloat(await page.getByTestId('system').evaluate(el => getComputedStyle(el).fontSize))).toBeCloseTo(14 * metrics.innerWidth / 1920, 1)
  await page.getByRole('link', { name: '工作台' }).click()
  await expect(page.getByTestId('workspace')).toBeVisible()
  expect(await readMapState(page)).toEqual(mapState)
  await expect(page.locator('.tools .el-select')).toContainText('分组 A')
  return { tooltip: tooltipBox, dialog: box, dropdown, restoredMapState: await readMapState(page) }
}

async function verifyStableResizeCounters(page) {
  // 只记录真实实例和 resize 次数；静止窗口无持续回调不等于业务系统的性能收益。
  await expect.poll(async () => {
    const metrics = await readMetrics(page)
    const [width, height] = metrics.chart.renderedSize.split(',').map(Number)
    return Math.abs(width - metrics.boxes.chart.width) < 2 && Math.abs(height - metrics.boxes.chart.height) < 2
  }).toBe(true)
  const before = await readMetrics(page)
  const observationWindowMs = 400
  await page.waitForTimeout(observationWindowMs)
  const after = await readMetrics(page)
  for (const name of ['map', 'chart']) {
    expect(after[name].instance).toBe(before[name].instance)
    expect(after[name].resizes).toBe(before[name].resizes)
  }
  return {
    observationWindowMs,
    mapInstancesInDocument: await page.getByTestId('map').count(),
    chartInstancesInDocument: await page.getByTestId('chart').count(),
    before: { map: before.map, chart: before.chart },
    after: { map: after.map, chart: after.chart },
  }
}

async function readWidthMetrics(page) {
  return page.evaluate(() => {
    const boxes = Object.fromEntries(['width-page', 'width-probe', 'width-hotspot', 'width-select', 'width-dialog-trigger'].map((name) => {
      const element = document.querySelector(`[data-testid="${name}"]`)
      const box = element.getBoundingClientRect()
      return [name, { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom }]
    }))
    const probe = document.querySelector('[data-testid="width-probe"]')
    const main = document.querySelector('.lab-main')
    return {
      innerWidth,
      innerHeight,
      devicePixelRatio,
      boxes,
      numericWidth: Number(document.querySelector('[data-testid="numeric-width"]').textContent),
      fontSize: Number.parseFloat(getComputedStyle(probe).fontSize),
      lineHeight: Number.parseFloat(getComputedStyle(probe).lineHeight),
      transform: getComputedStyle(document.querySelector('[data-testid="width-page"]')).transform,
      clientHeight: main.clientHeight,
      scrollHeight: main.scrollHeight,
      pageScrollWidth: document.documentElement.scrollWidth,
      pageScrollHeight: document.documentElement.scrollHeight,
      rootTransform: getComputedStyle(document.documentElement).transform,
      bodyTransform: getComputedStyle(document.body).transform,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      bodyFontSize: getComputedStyle(document.body).fontSize,
    }
  })
}

function expectInWindow(box, metrics) {
  expect(box.x).toBeGreaterThanOrEqual(-1)
  expect(box.y).toBeGreaterThanOrEqual(-1)
  expect(box.x + box.width).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(metrics.innerHeight + 1)
}

function expectAnchored(box, trigger) {
  expect(box.x).toBeLessThan(trigger.x + trigger.width)
  expect(box.x + box.width).toBeGreaterThan(trigger.x)
  const verticalGap = Math.min(Math.abs(box.y - trigger.y - trigger.height), Math.abs(box.y + box.height - trigger.y))
  expect(verticalGap).toBeLessThan(20)
}

async function verifyWidthOverlays(page) {
  await expect(page.getByTestId('width-page')).toBeVisible()
  await page.locator('.lab-main').evaluate((element) => {
    element.scrollTop = 0
    element.scrollLeft = 0
  })
  await expect.poll(async () => {
    const current = await readWidthMetrics(page)
    return Math.abs(current.boxes['width-probe'].width - current.numericWidth) < 0.1
  }).toBe(true)
  const metrics = await readWidthMetrics(page)
  const ratio = metrics.innerWidth / 1920
  expect(metrics.rootTransform).toBe('none')
  expect(metrics.bodyTransform).toBe('none')
  expect(metrics.pageScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(metrics.pageScrollHeight).toBeLessThanOrEqual(metrics.innerHeight + 1)
  expect(metrics.transform).toBe('none')
  expect(metrics.boxes['width-page'].width).toBeCloseTo(1280 * ratio, 0)
  expect(metrics.boxes['width-page'].height).toBeCloseTo(900 * ratio, 0)
  expect(metrics.boxes['width-probe'].width).toBeCloseTo(192 * ratio, 1)
  expect(metrics.boxes['width-probe'].height).toBeCloseTo(96 * ratio, 1)
  expect(metrics.fontSize).toBeCloseTo(14 * ratio, 1)
  expect(metrics.lineHeight).toBeCloseTo(20 * ratio, 1)
  if (metrics.boxes['width-page'].height > metrics.clientHeight + 1)
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)
  const hotspot = page.getByTestId('width-hotspot')
  const before = Number((await hotspot.textContent()).replace(/\D/g, ''))
  await hotspot.click()
  await expect(hotspot).toHaveText(`计数 ${before + 1}`)
  await page.getByTestId('width-select').click()
  const option = page.getByRole('option', { name: '画布分组 A' })
  await expect(option).toBeVisible()
  const dropdown = await page.locator('.el-select__popper:visible').boundingBox()
  expectInWindow(dropdown, metrics)
  expectAnchored(dropdown, await page.getByTestId('width-select').boundingBox())
  await option.click()
  await expect(page.getByTestId('width-selection')).toHaveText('a')
  const trigger = page.getByTestId('width-dialog-trigger')
  await trigger.hover()
  const tooltip = page.getByRole('tooltip', { name: '业务面板详情' })
  await expect(tooltip).toBeVisible()
  const tooltipBox = await tooltip.boundingBox()
  expectInWindow(tooltipBox, metrics)
  expectAnchored(tooltipBox, await trigger.boundingBox())
  await trigger.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveCSS('transform', 'none')
  const dialogPanel = dialog.locator('.el-dialog')
  await expect(dialogPanel).toBeVisible()
  const dialogBox = await dialogPanel.boundingBox()
  expectInWindow(dialogBox, metrics)
  expect(dialogBox.width).toBeCloseTo(520 * ratio, 0)
  expect(Number.parseFloat(await page.getByTestId('width-dialog-action').evaluate(el => getComputedStyle(el).fontSize))).toBeCloseTo(14 * ratio, 1)
  await page.getByTestId('width-dialog-action').click()
  await expect(hotspot).toHaveText(`计数 ${before + 2}`)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  return { ...metrics, overlays: { dropdown, tooltip: tooltipBox, dialog: dialogBox }, hotspotClicks: before + 2, status: 'passed' }
}

async function main() {
  const profile = await mkdtemp(join(tmpdir(), 'lumal-viewport-browser-'))
  const extension = join(root, 'scripts/fixtures/zoom-extension')
  const report = {
    environment: { node: process.version, platform: process.platform },
    scope: '脱敏隔离夹具，不是业务系统在线运行结果',
    sizes,
    zooms,
    results: [],
    widthResults: [],
    scrollbarResults: [],
    lifecycleResults: [],
    runtimeErrors: [],
    pageErrors: [],
    consoleErrors: [],
  }
  let context
  let page
  let preview
  let dev
  let cdp
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
    await context.addInitScript(({ observerDiagnostics }) => {
      globalThis.__lumalRuntimeErrors = []
      const recentObservers = []
      if (observerDiagnostics) {
        const NativeResizeObserver = globalThis.ResizeObserver
        globalThis.ResizeObserver = class extends NativeResizeObserver {
          constructor(callback) {
            const created = new Error('ResizeObserver created').stack
            super((entries, observer) => {
              recentObservers.push({ time: performance.now(), created, targets: entries.map(entry => entry.target.getAttribute('data-testid') ?? entry.target.className) })
              if (recentObservers.length > 12)
                recentObservers.shift()
              callback(entries, observer)
            })
          }
        }
      }
      window.addEventListener('error', (event) => {
        globalThis.__lumalRuntimeErrors.push({ message: event.message, filename: event.filename, line: event.lineno, stack: event.error?.stack, route: location.hash, observerDiagnostics: observerDiagnostics ? [...recentObservers] : undefined })
      })
    }, { observerDiagnostics: process.argv.includes('--observer-diagnostics') })
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker', { timeout: 15000 })
    page = await context.newPage()
    page.on('pageerror', error => report.pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error')
        report.consoleErrors.push({ message: message.text(), location: message.location() })
    })
    preview = await serveProduction(app)
    dev = await createServer({ root: app, server: { port: 0, host: '127.0.0.1' } })
    await dev.listen()
    const devUrl = dev.resolvedUrls.local[0].replace(/\/$/, '')
    cdp = await context.newCDPSession(page)
    const { windowId } = await cdp.send('Browser.getWindowForTarget')
    for (const [environment, url] of [['production', preview.url], ['development', devUrl]]) {
      report.currentCheck = { environment, kind: 'initial-map-interaction' }
      await page.goto(url)
      await browserZoom(worker, url, 1)
      await resizeNativeWindow(page, cdp, windowId, 1280, 720)
      // OpenLayers 的初始分辨率约束受容器大小影响，两轮从相同窗口重新创建夹具。
      await page.reload()
      await expect(page.getByTestId('workspace')).toBeVisible()
      const mapState = await changeMapView(page)
      for (const [width, height] of sizes) {
        await browserZoom(worker, url, 1)
        // 调整原生浏览器窗口，不使用 Playwright viewport/deviceScaleFactor 模拟缩放。
        await resizeNativeWindow(page, cdp, windowId, width, height)
        const baseline = await page.evaluate(() => ({ innerWidth, innerHeight, devicePixelRatio }))
        for (const zoom of zooms) {
          const actualZoom = await browserZoom(worker, url, zoom)
          await expect.poll(() => page.evaluate(() => devicePixelRatio)).toBeCloseTo(baseline.devicePixelRatio * zoom, 2)
          report.currentCheck = { environment, kind: 'workspace', width, height, zoom }
          const metrics = await verifyLayout(page, mapState)
          expect(Math.abs(metrics.innerWidth - baseline.innerWidth / zoom)).toBeLessThanOrEqual(2)
          const result = { environment, requestedWindowContent: { width, height }, requestedZoom: zoom, actualZoom, ...metrics, status: 'passed' }
          if (environment === 'production')
            result.screenshotSize = await captureNativeScreenshot(cdp, join(evidence, `${width}x${height}-${zoom}.png`))
          report.results.push(result)
        }
      }
      const overlaysAndCache = await verifyOverlaysAndCache(page, mapState)
      report.lifecycleResults.push({ environment, mapState, overlaysAndCache, ...await verifyStableResizeCounters(page), status: 'passed' })
      await browserZoom(worker, url, 1)
      await resizeNativeWindow(page, cdp, windowId, 1280, 720)
      for (const [width, height] of sizes) {
        await browserZoom(worker, url, 1)
        await resizeNativeWindow(page, cdp, windowId, width, height)
        for (const zoom of [0.8, 1, 1.5]) {
          const actualZoom = await browserZoom(worker, url, zoom)
          await page.getByRole('link', { name: '宽度适配' }).click()
          report.currentCheck = { environment, kind: 'width', width, height, zoom }
          const result = { environment, requestedWindowContent: { width, height }, requestedZoom: zoom, actualZoom, ...await verifyWidthOverlays(page) }
          if (environment === 'production')
            result.screenshotSize = await captureNativeScreenshot(cdp, join(evidence, `width-${width}x${height}-${zoom}.png`))
          report.widthResults.push(result)
        }
      }
      // 强制根滚动条和稳定 gutter，数字基准必须继续等于真正的 CSS vw。
      for (const gutter of ['auto', 'stable']) {
        await page.evaluate((gutter) => {
          document.documentElement.style.overflowY = 'scroll'
          document.documentElement.style.scrollbarGutter = gutter
          window.dispatchEvent(new Event('resize'))
        }, gutter)
        await expect.poll(async () => {
          const current = await readWidthMetrics(page)
          return Math.abs(current.boxes['width-probe'].width - current.numericWidth)
        }).toBeLessThan(0.1)
        report.scrollbarResults.push({ environment, gutter, ...await readWidthMetrics(page), status: 'passed' })
      }
      await page.evaluate(() => {
        document.documentElement.style.overflowY = ''
        document.documentElement.style.scrollbarGutter = ''
        window.dispatchEvent(new Event('resize'))
      })
      await page.getByRole('link', { name: '系统管理' }).click()
      await expect(page.getByTestId('system')).toBeVisible()
      expect(Number.parseFloat(await page.getByTestId('system').evaluate(el => getComputedStyle(el).fontSize))).toBeCloseTo(14 * await page.evaluate(() => innerWidth) / 1920, 1)
      expect(await page.getByTestId('system').evaluate(el => getComputedStyle(el).transform)).toBe('none')
      const runtimeErrors = await page.evaluate(() => globalThis.__lumalRuntimeErrors)
      report.runtimeErrors.push({ environment, errors: runtimeErrors })
      expect(runtimeErrors).toEqual([])
    }
    expect(report.pageErrors).toEqual([])
    expect(report.consoleErrors).toEqual([])
    report.status = 'passed'
    delete report.currentCheck
    await rm(join(evidence, 'failed.png'), { force: true })
    console.log(`视口验收通过：${report.results.length} 组工作区、${report.widthResults.length} 组宽度与浮层、${report.lifecycleResults.length} 组实例与稳定窗口检查。`)
  }
  catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    if (page) {
      report.diagnostics = await readMetrics(page).catch(() => readWidthMetrics(page)).catch(() => null)
      report.runtimeErrorsOnFailure = await page.evaluate(() => globalThis.__lumalRuntimeErrors).catch(() => [])
      await captureNativeScreenshot(cdp, join(evidence, 'failed.png')).catch(() => {})
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
