import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { expectNoPageOverflow, loginAsAdmin } from './helpers'

const modeLabels = {
  contain: '等比完整',
  responsive: '响应式',
  width: '按宽缩放',
} as const

/***********************首屏菜单样式与真实操作*********************/
for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { name: '桌面', width: 1440, height: 900 },
    { name: '窄屏', width: 375, height: 720 },
  ]) {
    test(`首次打开的工作区适配菜单样式与状态正常（${viewport.name}/${theme}）`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      await loginAsAdmin(page)
      if (await page.locator('html').evaluate(element => element.classList.contains('dark')) !== (theme === 'dark'))
        await page.getByRole('button', { name: /切换(?:深|浅)色模式/ }).click()

      // 只在首次工作台打开菜单，不能依赖随后访问的业务页补齐按需样式。
      const trigger = page.getByRole('button', { name: '工作区适配', exact: true })
      await trigger.click()
      const menu = page.getByRole('menu', { name: '工作区适配', exact: true })
      const items = menu.getByRole('menuitem')
      await expect(menu).toBeVisible()
      await testInfo.attach('viewport-menu-first-open', {
        body: await page.screenshot({ animations: 'disabled' }),
        contentType: 'image/png',
      })
      await expect(menu).toHaveCSS('list-style-type', 'none')
      await expect(items).toHaveCount(3)
      for (const item of await items.all()) {
        await expect(item).toHaveCSS('display', 'flex')
        await expect(item).toBeInViewport({ ratio: 1 })
      }
      const bounds = await items.evaluateAll(elements => elements.map((element) => {
        const rect = element.getBoundingClientRect()
        return { height: rect.height, top: rect.top, bottom: rect.bottom }
      }))
      for (const [index, boundsOfItem] of bounds.entries()) {
        expect(boundsOfItem.height).toBeGreaterThanOrEqual(32)
        if (index > 0)
          expect(boundsOfItem.top).toBeGreaterThanOrEqual(bounds[index - 1]!.bottom)
      }
      const current = menu.getByRole('menuitem', { name: modeLabels.responsive, exact: true })
      await expect(current).toHaveAttribute('aria-current', 'true')
      await expect(current).toHaveCSS('font-weight', '600')
      await menu.getByRole('menuitem', { name: modeLabels.contain, exact: true }).click()
      await expect(menu).toBeHidden()
      await expect(trigger).toHaveAttribute('data-mode', 'contain')
      await expect(page.getByTestId('admin-workspace-viewport')).toHaveAttribute('data-viewport-mode', 'contain')

      await trigger.click()
      const selected = menu.getByRole('menuitem', { name: modeLabels.contain, exact: true })
      await expect(selected).toHaveAttribute('aria-current', 'true')
      await expect(selected).toHaveCSS('font-weight', '600')
      await selected.press('Escape')
      await expect(menu).toBeHidden()
      await expectNoPageOverflow(page)
    })
  }
}

/***********************用户模式选择与物理字号*********************/
async function selectWorkspaceMode(page: Page, mode: keyof typeof modeLabels): Promise<void> {
  const trigger = page.getByRole('button', { name: '工作区适配', exact: true })
  const previous = await trigger.getAttribute('data-mode') as keyof typeof modeLabels
  await trigger.click()
  const menu = page.getByRole('menu', { name: '工作区适配', exact: true })
  // 使用 Element Plus 实际支持的菜单语义，并核对当前模式的辅助技术状态。
  await expect(menu.getByRole('menuitem', { name: modeLabels[previous], exact: true })).toHaveAttribute('aria-current', 'true')
  await menu.getByRole('menuitem', { name: modeLabels[mode], exact: true }).click()
  await expect(trigger).toHaveAttribute('data-mode', mode)
  await expect(menu).toBeHidden()
}

async function physicalFontSize(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const stage = element.closest('.admin-workspace-viewport__stage')!
    const transform = getComputedStyle(stage).transform
    const scale = transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a
    // computed style 会序列化小数；按 0.01px 读取物理字号，避免浮点尾差。
    return Number((Number.parseFloat(getComputedStyle(element).fontSize) * scale).toFixed(2))
  })
}

test('三种工作区模式可切换并持久化，保持正文可读、根字号与标签草稿', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/#/examples/overview')
  const workspace = page.getByTestId('admin-workspace-viewport')
  const stage = page.locator('.admin-workspace-viewport__stage')
  const rootFont = await page.locator('html').evaluate(element => getComputedStyle(element).fontSize)
  const draft = page.getByPlaceholder('搜索能力或公开入口', { exact: true })
  await draft.fill('Schema')
  const originalInput = await draft.elementHandle()
  const metrics: Record<string, unknown>[] = []

  for (const mode of ['contain', 'width', 'responsive'] as const) {
    await selectWorkspaceMode(page, mode)
    await expect(workspace).toHaveAttribute('data-viewport-mode', mode)
    if (mode === 'responsive')
      await expect(stage).toHaveCSS('transform', 'none')
    else
      await expect(stage).not.toHaveCSS('transform', 'none')
    await expect(draft).toHaveValue('Schema')
    expect(await draft.evaluate((current, original) => current === original, originalInput!)).toBe(true)
    expect(await physicalFontSize(page.locator('.overview-card p').first())).toBeGreaterThanOrEqual(12)
    expect(await physicalFontSize(page.locator('.overview-card code').first())).toBeGreaterThanOrEqual(12)
    expect(await physicalFontSize(stage)).toBeGreaterThanOrEqual(12)
    expect(await page.locator('html').evaluate(element => getComputedStyle(element).fontSize)).toBe(rootFont)
    expect(await page.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--lumal-workspace-min-font-size'))).toBe('')
    metrics.push(await workspace.evaluate(element => ({
      container: { height: element.clientHeight, width: element.clientWidth },
      devicePixelRatio: window.devicePixelRatio,
      mode: element.getAttribute('data-viewport-mode'),
      scale: element.getAttribute('data-scale'),
      viewport: { height: window.innerHeight, width: window.innerWidth },
    })))
    await expectNoPageOverflow(page)
  }

  // 高度受限时两种画布策略必须产生不同的实际比例，而不只是切换标记。
  await page.setViewportSize({ width: 1440, height: 700 })
  const constrainedScales: number[] = []
  for (const mode of ['contain', 'width'] as const) {
    await selectWorkspaceMode(page, mode)
    await expect.poll(() => workspace.evaluate((element) => {
      const widthScale = element.clientWidth / 1280
      const natural = element.getAttribute('data-viewport-mode') === 'width'
        ? widthScale
        : Math.min(widthScale, element.clientHeight / 720)
      return Math.abs(Number(element.getAttribute('data-scale')) - Math.max(0.75, natural))
    })).toBeLessThan(0.001)
    constrainedScales.push(Number(await workspace.getAttribute('data-scale')))
    metrics.push(await workspace.evaluate(element => ({
      container: { height: element.clientHeight, width: element.clientWidth },
      devicePixelRatio: window.devicePixelRatio,
      mode: element.getAttribute('data-viewport-mode'),
      scale: element.getAttribute('data-scale'),
      viewport: { height: window.innerHeight, width: window.innerWidth },
    })))
    await expectNoPageOverflow(page)
  }
  expect(constrainedScales[0]).toBeLessThan(constrainedScales[1]!)
  await page.setViewportSize({ width: 1440, height: 900 })

  // 使用真实标签导航，不能以 page.goto 的整页重载冒充 KeepAlive 验收。
  await selectWorkspaceMode(page, 'contain')
  await page.getByRole('tab', { name: '工作台', exact: true }).click()
  await expect(page).toHaveURL(/#\/dashboard$/)
  await page.getByRole('tab', { name: '示例总览', exact: true }).click()
  await expect(draft).toHaveValue('Schema')
  expect(await draft.evaluate((current, original) => current === original, originalInput!)).toBe(true)

  await selectWorkspaceMode(page, 'width')
  await page.reload()
  await expect(workspace).toHaveAttribute('data-viewport-mode', 'width')
  await expect(page.getByRole('button', { name: '工作区适配', exact: true })).toHaveAttribute('data-mode', 'width')
  await testInfo.attach('workspace-mode-metrics', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' })
  await testInfo.attach('workspace-width', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' })
})

test('小窗口遵守缩放下限，使用局部滚动且不制造页面级水平滚动', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 620 })
  await loginAsAdmin(page)
  await page.goto('/#/examples/overview')
  await selectWorkspaceMode(page, 'contain')
  const workspace = page.getByTestId('admin-workspace-viewport')
  await expect(workspace).toHaveAttribute('data-scale', '0.75')
  await expect.poll(() => workspace.evaluate(element => (
    element.scrollWidth > element.clientWidth && element.scrollHeight > element.clientHeight
  ))).toBe(true)
  expect(await physicalFontSize(page.locator('.overview-card code').first())).toBeGreaterThanOrEqual(12)
  expect(await physicalFontSize(page.locator('.overview-card p').first())).toBeGreaterThanOrEqual(12)
  await workspace.evaluate(element => element.scrollTo({ left: element.scrollWidth, top: element.scrollHeight }))
  await expect.poll(() => workspace.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  await expect.poll(() => workspace.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  await expectNoPageOverflow(page)
  await testInfo.attach('workspace-small-window', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' })
  await selectWorkspaceMode(page, 'responsive')
  await expect(page.locator('.admin-workspace-viewport__stage')).toHaveCSS('transform', 'none')
  await expectNoPageOverflow(page)
})

/***********************独立布局豁免与非画布浮层*********************/
test('六类独立布局覆盖工作区缩放，CRUD 弹窗继续可见并可操作', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await selectWorkspaceMode(page, 'width')
  const workspace = page.getByTestId('admin-workspace-viewport')
  const pages = [
    { path: '/examples/viewport' },
    { path: '/examples/datav' },
    { path: '/examples/cockpit' },
    { path: '/examples/crud-table', create: '新增' },
    { path: '/system/user', create: '新增用户' },
    { path: '/system/role', create: '新增角色' },
  ]
  for (const { create, path } of pages) {
    await page.goto(`/#${path}`)
    await expect(workspace).toHaveAttribute('data-viewport-mode', 'responsive')
    await expect(page.locator('.admin-workspace-viewport__stage')).toHaveCSS('transform', 'none')
    const trigger = page.getByRole('button', { name: '工作区适配', exact: true })
    await expect(trigger).toHaveAttribute('data-mode', 'width')
    await expect(trigger).toHaveAttribute('title', /本页独立布局/)
    if (create) {
      await page.getByRole('button', { name: create, exact: true }).click()
      const dialog = page.getByRole('dialog', { name: '新增', exact: true })
      await expect(dialog).toBeInViewport()
      const input = dialog.getByRole('textbox').first()
      await input.click()
      await expect(input).toBeFocused()
      await dialog.getByRole('button', { name: '取消', exact: true }).click()
      await expect(dialog).toBeHidden()
    }
    await expectNoPageOverflow(page)
  }
  await page.goto('/#/examples/overview')
  await expect(workspace).toHaveAttribute('data-viewport-mode', 'width')
  await expect(page.getByRole('button', { name: '工作区适配', exact: true })).not.toHaveAttribute('title', /本页独立布局/)
})

test('非豁免页面缩放后 Select 与 Dialog 仍 Teleport 到画布外并可点击', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await selectWorkspaceMode(page, 'contain')
  await page.goto('/#/system/dict-item')
  await expect(page.getByTestId('admin-workspace-viewport')).toHaveAttribute('data-viewport-mode', 'contain')
  await expect(page.locator('.admin-workspace-viewport__stage')).not.toHaveCSS('transform', 'none')

  const typeSelect = page.locator('.lumal-dictionary-items__filter .el-select')
  await typeSelect.click()
  const dropdown = page.locator('.el-select-dropdown:visible')
  await expect(dropdown).toBeInViewport()
  expect(await dropdown.evaluate(element => element.closest('.admin-workspace-viewport'))).toBeNull()
  await dropdown.getByRole('option').first().click()
  await page.getByRole('button', { name: '新增字典项', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '新增字典项', exact: true })
  await expect(dialog).toBeInViewport()
  expect(await dialog.evaluate(element => element.closest('.admin-workspace-viewport'))).toBeNull()
  await dialog.getByLabel('显示标签', { exact: true }).click()
  await expect(dialog.getByLabel('显示标签', { exact: true })).toBeFocused()
  await dialog.locator('[data-field="status"] .el-select').click()
  await expect(dropdown).toBeInViewport()
  expect(await dropdown.evaluate(element => element.closest('.admin-workspace-viewport'))).toBeNull()
  await dropdown.getByRole('option').first().click()
  await testInfo.attach('workspace-teleported-dialog', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' })
  await dialog.locator('.el-dialog__headerbtn').click()
  await expect(dialog).toBeHidden()
  await expectNoPageOverflow(page)
})
