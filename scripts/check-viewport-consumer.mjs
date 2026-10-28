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
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      bodyFontSize: getComputedStyle(document.body).fontSize,
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

async function legacyConstraintProbe(page) {
  return page.getByTestId('workspace').evaluate((workspace) => {
    const bounds = workspace.getBoundingClientRect()
    const parent = document.createElement('div')
    const child = document.createElement('div')
    Object.assign(parent.style, { position: 'fixed', left: '-100000px', top: '0', width: `${bounds.width}px`, height: `${bounds.height}px`, overflow: 'auto' })
    Object.assign(child.style, { width: '100%', height: '100%', minWidth: '1280px', minHeight: '660px' })
    parent.append(child)
    document.body.append(parent)
    try {
      return {
        label: '合成旧约束探针，非实际业务系统运行结果',
        availableWidth: bounds.width,
        availableHeight: bounds.height,
        scrollWidth: parent.scrollWidth,
        scrollHeight: parent.scrollHeight,
        horizontalOverflow: parent.scrollWidth > parent.clientWidth + 1,
        verticalOverflow: parent.scrollHeight > parent.clientHeight + 1,
      }
    }
    finally {
      parent.remove()
    }
  })
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
  return { ...await readMetrics(page), legacyConstraintProbe: await legacyConstraintProbe(page) }
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
  expect(await page.locator('[data-viewport-mode]').getAttribute('data-viewport-mode')).toBe('disabled')
  expect(await page.getByTestId('system').evaluate(el => getComputedStyle(el).fontSize)).toBe('14px')
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

async function readScaleMetrics(page) {
  return page.evaluate(() => {
    const boxes = Object.fromEntries(['scale-host', 'scale-canvas', 'scale-hotspot', 'scale-select', 'scale-dialog-trigger'].map((name) => {
      const element = document.querySelector(`[data-testid="${name}"]`)
      const box = element.getBoundingClientRect()
      return [name, { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom }]
    }))
    const host = document.querySelector('[data-testid="scale-host"]')
    return {
      innerWidth,
      innerHeight,
      devicePixelRatio,
      boxes,
      mode: host.dataset.viewportMode,
      clientWidth: host.clientWidth,
      clientHeight: host.clientHeight,
      scrollWidth: host.scrollWidth,
      scrollHeight: host.scrollHeight,
      scrollLeft: host.scrollLeft,
      scrollTop: host.scrollTop,
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

async function verifyScaledOverlays(page, mode) {
  await expect(page.getByTestId('scale-canvas')).toBeVisible()
  await expect(page.getByTestId('scale-host')).toHaveAttribute('data-viewport-mode', mode)
  await page.getByTestId('scale-host').evaluate((element) => {
    element.scrollTop = 0
    element.scrollLeft = 0
  })
  await expect.poll(async () => {
    const current = await readScaleMetrics(page)
    const scale = mode === 'width' ? current.clientWidth / 1280 : Math.min(current.clientWidth / 1280, current.clientHeight / 720)
    return Math.abs(current.boxes['scale-canvas'].width - 1280 * scale) < 1
      && current.boxes['scale-hotspot'].height >= 35
      && current.boxes['scale-select'].height >= 35
  }).toBe(true)
  const metrics = await readScaleMetrics(page)
  expect(metrics.rootTransform).toBe('none')
  expect(metrics.bodyTransform).toBe('none')
  expect(metrics.rootFontSize).toBe('16px')
  expect(metrics.bodyFontSize).toBe('14px')
  expect(metrics.pageScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(metrics.pageScrollHeight).toBeLessThanOrEqual(metrics.innerHeight + 1)
  const host = metrics.boxes['scale-host']
  const canvas = metrics.boxes['scale-canvas']
  if (mode === 'contain') {
    expect(canvas.x).toBeGreaterThanOrEqual(host.x - 1)
    expect(canvas.y).toBeGreaterThanOrEqual(host.y - 1)
    expect(canvas.right).toBeLessThanOrEqual(host.right + 1)
    expect(canvas.bottom).toBeLessThanOrEqual(host.bottom + 1)
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1)
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1)
  }
  else {
    expect(Math.abs(canvas.width - metrics.clientWidth)).toBeLessThanOrEqual(1)
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1)
  }
  expect(canvas.width / canvas.height).toBeCloseTo(1280 / 720, 3)
  expect(metrics.boxes['scale-hotspot'].height).toBeGreaterThanOrEqual(32)
  expect(metrics.boxes['scale-select'].height).toBeGreaterThanOrEqual(32)
  const hotspot = page.getByTestId('scale-hotspot')
  const before = Number((await hotspot.textContent()).replace(/\D/g, ''))
  await hotspot.click()
  await expect(hotspot).toHaveText(`计数 ${before + 1}`)
  await page.getByTestId('scale-select').click()
  const option = page.getByRole('option', { name: '画布分组 A' })
  await expect(option).toBeVisible()
  const dropdown = await page.locator('.el-select__popper:visible').boundingBox()
  expectInWindow(dropdown, metrics)
  expectAnchored(dropdown, await page.getByTestId('scale-select').boundingBox())
  await option.click()
  await expect(page.getByTestId('scale-selection')).toHaveText('a')
  const trigger = page.getByTestId('scale-dialog-trigger')
  await trigger.hover()
  const tooltip = page.getByRole('tooltip', { name: '局部画布详情' })
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
  await expect(page.getByTestId('scale-dialog-action')).toHaveCSS('font-size', '14px')
  await page.getByTestId('scale-dialog-action').click()
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
    scaleResults: [],
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
      await page.goto(url)
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
      for (const mode of ['contain', 'width']) {
        for (const zoom of [0.8, 1.5]) {
          const actualZoom = await browserZoom(worker, url, zoom)
          await page.getByRole('link', { name: mode === 'contain' ? '完整缩放' : '宽度缩放' }).click()
          report.currentCheck = { environment, kind: 'local-scale', mode, zoom }
          const result = { environment, requestedWindowContent: { width: 1280, height: 720 }, requestedZoom: zoom, actualZoom, ...await verifyScaledOverlays(page, mode) }
          if (environment === 'production')
            result.screenshotSize = await captureNativeScreenshot(cdp, join(evidence, `local-${mode}-${zoom}.png`))
          report.scaleResults.push(result)
        }
      }
      await page.getByRole('link', { name: '系统管理' }).click()
      await expect(page.getByTestId('system')).toBeVisible()
      expect(await page.getByTestId('system').evaluate(el => getComputedStyle(el).fontSize)).toBe('14px')
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
    console.log(`视口验收通过：${report.results.length} 组工作区、${report.scaleResults.length} 组局部缩放、${report.lifecycleResults.length} 组实例与稳定窗口检查。`)
  }
  catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    if (page) {
      report.diagnostics = await readMetrics(page).catch(() => readScaleMetrics(page)).catch(() => null)
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
