import type { Page } from '@playwright/test'
import type { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'

const themes = ['dark', 'light'] as const
const viewports = [
  { height: 1080, label: '1920x1080', width: 1920 },
  { height: 768, label: '1366x768', width: 1366 },
] as const

const runtimeErrors = new WeakMap<Page, string[]>()

test.beforeEach(({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error')
      errors.push(message.text())
  })
})

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus && !page.isClosed()) {
    const charts = await page.evaluate(() => window.lumalDatavVisual?.getChartStates())
    await testInfo.attach('chart-state', {
      body: JSON.stringify(charts, null, 2),
      contentType: 'application/json',
    })
  }
  expect(runtimeErrors.get(page), '画廊不应产生运行时错误').toEqual([])
})

async function waitForCharts(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => {
    const charts = window.lumalDatavVisual.getChartStates()
    return charts.map(chart => ({
      ...chart,
      dimensionsMatch: chart.width > 0 && chart.height > 0
        && chart.width === chart.hostWidth && chart.height === chart.hostHeight,
    }))
  }), { message: '两张图表完成静态绘制且尺寸与容器一致' }).toEqual([
    expect.objectContaining({ ready: true, dimensionsMatch: true }),
    expect.objectContaining({ ready: true, dimensionsMatch: true }),
  ])

  await expect.poll(() => page.locator('main.gallery canvas').evaluateAll((canvases) => {
    return canvases.length === 2 && canvases.every((element) => {
      const canvas = element as HTMLCanvasElement
      const context = canvas.getContext('2d')
      if (!context || canvas.width <= 0 || canvas.height <= 0)
        return false
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      return pixels.some((value, index) => index % 4 === 3 && value > 0)
    })
  }), { message: '每张 Canvas 都有实际绘制的像素' }).toBe(true)
}

async function prepareGallery(page: Page, theme: typeof themes[number]): Promise<void> {
  await expect(page.locator('.lumal-border-box')).toHaveCount(13)
  await expect(page.locator('.lumal-decoration')).toHaveCount(12)
  if (theme === 'light') {
    await page.getByRole('button', { name: '切换浅色' }).click()
    await expect(page.locator('main.gallery')).toHaveClass(/is-light/)
  }
  await page.evaluate(() => document.fonts.ready)
  await waitForCharts(page)
  const contained = await page.locator('.component-grid > article.wide').evaluateAll((cards) => {
    return cards.every((card) => {
      const title = card.querySelector('h2')!.getBoundingClientRect()
      const content = card.lastElementChild!.getBoundingClientRect()
      const bounds = card.getBoundingClientRect()
      return content.top >= title.bottom && content.bottom <= bounds.bottom
        && content.left >= bounds.left && content.right <= bounds.right
    })
  })
  expect(contained, '图表与列表留在卡片内且不覆盖标题').toBe(true)

  // reduced-motion 只暂停 SVG 当前时刻；所有根 SVG 必须归一到同一 SMIL 时间。
  await page.locator('main.gallery svg').evaluateAll((svgs) => {
    for (const element of svgs) {
      const svg = element as SVGSVGElement
      svg.pauseAnimations()
      svg.setCurrentTime(1)
    }
  })

  await expect.poll(() => page.evaluate(async () => {
    const measure = () => JSON.stringify(Array.from(
      document.querySelectorAll('main.gallery, main.gallery svg, main.gallery canvas'),
      element => element.getBoundingClientRect().toJSON(),
    ))
    const before = measure()
    await new Promise<void>(done => requestAnimationFrame(() => done()))
    const middle = measure()
    await new Promise<void>(done => requestAnimationFrame(() => done()))
    return before === middle && middle === measure()
  }), { message: '截图前布局在连续三帧保持稳定' }).toBe(true)
}

function captureGallery(page: Page, path: string): Promise<Buffer> {
  return page.screenshot({
    animations: 'disabled',
    fullPage: true,
    mask: [1, 3, 6, 9].map(variant => page.locator(`.lumal-decoration[data-variant="${variant}"]`)),
    maskColor: '#081322',
    path,
  })
}

test('异步图表引擎未加载时不报告已就绪，加载后绘制非空画布', async ({ page }) => {
  let releaseEngine: () => void = () => {}
  const engineGate = new Promise<void>((done) => {
    releaseEngine = done
  })
  let pendingRequests = 0
  await page.route(url => /\/echarts(?:\/|\.js$)/.test(url.pathname), async (route) => {
    pendingRequests += 1
    await engineGate
    await route.continue()
  })
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.lumal-charts__host')).toHaveCount(2)
    await expect.poll(() => pendingRequests).toBeGreaterThan(0)
    const charts = await page.evaluate(() => window.lumalDatavVisual.getChartStates())
    expect(charts).toHaveLength(2)
    expect(charts.every(chart => !chart.ready)).toBe(true)
    await expect(page.locator('main.gallery canvas')).toHaveCount(0)
    releaseEngine()
    await waitForCharts(page)
  }
  finally {
    releaseEngine()
    await page.unrouteAll({ behavior: 'wait' })
  }
})

test('DataV 特征动效与复杂装饰结构已接入', async ({ page }) => {
  await page.goto('/')

  expect(await page.locator('.lumal-decoration[data-variant="1"] .lumal-decoration__mark').count()).toBeGreaterThan(0)
  await expect(page.locator('.lumal-decoration[data-variant="9"] .lumal-decoration__ring')).toHaveCount(4)
  await expect(page.locator('.lumal-decoration[data-variant="10"] .lumal-decoration__segment')).toHaveCount(3)

  const borderOne = page.locator('.lumal-border-box[data-variant="1"]')
  const borderEight = page.locator('.lumal-border-box[data-variant="8"]')

  await expect(borderOne.locator('animate')).toHaveCount(12)
  await expect(borderEight.locator('animateMotion')).toHaveCount(1)
  await expect(borderEight.locator('use animate[attributeName="stroke-dasharray"]')).toHaveCount(1)
  await expect(page.locator('.lumal-decoration[data-variant="12"] animateTransform')).toHaveCount(1)

  const borderEightSvg = borderEight.locator('svg')
  const startTime = await borderEightSvg.evaluate(element => (element as SVGSVGElement).getCurrentTime())
  await page.waitForTimeout(150)
  const runningTime = await borderEightSvg.evaluate(element => (element as SVGSVGElement).getCurrentTime())
  expect(runningTime).toBeGreaterThan(startTime + 0.05)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(borderEight).toHaveClass(/is-animation-paused/)
  const pausedTime = await borderEightSvg.evaluate(element => (element as SVGSVGElement).getCurrentTime())
  await page.waitForTimeout(150)
  const stillPausedTime = await borderEightSvg.evaluate(element => (element as SVGSVGElement).getCurrentTime())
  expect(Math.abs(stillPausedTime - pausedTime)).toBeLessThan(0.03)
})

test('飞线图在固定 SMIL 时间保持 DataV 2.10.0 视觉', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/fidelity.html')

  const flyline = page.locator('[data-component="flylineChart"]')
  const enhanced = page.locator('[data-component="flylineChartEnhanced"]')
  await expect(flyline.locator('svg')).toBeVisible()
  await expect(enhanced.locator('svg')).toBeVisible()

  for (const chart of [flyline, enhanced]) {
    const path = chart.locator('path[data-flyline-path]').first()
    const dashAnimation = chart.locator('animate[attributeName="stroke-dasharray"]').first()
    await expect(dashAnimation).toBeAttached()
    const [length, from] = await Promise.all([
      path.evaluate(element => (element as SVGPathElement).getTotalLength()),
      dashAnimation.getAttribute('from'),
    ])
    expect(Number(from?.split(',')[1])).toBeCloseTo(length, 5)
  }

  await page.locator('.lumal-flyline-chart svg, .lumal-flyline-chart-enhanced svg').evaluateAll((svgs) => {
    svgs.forEach((svg) => {
      const animated = svg as SVGSVGElement
      animated.pauseAnimations()
      animated.setCurrentTime(1)
    })
  })

  await expect(flyline).toHaveScreenshot('flyline-chart-upstream-t1.png', {
    animations: 'allow',
    maxDiffPixels: 12,
  })
  await expect(enhanced).toHaveScreenshot('flyline-chart-enhanced-upstream-t1.png', {
    animations: 'allow',
    maxDiffPixels: 12,
  })
})

for (const theme of themes) {
  for (const viewport of viewports) {
    test(`${theme} ${viewport.label}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ height: viewport.height, width: viewport.width })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')

      await prepareGallery(page, theme)

      const screenshot = await captureGallery(page, testInfo.outputPath('gallery-stable.png'))
      await page.reload()
      await prepareGallery(page, theme)
      const reloaded = await captureGallery(page, testInfo.outputPath('gallery-reloaded.png'))
      await testInfo.attach('gallery-stable', { body: screenshot, contentType: 'image/png' })
      await testInfo.attach('gallery-reloaded', { body: reloaded, contentType: 'image/png' })
      expect(reloaded.equals(screenshot), '重新加载后的固定画廊截图应逐字节一致').toBe(true)
      expect(screenshot).toMatchSnapshot(`datav-${theme}-${viewport.label}.png`, {
        // 保留既有像素阈值；确定性由上面的跨加载比较单独严格验证。
        maxDiffPixels: 2500,
      })
    })
  }
}
