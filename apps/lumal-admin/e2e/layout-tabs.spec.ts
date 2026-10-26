import { expect, test } from './fixtures'
import { expectNoPageOverflow, loginAsAdmin, openPreferences, openTopMenu } from './helpers'

const layoutTransitionSelector = [
  '.lumal-layout-header-enter-active',
  '.lumal-layout-header-leave-active',
  '.lumal-layout-breadcrumb-enter-active',
  '.lumal-layout-breadcrumb-leave-active',
  '.lumal-layout-sidebar-enter-active',
  '.lumal-layout-sidebar-leave-active',
].join(',')

test('设置、标签页和移动布局可以完整操作并持久化', async ({ page }) => {
  await loginAsAdmin(page)
  await openTopMenu(page, '功能示例')
  await page.getByRole('menuitem', { name: 'Chart Panel', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Chart Panel' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新当前页面' })).toBeVisible()
  await page.getByRole('button', { name: '刷新当前页面' }).click()

  await page.getByRole('tab', { name: 'Chart Panel' }).click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: '重新加载' })).toBeVisible()
  await page.getByRole('menuitem', { name: '重新加载' }).click()

  await page.getByRole('button', { name: '偏好设置' }).click()
  const drawer = page.locator('.lumal-admin-settings-drawer')
  expect(await drawer.evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(385)
  await expect(page.getByText('自定义偏好设置 & 实时预览')).toBeVisible()
  await page.getByRole('tab', { name: '外观', exact: true }).click()
  await expect(page.locator('.lumal-theme-settings__mode-card .lumal-icon')).toHaveCount(3)
  await expect(page.locator('.lumal-theme-settings__mode-card > span').last()).toHaveCSS('white-space', 'nowrap')
  await expect(page.locator('.lumal-theme-settings__color-card > span').first()).toHaveCSS('white-space', 'nowrap')
  await page.getByRole('button', { name: '深色', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('tab', { name: '布局', exact: true }).click()
  const layoutCards = page.locator('.lumal-theme-settings__layout-card')
  await expect(layoutCards).toHaveCount(3)
  const layoutCardTops = await layoutCards.evaluateAll(elements =>
    elements.map(element => Math.round(element.getBoundingClientRect().top)),
  )
  expect(new Set(layoutCardTops).size).toBe(1)
  await page.getByRole('button', { name: '顶部导航', exact: true }).click()
  await expect(page.locator('.lumal-layout')).toHaveAttribute('data-layout', 'top-nav')
  await expect.poll(async () => page.evaluate(() => {
    const stored = localStorage.getItem('lumal-admin:preferences')
    return stored ? JSON.parse(stored).app?.layout : undefined
  })).toBe('top-nav')
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()

  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole('button', { name: /菜单|侧边栏/ })).toBeVisible()
  await expectNoPageOverflow(page)
})

test('三种布局在 375、768、1024、1440px 下保持导航可用且无页面级溢出', async ({ page }) => {
  test.setTimeout(120_000)
  await loginAsAdmin(page)

  const layouts = [
    { label: '侧边导航', value: 'sidebar-nav' },
    { label: '顶部导航', value: 'top-nav' },
    { label: '混合导航', value: 'mixed-nav' },
  ] as const

  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })

    for (const layout of layouts) {
      await openPreferences(page)
      await page.getByRole('tab', { name: '布局', exact: true }).click()
      await page.getByRole('button', { name: layout.label, exact: true }).click()
      await expect(page.locator('.lumal-layout')).toHaveAttribute('data-layout', layout.value)
      await page.getByRole('button', { name: '关闭此对话框' }).click()

      await page.goto('/#/examples/detail')
      await expect(page).toHaveURL(/#\/examples\/detail$/)
      await expect(page.locator('.lumal-layout')).toHaveAttribute('data-layout', layout.value)
      // 离场节点在过渡结束前仍合法存在，唯一节点断言应检查稳定布局。
      await expect(page.locator(layoutTransitionSelector)).toHaveCount(0)
      await expectNoPageOverflow(page)

      const breadcrumb = page.getByRole('navigation', { name: '面包屑' })
      const desktopSidebar = page.locator('.lumal-layout__desktop-sidebar')
      const primaryNavigation = page.getByRole('navigation', { name: '主导航' })
      const isMobile = width <= 768

      if (isMobile) {
        await expect(breadcrumb).toBeHidden()
        await expect(desktopSidebar).toBeHidden()
        await expect(primaryNavigation).toBeHidden()

        await page.getByRole('button', { name: '展开侧边栏' }).click()
        const mobileSidebar = page.locator('.lumal-layout__mobile-sidebar')
        await expect(mobileSidebar).toBeVisible()
        await expect(mobileSidebar.locator('.el-sub-menu.is-active')).toContainText('功能示例')
        await expect(mobileSidebar.locator('.el-menu-item.is-active')).toContainText('示例总览')
        await page.getByRole('button', { name: '收起侧边栏' }).click()
      }
      else {
        await expect(breadcrumb).toBeVisible()
        await expect(breadcrumb).toContainText('功能示例')
        await expect(breadcrumb).toContainText('示例详情')

        if (layout.value === 'sidebar-nav') {
          await expect(primaryNavigation).toBeHidden()
          await expect(desktopSidebar).toBeVisible()
          await expect(page.locator('.lumal-header__breadcrumb .lumal-breadcrumb')).toBeVisible()
          await expect(page.locator('.lumal-layout__main > .lumal-breadcrumb')).toHaveCount(0)
          await expect(desktopSidebar.locator('.el-sub-menu.is-active')).toContainText('功能示例')
          await expect(desktopSidebar.locator('.el-menu-item.is-active')).toContainText('示例总览')
        }
        else if (layout.value === 'top-nav') {
          await expect(primaryNavigation).toBeVisible()
          await expect(desktopSidebar).toBeHidden()
          await expect(page.locator('.lumal-header__breadcrumb')).toHaveCount(0)
          await expect(page.locator('.lumal-layout__main > .lumal-breadcrumb')).toBeVisible()
          await expect(page.locator('.lumal-top-nav .el-sub-menu.is-active')).toContainText('功能示例')
        }
        else {
          await expect(primaryNavigation).toBeVisible()
          await expect(desktopSidebar).toBeVisible()
          await expect(page.locator('.lumal-header__breadcrumb')).toHaveCount(0)
          await expect(page.locator('.lumal-layout__main > .lumal-breadcrumb')).toBeVisible()
          await expect(page.locator('.lumal-top-nav .el-menu-item.is-active')).toContainText('功能示例')
          await expect(desktopSidebar.locator('.el-menu-item.is-active')).toContainText('示例总览')
        }
      }

      await page.getByRole('button', { name: '打开全局搜索' }).click()
      const search = page.getByRole('dialog', { name: '全局搜索' })
      const searchInput = search.getByRole('combobox', { name: '搜索菜单' })
      await expect(search).toBeVisible()
      await searchInput.fill('用户管理')
      await expect(search.getByRole('option')).toHaveCount(1)
      await searchInput.press('Escape')
      await expect(search).toHaveCount(0)
      await expectNoPageOverflow(page)
    }
  }
})

for (const layout of [
  { label: '侧边导航', value: 'sidebar-nav' },
  { label: '顶部导航', value: 'top-nav' },
  { label: '混合导航', value: 'mixed-nav' },
] as const) {
  test(`内容最大化在${layout.label}中保留页面并完成生产动画还原`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await loginAsAdmin(page)
    await page.goto('/#/examples/overview')
    const draft = page.getByPlaceholder('搜索能力或公开入口', { exact: true })
    await expect(draft).toBeVisible()
    await openPreferences(page)
    await page.getByRole('tab', { name: '布局', exact: true }).click()
    await page.getByRole('button', { name: layout.label, exact: true }).click()
    await page.getByRole('button', { name: '关闭此对话框' }).click()

    const shell = page.locator('.lumal-layout')
    const main = page.locator('.lumal-layout__main')
    const content = page.locator('.lumal-content')
    const header = page.locator('.lumal-header')
    const sidebar = page.locator('.lumal-layout__desktop-sidebar')
    const transitions = shell.locator(layoutTransitionSelector)
    await expect(shell).toHaveAttribute('data-layout', layout.value)
    await expect(transitions).toHaveCount(0)
    await draft.fill('Schema')
    const originalInput = await draft.elementHandle()
    const originalPage = await page.locator('.lumal-admin-example').elementHandle()
    const baseline = await main.boundingBox()
    const baselineContent = await content.boundingBox()
    expect(baseline).not.toBeNull()
    expect(baselineContent).not.toBeNull()
    expect(baseline!.width).toBeGreaterThan(900)
    const metrics: Record<string, unknown>[] = [{ state: 'initial', main: baseline, content: baselineContent }]

    async function expectPagePreserved() {
      await expect(draft).toHaveValue('Schema')
      expect(await draft.evaluate((current, original) => current === original, originalInput!)).toBe(true)
      expect(await page.locator('.lumal-admin-example').evaluate((current, original) => current === original, originalPage!)).toBe(true)
      await expect(page).toHaveURL(/#\/examples\/overview$/)
      await expectNoPageOverflow(page)
    }

    async function expectRestored() {
      await expect(shell).not.toHaveClass(/is-content-maximized/)
      await expect(page.getByRole('button', { name: '内容最大化', exact: true })).toBeVisible()
      await expect(header).toBeVisible()
      await expect(transitions).toHaveCount(0)
      await expect(sidebar).toHaveCount(layout.value === 'top-nav' ? 0 : 1)
      await expect(header).toHaveCSS('opacity', '1')
      await expect.poll(async () => {
        const box = await main.boundingBox()
        return box && (['x', 'y', 'width', 'height'] as const).every(key => Math.abs(box[key] - baseline![key]) < 1)
      }).toBe(true)
      await expectPagePreserved()
    }

    for (const restore of ['button', 'Escape'] as const) {
      await page.getByRole('button', { name: '内容最大化', exact: true }).click()
      await expect(shell).toHaveClass(/is-content-maximized/)
      await expect(page.getByRole('button', { name: '退出内容最大化', exact: true })).toBeVisible()
      await expect(header).toBeHidden()
      await expect(sidebar).toHaveCount(0)
      await expect(transitions).toHaveCount(0)
      const maximized = await main.boundingBox()
      const workspace = await content.boundingBox()
      const tabs = await page.locator('.lumal-tabs').boundingBox()
      expect(maximized).not.toBeNull()
      expect(workspace).not.toBeNull()
      expect(tabs).not.toBeNull()
      expect(maximized!.x).toBeCloseTo(0, 0)
      expect(maximized!.y).toBeCloseTo(0, 0)
      expect(maximized!.width).toBeCloseTo(1440, 0)
      expect(maximized!.height).toBeCloseTo(900, 0)
      expect(workspace!.width).toBeCloseTo(1440, 0)
      expect(workspace!.height + tabs!.height).toBeCloseTo(900, 0)
      expect(workspace!.height).toBeGreaterThan(baselineContent!.height + 32)
      expect(['absolute', 'fixed']).not.toContain(await main.evaluate(element => getComputedStyle(element).position))
      await expectPagePreserved()
      metrics.push({ state: `maximized-before-${restore}`, main: maximized, content: workspace })
      if (restore === 'button') {
        await testInfo.attach('maximized-layout', { body: await page.screenshot(), contentType: 'image/png' })
        await page.getByRole('button', { name: '退出内容最大化', exact: true }).click()
      }
      else {
        await page.keyboard.press('Escape')
      }
      await expectRestored()
    }

    // 同一真实按钮在离场过渡尚未结束时反向操作，不让自动等待把它变成两次完整动画。
    const reversedDuringTransition = await page.getByRole('button', { name: '内容最大化', exact: true }).evaluate(async (element) => {
      const button = element as HTMLButtonElement
      button.click()
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      const leaving = Boolean(document.querySelector('.lumal-layout-header-leave-active'))
      button.click()
      return leaving
    })
    expect(reversedDuringTransition).toBe(true)
    await expectRestored()
    metrics.push({ state: 'restored-after-reversal', main: await main.boundingBox(), content: await content.boundingBox() })
    await testInfo.attach('layout-maximize-metrics', {
      body: JSON.stringify({ layout: layout.value, viewport: page.viewportSize(), metrics }, null, 2),
      contentType: 'application/json',
    })
  })
}

test('侧栏折叠后仍显示已注册的菜单图标', async ({ page }) => {
  await loginAsAdmin(page)
  await page.getByRole('button', { name: '偏好设置' }).click()
  await page.getByRole('tab', { name: '布局', exact: true }).click()
  await page.getByRole('button', { name: '侧边导航', exact: true }).click()
  await page.getByRole('button', { name: '关闭此对话框' }).click()
  await page.getByRole('button', { name: '收起侧边栏' }).click()

  const icon = page.locator('.lumal-layout__desktop-sidebar .lumal-sidebar-menu-item__icon .lumal-icon').first()
  await expect(icon).toBeVisible()
  await expect(icon).toHaveCSS('width', '16px')
  await expect(icon).toHaveCSS('height', '16px')
})

test('混合导航会根据一级菜单子级动态显示和隐藏侧栏', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await loginAsAdmin(page)
  const sidebar = page.locator('.lumal-layout__desktop-sidebar')

  await expect(sidebar).toHaveCount(0)
  await openTopMenu(page, '系统管理')
  await expect(sidebar).toBeVisible()
  // 等待 appear 完成，避免把尚未展开的宽度误作离场动画的基线。
  await expect(page.locator(layoutTransitionSelector)).toHaveCount(0)
  await expect(sidebar).toHaveCSS('transition-duration', /.+/)

  const sampledWidths = await page.locator('.lumal-header__navigation')
    .getByRole('menuitem', { name: '工作台', exact: true })
    .evaluate(async (element) => {
      const readWidth = (): number => {
        const currentSidebar = document.querySelector<HTMLElement>('.lumal-layout__desktop-sidebar')
        return currentSidebar ? currentSidebar.getBoundingClientRect().width : -1
      }
      const widths = [readWidth()]
      const target = element as HTMLElement
      target.click()
      for (let index = 0; index < 8; index += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 25))
        widths.push(readWidth())
      }
      return widths
    })

  expect(sampledWidths[0]).toBeGreaterThan(0)
  expect(sampledWidths.slice(1).some(width => width > 0 && width < sampledWidths[0]!)).toBe(true)
  await expect(sidebar).toHaveCount(0)
})

test('宽屏普通页面保持自然高度且卡片内容从顶部排列', async ({ page }) => {
  await page.setViewportSize({ width: 2160, height: 1080 })
  await loginAsAdmin(page)

  const routerView = page.locator('.lumal-router-view')
  const workspace = page.locator('.lumal-admin-workspace')
  const workspaceBox = await workspace.boundingBox()
  const routerViewBox = await routerView.boundingBox()
  expect(workspaceBox).not.toBeNull()
  expect(routerViewBox).not.toBeNull()
  expect(workspaceBox!.height).toBeLessThan(routerViewBox!.height - 80)

  const quickPage = page.locator('.lumal-admin-workspace__columns .lumal-page').filter({
    has: page.getByRole('heading', { name: '快捷入口', exact: true }),
  })
  const quickHeaderBox = await quickPage.locator('.lumal-page__header').boundingBox()
  const quickBodyBox = await quickPage.locator('.lumal-page__body').boundingBox()
  expect(quickHeaderBox).not.toBeNull()
  expect(quickBodyBox).not.toBeNull()
  expect(quickBodyBox!.y - (quickHeaderBox!.y + quickHeaderBox!.height)).toBeLessThanOrEqual(20)

  await page.goto('/#/examples/overview')
  const overviewPage = page.locator('.lumal-admin-example > .lumal-page')
  await expect(overviewPage.locator('.overview-card')).toHaveCount(13)
  const fullOverviewBox = await overviewPage.boundingBox()
  // 示例数量增加后允许自然增长；筛选成短内容时仍须收缩，不被路由容器强制拉满。
  await page.getByPlaceholder('搜索能力或公开入口').fill('Viewport')
  await expect(overviewPage.locator('.overview-card')).toHaveCount(1)
  const overviewBox = await overviewPage.boundingBox()
  const overviewRouterBox = await routerView.boundingBox()
  expect(overviewBox).not.toBeNull()
  expect(overviewRouterBox).not.toBeNull()
  expect(overviewBox!.height).toBeLessThan(overviewRouterBox!.height - 80)
  expect(overviewBox!.height).toBeLessThan(fullOverviewBox!.height)
  await expectNoPageOverflow(page)

  await page.goto('/#/system/user')
  const fillPage = page.locator('.lumal-admin-user-page')
  await expect(fillPage.getByRole('heading', { name: '机构导航' })).toBeVisible()
  const fillBox = await fillPage.boundingBox()
  const fillRouterBox = await routerView.boundingBox()
  expect(fillBox!.height).toBeGreaterThan(fillRouterBox!.height * 0.8)
})

test('主题设置页和抽屉共享自适应图标卡片布局', async ({ page }) => {
  await loginAsAdmin(page)
  await openTopMenu(page, '功能示例')
  await page.getByRole('menuitem', { name: '主题与动画', exact: true }).click()

  const panel = page.locator('.lumal-admin-example__theme-panel')
  await expect(panel).toBeVisible()
  expect(await panel.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(340)

  await panel.getByRole('tab', { name: '外观', exact: true }).click()
  await expect(panel.locator('.lumal-theme-settings__mode-card .lumal-icon')).toHaveCount(3)
  await expect(panel.locator('.lumal-theme-settings__color-card > span').first()).toHaveCSS('white-space', 'nowrap')
})

test('系统主题和 reduced-motion 偏好会应用到真实页面', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await loginAsAdmin(page)
  await page.getByRole('button', { name: '偏好设置' }).click()
  await page.getByRole('tab', { name: '外观', exact: true }).click()
  await page.getByRole('button', { name: '跟随系统', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  const duration = await page.locator('.lumal-layout__mobile-sidebar').evaluate(element =>
    getComputedStyle(element).transitionDuration,
  )
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001)
})
