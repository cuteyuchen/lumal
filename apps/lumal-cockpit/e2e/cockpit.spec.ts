import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../../lumal-admin/e2e/fixtures'
import { countCanvasColors } from './canvas-pixels'

/***********************生产画布像素、网络和组件生命周期证据*********************/
async function expectFittedStage(page: Page, width: number, height: number): Promise<void> {
  const expectedScale = Math.min(width / 1920, height / 1080)
  await expect(page.locator('.lumal-cockpit-canvas')).toHaveAttribute('data-scale', expectedScale.toFixed(3))
  // ResizeObserver 与 RAF 合并更新完成后再记录截图，不能只断言旧地图仍然连接。
  await expect.poll(async () => {
    const bounds = await page.locator('.lumal-cockpit-canvas__stage').boundingBox()
    return Boolean(bounds && bounds.x >= -1 && bounds.y >= -1
      && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= height + 1)
  }).toBe(true)
}

async function expectPaintedCanvas(canvas: Locator): Promise<void> {
  await expect(canvas).toBeVisible()
  // 软件 GPU 的截图本身可能耗时 20 秒，不应占用轮询断言预算并丢弃已经绘制的结果。
  const image = await canvas.screenshot({ animations: 'disabled' })
  await test.info().attach('canvas-pixel-sample', { body: image, contentType: 'image/png' })
  const analysisStarted = performance.now()
  const colorCount = countCanvasColors(image)
  test.info().annotations.push(
    { type: 'canvas-colors', description: String(colorCount) },
    { type: 'canvas-analysis-ms', description: (performance.now() - analysisStarted).toFixed(1) },
  )
  expect(colorCount, '真实 Canvas 截图不能是空白或单色占位').toBeGreaterThan(10)
}

test('默认动画场景、Widget、Tab 折叠与 OpenLayers resize', async ({ browserDiagnostics, page }) => {
  // OpenLayers 命中检测触发的浏览器性能建议，不是资源或执行错误；不放宽其他警告。
  browserDiagnostics.allowConsoleWarning('Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true. See: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently')
  const failed: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400)
      failed.push(`${response.status()} ${response.url()}`)
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '全国智慧运行态势' })).toBeVisible()
  await expect(page.locator('.metric-summary__grid')).toBeVisible()
  await expectPaintedCanvas(page.locator('.echarts-geo-center canvas').first())
  await page.getByRole('tab', { name: '区域状态分布', exact: false }).click()
  await expect(page.locator('.status-distribution')).toBeVisible()
  await page.locator('[data-action="collapse-left"]').click()
  await expect(page.locator('[data-action="collapse-left"]')).toHaveAttribute('aria-expanded', 'false')
  await page.locator('[data-action="collapse-left"]').click()

  await page.getByRole('tab', { name: 'OpenLayers', exact: true }).click()
  const openlayers = page.locator('.ol-viewport')
  await expect(openlayers).toBeVisible()
  const original = await openlayers.elementHandle()
  await page.setViewportSize({ width: 1366, height: 768 })
  await expectFittedStage(page, 1366, 768)
  await expect.poll(() => original!.evaluate(element => element.isConnected)).toBe(true)
  await expect(openlayers).toBeVisible()
  // 中央内容是全幅底图；点击中部实际空白区域，避开覆盖在两侧的模块。
  const bounds = await openlayers.boundingBox()
  await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
  await page.getByRole('tab', { name: 'ECharts', exact: true }).click()
  await expect(openlayers).toHaveCount(0)
  await expect(page.locator('.echarts-geo-center canvas').first()).toBeVisible()
  expect(failed).toEqual([])
})

test('Cesium 资源、像素与原实例 resize', async ({ page }) => {
  // 使用应用已有的按需绘制策略，避免 CI 软件 GPU 持续重绘挤占输入和截图。
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const failed: string[] = []
  const workers: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400)
      failed.push(`${response.status()} ${response.url()}`)
    if (response.url().includes('/cesiumStatic/Workers/'))
      workers.push(response.url())
  })
  await page.goto('/')
  await page.getByRole('tab', { name: 'Cesium', exact: true }).click()
  await expect(page.locator('.cesium-center')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.cesium-widget canvas')).toBeVisible()
  await expect(page.locator('.cesium-center [role="alert"]')).toHaveCount(0)
  await expectPaintedCanvas(page.locator('.cesium-widget canvas'))
  const cesium = await page.locator('.cesium-widget canvas').elementHandle()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expectFittedStage(page, 1440, 900)
  await expect.poll(() => cesium!.evaluate(element => element.isConnected)).toBe(true)
  await expect.poll(() => workers.length).toBeGreaterThan(0)
  await page.screenshot({ path: 'output/playwright/cockpit-cesium-1440.png', animations: 'disabled' })
  await page.getByRole('tab', { name: 'ECharts', exact: true }).click()
  await expect(page.locator('.cesium-widget')).toHaveCount(0)
  expect(failed).toEqual([])
})

test('Cesium 中断重试后的真实像素与独立场景切换', async ({ page }) => {
  // 恢复契约单独初始化，避免把两次软件 GPU 截图串进同一个测试预算。
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const failed: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400)
      failed.push(`${response.status()} ${response.url()}`)
  })
  await page.goto('/')
  await page.getByRole('tab', { name: 'Cesium', exact: true }).click()
  await expect(page.locator('.cesium-center')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.cesium-widget canvas')).toBeVisible()
  await page.locator('.cesium-widget canvas').dispatchEvent('webglcontextlost')
  await expect(page.locator('.cesium-center [role="alert"]')).toContainText('Cesium 渲染中断')
  await page.getByRole('button', { name: '重新加载', exact: true }).click()
  await expect(page.locator('.cesium-center')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.cesium-widget canvas')).toBeVisible()
  await expect(page.locator('.cesium-center [role="alert"]')).toHaveCount(0)
  await expectPaintedCanvas(page.locator('.cesium-widget canvas'))
  await page.getByRole('tab', { name: '独立场景', exact: true }).click()
  await expect(page.getByRole('img', { name: '中性场景区域预览' })).toBeVisible()
  await page.locator('.standalone-center__point-button').first().click()
  await expect(page.locator('.standalone-center__status strong')).not.toHaveText('未选择')
  await page.getByRole('tab', { name: 'ECharts', exact: true }).click()
  await expect(page.locator('.cesium-widget')).toHaveCount(0)
  expect(failed).toEqual([])
})

test('布局持久化、设计器取消、名称尺寸保存与刷新恢复', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: '运行分析', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: '运行分析', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: '打开配置器', exact: true }).click()
  await page.getByRole('textbox', { name: '当前布局名称' }).fill('未保存草稿')
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page.getByRole('button', { name: '未保存草稿', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '打开配置器', exact: true }).click()
  await page.getByRole('textbox', { name: '当前布局名称' }).fill('已保存布局')
  await page.getByRole('spinbutton', { name: '左侧区域宽度像素', exact: true }).fill('360')
  await page.getByRole('spinbutton', { name: '左侧区域宽度像素', exact: true }).press('Tab')
  await expect(page.getByRole('spinbutton', { name: '左侧区域宽度像素', exact: true })).toHaveValue('360')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '驾驶舱配置' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('button', { name: '已保存布局', exact: true })).toHaveAttribute('aria-current', 'page')
  expect(await page.evaluate(() => {
    const config = JSON.parse(localStorage.getItem('lumal-cockpit:config')!)
    return config.layouts.find((layout: { id: string }) => layout.id === config.activeLayoutId).left.width
  })).toBe(360)
})

test('暂停、恢复定时刷新与立即刷新', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date('2026-10-26T00:00:00Z') })
  await page.goto('/')
  // 刷新验证不依赖地图动画；仍通过真实按钮与 Widget 状态观察公开刷新行为。
  await page.getByRole('tab', { name: '独立场景', exact: true }).click()
  await expect(page.locator('.standalone-center')).toBeVisible()
  // install 仍会随真实时间前进；页面就绪后暂停，避免慢机器错过 280ms 加载态。
  await page.clock.pauseAt(new Date('2026-10-26T01:00:00Z'))
  await page.getByRole('button', { name: '自动刷新开', exact: true }).click()
  await expect(page.getByRole('button', { name: '自动刷新关', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await page.clock.fastForward(60_000)
  await expect(page.locator('.widget-state')).toHaveCount(0)
  await page.getByRole('button', { name: '自动刷新关', exact: true }).click()
  await page.clock.fastForward(60_000)
  await expect(page.locator('.widget-state').first()).toBeVisible()
  await page.clock.fastForward(300)
  await expect(page.locator('.widget-state')).toHaveCount(0)
  await page.getByRole('button', { name: '立即刷新模块', exact: true }).click()
  await expect(page.locator('.widget-state').first()).toBeVisible()
  await page.clock.fastForward(300)
  await expect(page.locator('.widget-state')).toHaveCount(0)
})

test('三种既有视口与全屏退出', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const mode of ['vwvh', 'external', 'scale']) {
    await page.getByRole('button', { name: '切换大屏适配模式' }).click()
    await expect(page.locator('.lumal-cockpit')).toHaveAttribute('data-viewport-mode', mode)
  }
  await page.getByRole('button', { name: '进入全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
  await page.getByRole('button', { name: '退出全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false)
})

test('隔离 Viewport 实验的模式、尺寸、点击热区与窗口 resize', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('tab', { name: '独立场景', exact: true }).click()
  await expect(page.locator('.standalone-center')).toBeVisible()
  await page.getByRole('button', { name: '打开视口实验' }).click()
  await expect(page.getByTestId('viewport-lab-metrics')).toContainText('比例 1.000')
  await page.getByLabel('模拟容器', { exact: true }).selectOption('portrait')
  await expect(page.getByTestId('viewport-lab-metrics')).toContainText('比例 0.500')
  await page.getByRole('button', { name: '确认节点 · 0' }).click()
  await expect(page.getByRole('button', { name: '确认节点 · 1' })).toBeVisible()
  for (const mode of ['width', 'responsive', 'contain']) {
    await page.getByLabel('实验适配策略', { exact: true }).selectOption(mode)
    await expect(page.locator('.viewport-lab [data-viewport-mode]')).toHaveAttribute('data-viewport-mode', mode)
  }
  for (const [width, height] of [[1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440]]) {
    await page.setViewportSize({ width, height })
    await expectFittedStage(page, width, height)
    await expect(page.getByTestId('viewport-lab-metrics')).not.toContainText('容器 0 × 0')
    await page.screenshot({ path: `output/playwright/cockpit-viewport-${width}.png`, animations: 'disabled' })
  }
})

test('配置损坏时可见回退提示和显式恢复', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('lumal-cockpit:config', '{broken'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('本地配置无法读取')
  await page.getByRole('button', { name: '恢复默认配置', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '综合态势', exact: true })).toHaveAttribute('aria-current', 'page')
})
