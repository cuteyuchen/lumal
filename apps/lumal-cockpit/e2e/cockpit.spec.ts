import type { Locator, Page } from '@playwright/test'
import type { Buffer } from 'node:buffer'
import { expect, test } from '../../lumal-admin/e2e/fixtures'
import { canvasFullClip, canvasSampleClip, countCanvasColors } from './canvas-pixels'

/***********************生产画布像素、网络和组件生命周期证据*********************/
async function expectFittedStage(page: Page, width: number, height: number): Promise<void> {
  await expect(page.locator('[data-viewport-mode], [data-scale]')).toHaveCount(0)
  await expect(page.locator('.lumal-cockpit-canvas__stage')).toHaveCSS('transform', 'none')
  // ResizeObserver 与 RAF 合并更新完成后再记录截图，不能只断言旧地图仍然连接。
  await expect.poll(async () => {
    const bounds = await page.locator('.lumal-cockpit-canvas__stage').boundingBox()
    return Boolean(bounds && Math.abs(bounds.width - width) < 1 && Math.abs(bounds.height - 1080 * width / 1920) < 1)
  }).toBe(true)
  // 高度不参与比例；矮屏由外层容器滚动承载同一内容。
  // scrollHeight/clientHeight 为整数；1366×768 的内容仅多 0.375px，不构成可滚动溢出。
  if (1080 * width / 1920 - height > 1) {
    const container = page.locator('.lumal-full-screen-container')
    expect(await container.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
    await expect(container).toHaveCSS('overflow-y', 'auto')
    const scrollTop = await container.evaluate((element) => {
      element.scrollTop = element.scrollHeight
      const bottom = element.scrollTop
      element.scrollTop = 0
      return bottom
    })
    expect(scrollTop).toBeGreaterThan(0)
  }
}

async function captureCanvas(canvas: Locator, sampleOnly = false): Promise<Buffer> {
  // 调用方已验证可见性；这里只读取几何数据，避免软件 GPU 下重复等待同一就绪条件。
  const bounds = await canvas.evaluateAll((elements) => {
    const target = elements[0]
    if (elements.length !== 1 || !target.isConnected)
      throw new Error('截图必须对应唯一且仍连接的画布')
    const { x, y, width, height } = target.getBoundingClientRect()
    return { x, y, width, height }
  })
  const viewport = canvas.page().viewportSize()
  expect(viewport, '生产画布验收必须使用显式视口').not.toBeNull()
  expect(bounds.width).toBeGreaterThan(0)
  expect(bounds.height).toBeGreaterThan(0)
  const fullClip = canvasFullClip({
    ...bounds,
    width: Math.min(bounds.width, viewport!.width - bounds.x),
    height: Math.min(bounds.height, viewport!.height - bounds.y),
  })
  expect(fullClip.x).toBeGreaterThanOrEqual(0)
  expect(fullClip.y).toBeGreaterThanOrEqual(0)
  expect(fullClip.x + fullClip.width).toBeLessThanOrEqual(viewport!.width)
  expect(fullClip.y + fullClip.height).toBeLessThanOrEqual(viewport!.height)
  // 仅采样可见画布；矮屏不能为了截图而引入高度缩放。
  const clip = sampleOnly ? canvasSampleClip(fullClip) : fullClip
  const image = await canvas.page().screenshot({ animations: 'disabled', clip })
  test.info().annotations.push({
    type: sampleOnly ? 'canvas-sample-size' : 'canvas-full-size',
    description: `${clip.width}x${clip.height}`,
  })
  await test.info().attach('canvas-pixel-sample', { body: image, contentType: 'image/png' })
  return image
}

function expectCanvasColors(image: Buffer): void {
  const analysisStarted = performance.now()
  const colorCount = countCanvasColors(image)
  test.info().annotations.push(
    { type: 'canvas-colors', description: String(colorCount) },
    { type: 'canvas-analysis-ms', description: (performance.now() - analysisStarted).toFixed(1) },
  )
  expect(colorCount, '真实 Canvas 截图不能是空白或单色占位').toBeGreaterThan(10)
}

test('默认动画、真实画布与 Widget 交互', async ({ page }) => {
  const failed: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400)
      failed.push(`${response.status()} ${response.url()}`)
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '全国智慧运行态势' })).toBeVisible()
  await expect(page.locator('.metric-summary__grid')).toBeVisible()
  const canvas = page.locator('.echarts-geo-center canvas').first()
  await expect(canvas).toBeVisible()
  expectCanvasColors(await captureCanvas(canvas))
  await page.getByRole('tab', { name: '区域状态分布', exact: false }).click()
  await expect(page.locator('.status-distribution')).toBeVisible()
  await page.locator('[data-action="collapse-left"]').click()
  await expect(page.locator('[data-action="collapse-left"]')).toHaveAttribute('aria-expanded', 'false')
  await page.locator('[data-action="collapse-left"]').click()
  await expect(page.locator('[data-action="collapse-left"]')).toHaveAttribute('aria-expanded', 'true')
  expect(failed).toEqual([])
})

test('独立场景交互与 OpenLayers 原实例 resize 和释放', async ({ browserDiagnostics, page }) => {
  // 默认动画与全幅像素由上一用例验证；地图交互不与昂贵的软件 GPU 截图共用预算。
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // OpenLayers 命中检测触发的浏览器性能建议，不是资源或执行错误；不放宽其他警告。
  browserDiagnostics.allowConsoleWarning('Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true. See: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently')
  const failed: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400)
      failed.push(`${response.status()} ${response.url()}`)
  })
  await page.goto('/')
  await page.getByRole('tab', { name: '独立场景', exact: true }).click()
  await expect(page.getByRole('img', { name: '中性场景区域预览' })).toBeVisible()
  await page.locator('.standalone-center__point-button').first().click()
  await expect(page.locator('.standalone-center__status strong')).not.toHaveText('未选择')
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

test('Cesium 资源与原实例 resize', async ({ page }) => {
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
  await expect(page.locator('.echarts-geo-center')).toHaveCount(0)
  await expect(page.locator('.cesium-center')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.cesium-widget canvas')).toBeVisible()
  await expect(page.locator('.cesium-center [role="alert"]')).toHaveCount(0)
  const cesium = await page.locator('.cesium-widget canvas').elementHandle()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expectFittedStage(page, 1440, 900)
  await expect.poll(() => cesium!.evaluate(element => element.isConnected)).toBe(true)
  await expect.poll(() => workers.length).toBeGreaterThan(0)
  await page.screenshot({ path: 'output/playwright/cockpit-cesium-1440.png', animations: 'disabled' })
  // 截图后再确认原画布与绘图尺寸，不能把渲染前的短暂连接当成 resize 成功。
  const rendered = await cesium!.evaluate((element) => {
    const canvas = element as HTMLCanvasElement
    return {
      connected: canvas.isConnected,
      resized: canvas.width === canvas.clientWidth && canvas.height === canvas.clientHeight,
      error: document.querySelector('.cesium-center [role="alert"]')?.textContent ?? '',
    }
  })
  expect(rendered).toEqual({ connected: true, resized: true, error: '' })
  await page.getByRole('tab', { name: 'ECharts', exact: true }).click()
  await expect(page.locator('.cesium-widget')).toHaveCount(0)
  expect(failed).toEqual([])
})

test('Cesium 全幅真实像素与退出清理', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('tab', { name: 'Cesium', exact: true }).click()
  await expect(page.locator('.echarts-geo-center')).toHaveCount(0)
  await expect(page.locator('.cesium-center')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.cesium-center [role="alert"]')).toHaveCount(0)
  // 保留默认设计尺寸的全幅采样，但不让软件 GPU 与同步 PNG 解码争用 CPU。
  const canvas = page.locator('.cesium-widget canvas')
  await expect(canvas).toBeVisible()
  // 记录并检查实际 WebGL 后端，防止启动参数被忽略后静默改用其他渲染器。
  const renderer = await canvas.evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext('webgl2')!
    const debug = gl.getExtension('WEBGL_debug_renderer_info')!
    return gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) as string
  })
  test.info().annotations.push({ type: 'webgl-renderer', description: renderer })
  expect(renderer).toMatch(process.platform === 'win32' ? /Microsoft Basic Render Driver.*D3D11/ : /SwiftShader/)
  const image = await captureCanvas(canvas)
  await page.getByRole('tab', { name: 'ECharts', exact: true }).click()
  await expect(page.locator('.cesium-widget')).toHaveCount(0)
  expectCanvasColors(image)
})

test('Cesium 中断重试、真实像素与退出清理', async ({ page }) => {
  // 恢复契约单独初始化，避免把两次软件 GPU 截图串进同一个测试预算。
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const failed: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400)
      failed.push(`${response.status()} ${response.url()}`)
  })
  await page.goto('/')
  await page.getByRole('tab', { name: 'Cesium', exact: true }).click()
  // 旧引擎释放与初始化完成独立观测；两项都完成后才进入故障注入。
  await Promise.all([
    expect(page.locator('.echarts-geo-center')).toHaveCount(0),
    expect(page.locator('.cesium-center')).toHaveAttribute('aria-busy', 'false'),
  ])
  await expect(page.locator('.cesium-widget canvas')).toBeVisible()
  await page.locator('.cesium-widget canvas').dispatchEvent('webglcontextlost')
  await expect(page.locator('.cesium-center [role="alert"]')).toContainText('Cesium 渲染中断')
  await page.getByRole('button', { name: '重新加载', exact: true }).click()
  await expect(page.locator('.cesium-center')).toHaveAttribute('aria-busy', 'false')
  // 保留 ready 屏障，避免把初始化中的短暂无错误状态当作恢复成功。
  await Promise.all([
    expect(page.locator('.cesium-widget canvas')).toBeVisible(),
    expect(page.locator('.cesium-center [role="alert"]')).toHaveCount(0),
  ])
  // 全幅与 resize 由独立用例验证；恢复采样中央真实地图，不用 Widget 颜色证明重绘成功。
  const image = await captureCanvas(page.locator('.cesium-widget canvas'), true)
  await page.getByRole('tab', { name: '独立场景', exact: true }).click()
  await expect(page.getByRole('img', { name: '中性场景区域预览' })).toBeVisible()
  await expect(page.locator('.cesium-widget')).toHaveCount(0)
  expectCanvasColors(image)
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

test('窄视口 Designer 真实拖拽、保存和恢复不污染设计像素', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('tab', { name: '独立场景', exact: true }).click()
  await page.getByRole('button', { name: '打开配置器', exact: true }).click()
  const designer = page.getByRole('dialog', { name: '驾驶舱配置', exact: true })
  const left = designer.locator('[data-side="left"]')
  const width = designer.getByRole('spinbutton', { name: '左侧区域宽度像素', exact: true })
  await width.fill('360')
  await width.press('Tab')
  const cell = left.locator('.lumal-cockpit-designer__grid-cells .lumal-cockpit-designer__drop-zone').first()
  await cell.getByRole('button', { name: /^移除模块 / }).click()
  await expect(cell.locator('[data-role="placed-widget"]')).toHaveCount(0)
  const card = designer.locator('.lumal-cockpit-designer__library-card').first()
  const type = await card.getAttribute('data-cockpit-library-type')
  const title = await card.getAttribute('data-cockpit-library-title')
  // 使用浏览器真实拖拽事件，不直接调用 Sortable 回调或改写草稿状态。
  await card.dragTo(cell)
  await expect(cell.locator('[data-role="placed-widget"]')).toContainText(title!)
  await expect(designer.locator('.is-drag-ghost, .is-drag-chosen')).toHaveCount(0)
  await designer.getByRole('button', { name: '保存', exact: true }).click()
  await expect(designer).toHaveCount(0)
  await page.reload()
  const saved = await page.evaluate(() => {
    const config = JSON.parse(localStorage.getItem('lumal-cockpit:config')!)
    return config.layouts.find((layout: { id: string }) => layout.id === config.activeLayoutId).left
  })
  expect(saved.width).toBe(360)
  expect(saved.rows[0].cells[0].widget.type).toBe(type)
  await page.getByRole('button', { name: '打开配置器', exact: true }).click()
  await expect(width).toHaveValue('360')
  await expect(cell.locator('[data-role="placed-widget"]')).toContainText(title!)
  await page.screenshot({ path: 'output/playwright/cockpit-designer-1366.png', animations: 'disabled' })
  await designer.getByRole('button', { name: '取消', exact: true }).click()
  await expect(designer).toHaveCount(0)
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

test('统一宽度规则与全屏退出', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('button', { name: '切换大屏适配模式' })).toHaveCount(0)
  await expectFittedStage(page, 1920, 1080)
  await page.getByRole('button', { name: '进入全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
  await page.getByRole('button', { name: '退出全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false)
})

test('全屏浮层的视口实验点击热区与设计器取消', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('tab', { name: '独立场景', exact: true }).click()
  await expect(page.locator('.standalone-center')).toBeVisible()
  const layoutTitle = (await page.locator('.standalone-app__layouts [aria-current="page"]').textContent())!.trim()
  const storedConfig = await page.evaluate(() => localStorage.getItem('lumal-cockpit:config'))

  await page.getByRole('button', { name: '进入全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
  await page.getByRole('button', { name: '打开视口实验', exact: true }).click()
  const viewportDialog = page.getByRole('dialog', { name: '视口实验', exact: true })
  await expect(viewportDialog).toBeVisible()
  // body Teleport 和兄弟浮层必须属于同一个全屏树，正常点击不能依赖 force 绕过遮挡。
  await expect.poll(() => viewportDialog.evaluate(element => Boolean(document.fullscreenElement?.contains(element)))).toBe(true)
  await viewportDialog.getByRole('button', { name: '确认节点 · 0', exact: true }).click()
  await expect(viewportDialog.getByRole('button', { name: '确认节点 · 1', exact: true })).toBeVisible()
  await viewportDialog.locator('.el-dialog__headerbtn').click()
  await expect(viewportDialog).toBeHidden()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)

  await page.getByRole('button', { name: '打开配置器', exact: true }).click()
  const designer = page.getByRole('dialog', { name: '驾驶舱配置', exact: true })
  await expect(designer).toBeVisible()
  await expect.poll(() => designer.evaluate(element => Boolean(document.fullscreenElement?.contains(element)))).toBe(true)
  await designer.getByRole('textbox', { name: '当前布局名称', exact: true }).fill('全屏未保存草稿')
  await designer.getByRole('button', { name: '取消', exact: true }).click()
  await expect(designer).toHaveCount(0)
  await expect(page.getByRole('button', { name: '全屏未保存草稿', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: layoutTitle, exact: true })).toHaveAttribute('aria-current', 'page')
  expect(await page.evaluate(() => localStorage.getItem('lumal-cockpit:config'))).toBe(storedConfig)

  await page.getByRole('button', { name: '退出全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false)
})

test('隔离 Viewport 实验的尺寸、点击热区与窗口 resize', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('tab', { name: '独立场景', exact: true }).click()
  await expect(page.locator('.standalone-center')).toBeVisible()
  await page.getByRole('button', { name: '打开视口实验' }).click()
  // Teleport 弹层也必须使用独立应用的暗色语义色，不能只检查根节点主题标记。
  await expect(page.getByRole('dialog', { name: '视口实验', exact: true }).locator('.el-dialog')).toHaveCSS('background-color', 'rgba(8, 31, 47, 0.98)')
  await expect(page.getByTestId('viewport-lab-metrics')).toBeVisible()
  const originalWidth = (await page.locator('.viewport-lab__sample').boundingBox())!.width
  await expect(page.getByTestId('viewport-lab-metrics')).toContainText('D 1920')
  expect(originalWidth).toBeCloseTo(192, 1)
  await page.getByRole('button', { name: '确认节点 · 0' }).click()
  await expect(page.getByRole('button', { name: '确认节点 · 1' })).toBeVisible()
  await expect(page.getByLabel('实验适配策略', { exact: true })).toHaveCount(0)
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 920], [1920, 1080], [2560, 1440]]) {
    await page.setViewportSize({ width, height })
    await expectFittedStage(page, width, height)
    expect((await page.locator('.viewport-lab__sample').boundingBox())!.width).toBeCloseTo(192 * width / 1920, 1)
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
