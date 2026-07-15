import { expect, test } from './fixtures'
import { expectNoPageOverflow, loginAsAdmin, openTopMenu } from './helpers'

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
  const drawer = page.locator('.luma-admin-settings-drawer')
  expect(await drawer.evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(385)
  await expect(page.getByText('自定义偏好设置 & 实时预览')).toBeVisible()
  await page.getByRole('tab', { name: '外观', exact: true }).click()
  await expect(page.locator('.luma-theme-settings__mode-card .luma-icon')).toHaveCount(3)
  await expect(page.locator('.luma-theme-settings__mode-card > span').last()).toHaveCSS('white-space', 'nowrap')
  await expect(page.locator('.luma-theme-settings__color-card > span').first()).toHaveCSS('white-space', 'nowrap')
  await page.getByRole('button', { name: '深色', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('tab', { name: '布局', exact: true }).click()
  const layoutCards = page.locator('.luma-theme-settings__layout-card')
  await expect(layoutCards).toHaveCount(3)
  const layoutCardTops = await layoutCards.evaluateAll(elements =>
    elements.map(element => Math.round(element.getBoundingClientRect().top)),
  )
  expect(new Set(layoutCardTops).size).toBe(1)
  await page.getByRole('button', { name: '顶部导航', exact: true }).click()
  await expect(page.locator('.luma-layout')).toHaveAttribute('data-layout', 'top-nav')
  await expect.poll(async () => page.evaluate(() => {
    const stored = localStorage.getItem('luma-admin:preferences')
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
      await page.getByRole('button', { name: '偏好设置' }).click()
      await page.getByRole('tab', { name: '布局', exact: true }).click()
      await page.getByRole('button', { name: layout.label, exact: true }).click()
      await expect(page.locator('.luma-layout')).toHaveAttribute('data-layout', layout.value)
      await page.getByRole('button', { name: '关闭此对话框' }).click()

      await page.goto('/#/examples/detail')
      await expect(page).toHaveURL(/#\/examples\/detail$/)
      await expect(page.locator('.luma-layout')).toHaveAttribute('data-layout', layout.value)
      await expectNoPageOverflow(page)

      const breadcrumb = page.getByRole('navigation', { name: '面包屑' })
      const desktopSidebar = page.locator('.luma-layout__desktop-sidebar')
      const primaryNavigation = page.getByRole('navigation', { name: '主导航' })
      const isMobile = width <= 768

      if (isMobile) {
        await expect(breadcrumb).toBeHidden()
        await expect(desktopSidebar).toBeHidden()
        await expect(primaryNavigation).toBeHidden()

        await page.getByRole('button', { name: '展开侧边栏' }).click()
        const mobileSidebar = page.locator('.luma-layout__mobile-sidebar')
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
          await expect(desktopSidebar.locator('.el-sub-menu.is-active')).toContainText('功能示例')
          await expect(desktopSidebar.locator('.el-menu-item.is-active')).toContainText('示例总览')
        }
        else if (layout.value === 'top-nav') {
          await expect(primaryNavigation).toBeVisible()
          await expect(desktopSidebar).toBeHidden()
          await expect(page.locator('.luma-top-nav .el-sub-menu.is-active')).toContainText('功能示例')
        }
        else {
          await expect(primaryNavigation).toBeVisible()
          await expect(desktopSidebar).toBeVisible()
          await expect(page.locator('.luma-top-nav .el-menu-item.is-active')).toContainText('功能示例')
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

test('侧栏折叠后仍显示已注册的菜单图标', async ({ page }) => {
  await loginAsAdmin(page)
  await page.getByRole('button', { name: '偏好设置' }).click()
  await page.getByRole('tab', { name: '布局', exact: true }).click()
  await page.getByRole('button', { name: '侧边导航', exact: true }).click()
  await page.getByRole('button', { name: '关闭此对话框' }).click()
  await page.getByRole('button', { name: '收起侧边栏' }).click()

  const icon = page.locator('.luma-layout__desktop-sidebar .luma-sidebar-menu-item__icon .luma-icon').first()
  await expect(icon).toBeVisible()
  await expect(icon).toHaveCSS('width', '16px')
  await expect(icon).toHaveCSS('height', '16px')
})

test('混合导航会根据一级菜单子级动态显示和隐藏侧栏', async ({ page }) => {
  await loginAsAdmin(page)
  const sidebar = page.locator('.luma-layout__desktop-sidebar')

  await expect(sidebar).toHaveCount(0)
  await openTopMenu(page, '系统管理')
  await expect(sidebar).toBeVisible()
  await expect(sidebar).toHaveCSS('transition-duration', /.+/)

  await page.getByRole('menuitem', { name: '工作台', exact: true }).click()
  await expect(sidebar).toHaveCount(0)
})

test('主题设置页和抽屉共享自适应图标卡片布局', async ({ page }) => {
  await loginAsAdmin(page)
  await openTopMenu(page, '功能示例')
  await page.getByRole('menuitem', { name: '主题与动画', exact: true }).click()

  const panel = page.locator('.luma-admin-example__theme-panel')
  await expect(panel).toBeVisible()
  expect(await panel.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(340)

  await panel.getByRole('tab', { name: '外观', exact: true }).click()
  await expect(panel.locator('.luma-theme-settings__mode-card .luma-icon')).toHaveCount(3)
  await expect(panel.locator('.luma-theme-settings__color-card > span').first()).toHaveCSS('white-space', 'nowrap')
})

test('系统主题和 reduced-motion 偏好会应用到真实页面', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await loginAsAdmin(page)
  await page.getByRole('button', { name: '偏好设置' }).click()
  await page.getByRole('tab', { name: '外观', exact: true }).click()
  await page.getByRole('button', { name: '跟随系统', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  const duration = await page.locator('.luma-layout__mobile-sidebar').evaluate(element =>
    getComputedStyle(element).transitionDuration,
  )
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001)
})
