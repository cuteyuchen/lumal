import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { chromium, expect } from '@playwright/test'
import { browserZoom, captureNativeScreenshot, resizeNativeWindow } from './browser-zoom.mjs'

const root = resolve(import.meta.dirname, '..')
const evidence = join(root, 'output/playwright/admin-viewport')
const reportFile = join(root, 'output/release/admin-viewport-zoom.json')
// 使用已启动的真实 Admin 与 Mock；此检查不修改应用源码、用户浏览器或持久偏好。
const environments = [
  ['production', process.env.LUMAL_ADMIN_PREVIEW_URL || 'http://127.0.0.1:4177'],
  ['development', process.env.LUMAL_ADMIN_DEV_URL || 'http://127.0.0.1:5170'],
]
const sizes = [[1280, 720], [1920, 1080]]
const zooms = [0.8, 1, 1.25, 1.5, 2]

async function readMetrics(page) {
  return page.evaluate(() => {
    const selectors = {
      header: '.lumal-header',
      trigger: '[data-action="workspace-viewport"]',
      title: '.lumal-page__title',
      metric: '.lumal-admin-workspace__metric',
      number: '.lumal-admin-workspace__metric strong',
      row: '.el-table__body .el-table__row',
      cell: '.el-table__body .cell',
      sidebar: '.lumal-sidebar',
    }
    const boxes = Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
      const element = document.querySelector(selector)
      if (!element)
        return [name, null]
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return [name, { x: rect.x, y: rect.y, width: rect.width, height: rect.height, fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight) || 0 }]
    }))
    return {
      innerWidth,
      innerHeight,
      devicePixelRatio,
      mode: document.documentElement.dataset.adminViewport,
      scrollWidth: document.documentElement.scrollWidth,
      gridColumns: getComputedStyle(document.querySelector('.lumal-admin-workspace__metrics')).gridTemplateColumns.split(' ').length,
      rootTransform: getComputedStyle(document.documentElement).transform,
      bodyTransform: getComputedStyle(document.body).transform,
      stageTransform: getComputedStyle(document.querySelector('.admin-workspace-viewport__stage')).transform,
      boxes,
    }
  })
}

async function setMode(page, label) {
  await page.getByRole('button', { name: '工作区适配', exact: true }).click()
  const menu = page.getByRole('menu', { name: '工作区适配', exact: true })
  await expect(menu).toBeVisible()
  await menu.getByRole('menuitem', { name: label, exact: true }).click()
}

async function verifyControls(page) {
  const trigger = page.getByRole('button', { name: '工作区适配', exact: true })
  await trigger.click()
  const menu = page.getByRole('menu', { name: '工作区适配', exact: true })
  await expect(menu).toBeVisible()
  const anchor = await trigger.boundingBox()
  const box = await menu.boundingBox()
  expect(box.y).toBeGreaterThanOrEqual(anchor.y)
  expect(box.x + box.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth) + 1)
  expect(Math.abs(box.y - anchor.y - anchor.height)).toBeLessThan(24)
  await menu.getByRole('menuitem', { name: 'vw 流式', exact: true }).click()
  await page.getByRole('button', { name: '偏好设置', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: '偏好设置', exact: true })
  await expect(drawer).toBeVisible()
  const drawerBox = await drawer.boundingBox()
  await page.keyboard.press('Escape')
  await expect(drawer).not.toBeVisible()
  return { menu: box, drawer: drawerBox }
}

async function main() {
  const profile = await mkdtemp(join(tmpdir(), 'lumal-admin-zoom-'))
  const extension = join(root, 'scripts/fixtures/zoom-extension')
  const report = { sizes, zooms, baselines: [], results: [], sidebars: [], errors: [], consoleErrors: [] }
  let context
  let page
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
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
    page = await context.newPage()
    page.on('pageerror', error => report.errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error')
        report.consoleErrors.push(message.text())
    })
    cdp = await context.newCDPSession(page)
    const { windowId } = await cdp.send('Browser.getWindowForTarget')
    for (const [environment, url] of environments) {
      await page.goto(`${url}/#/login`)
      await page.getByTestId('login-submit').click()
      await expect(page.getByRole('heading', { name: '欢迎回来，超级管理员' })).toBeVisible()
      await setMode(page, 'vw 流式')
      for (const [width, height] of sizes) {
        await browserZoom(worker, url, 1)
        await resizeNativeWindow(page, cdp, windowId, width, height)
        await page.evaluate(async () => {
          await document.fonts.ready
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        })
        const baseline = await readMetrics(page)
        report.baselines.push({ environment, width, height, ...baseline })
        for (const zoom of zooms) {
          report.currentCheck = { environment, width, height, zoom }
          const actualZoom = await browserZoom(worker, url, zoom)
          await expect.poll(() => page.evaluate(() => devicePixelRatio)).toBeCloseTo(baseline.devicePixelRatio * zoom, 2)
          // 等待响应式 DOM、字体和布局在真正的缩放事件后稳定。
          await expect.poll(async () => (await readMetrics(page)).boxes.header.height * actualZoom).toBeCloseTo(baseline.boxes.header.height, 0)
          const metrics = await readMetrics(page)
          const result = { environment, width, height, zoom: actualZoom, ...metrics }
          report.results.push(result)
          expect(metrics.mode).toBe('vw')
          expect(metrics.gridColumns).toBe(4)
          expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
          for (const transform of [metrics.rootTransform, metrics.bodyTransform, metrics.stageTransform])
            expect(transform).toBe('none')
          for (const [name, original] of Object.entries(baseline.boxes)) {
            if (!original)
              continue
            for (const dimension of ['height', 'fontSize', 'lineHeight']) {
              expect(Math.abs(metrics.boxes[name][dimension] * actualZoom - original[dimension]), `${environment} ${width} ${zoom} ${name}.${dimension}`).toBeLessThan(1.1)
            }
          }
          // 表格引擎的数值列宽必须显式适配，不能只让行高看起来一致。
          await expect.poll(async () => Math.abs((await readMetrics(page)).boxes.row.width * actualZoom - baseline.boxes.row.width)).toBeLessThan(2)
          result.controls = await verifyControls(page)
          expect(Math.abs(result.controls.drawer.width * actualZoom - 384 * width / 1920)).toBeLessThan(1.1)
          if (environment === 'production')
            result.screenshotSize = await captureNativeScreenshot(cdp, join(evidence, `${width}x${height}-${zoom}.png`))
          result.status = 'passed'
        }
      }
      await browserZoom(worker, url, 1)
      await resizeNativeWindow(page, cdp, windowId, 1280, 720)
      await page.goto(`${url}/#/system/user`)
      await expect(page.getByRole('heading', { name: '机构导航', exact: true })).toBeVisible()
      const sidebar = page.locator('.lumal-layout__desktop-sidebar')
      await expect(sidebar).toBeVisible()
      for (const zoom of zooms) {
        const actualZoom = await browserZoom(worker, url, zoom)
        await expect.poll(async () => Math.abs((await sidebar.boundingBox()).width * actualZoom - 280 * 1280 / 1920)).toBeLessThan(1.1)
        report.sidebars.push({ environment, zoom: actualZoom, box: await sidebar.boundingBox(), status: 'passed' })
      }
      // 在同一个放大后的 CSS 视口切回普通响应式，应恢复移动端导航与断点。
      await browserZoom(worker, url, 1)
      await resizeNativeWindow(page, cdp, windowId, 1280, 720)
      await browserZoom(worker, url, 2)
      await setMode(page, '响应式')
      await expect(page.getByRole('button', { name: '账户与更多操作' })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-admin-viewport', 'responsive')
      await browserZoom(worker, url, 1)
      await setMode(page, 'vw 流式')
      await page.goto(`${url}/#/examples/viewport`)
      await expect(page.locator('html')).toHaveAttribute('data-admin-viewport', 'responsive')
    }
    expect(report.errors).toEqual([])
    expect(report.consoleErrors).toEqual([])
    report.status = 'passed'
    delete report.currentCheck
    console.log(`Admin 原生缩放验收通过：${report.results.length} 组 Header/内容/表格/浮层和 ${report.sidebars.length} 组侧栏检查，Dev/Build 均通过。`)
  }
  catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    report.metricsOnFailure = await readMetrics(page).catch(() => null)
    if (cdp)
      await captureNativeScreenshot(cdp, join(evidence, 'failed.png')).catch(() => {})
    throw error
  }
  finally {
    await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`)
    await context?.close()
    // 仅删除由 mkdtemp 创建并核对路径的隔离浏览器 profile。
    if (resolve(profile).startsWith(resolve(tmpdir(), 'lumal-admin-zoom-')))
      await rm(profile, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
