import { expect } from '@playwright/test'

/** 在生成项目的生产页面上验证分组、三种布局及窄屏 vw 导航。 */
export async function verifyScaffoldNavigation(page, path, preset) {
  const layouts = [
    { label: '侧边导航', value: 'sidebar-nav' },
    { label: '顶部导航', value: 'top-nav' },
    { label: '混合导航', value: 'mixed-nav' },
  ]
  const setLayout = async (layout) => {
    await page.getByRole('button', { name: '偏好设置', exact: true }).click()
    const drawer = page.locator('.el-drawer')
    await drawer.getByRole('tab', { name: '布局', exact: true }).click()
    await drawer.getByRole('button', { name: layout.label, exact: true }).click()
    await expect(page.locator('.lumal-layout')).toHaveAttribute('data-layout', layout.value)
    await page.keyboard.press('Escape')
    await expect(drawer).not.toBeVisible()
  }
  for (const layout of layouts) {
    await setLayout(layout)
    await page.goto(path('/system/users'))
    await expect(page.locator('.lumal-page__title').filter({ hasText: '用户管理' })).toBeVisible()
    const sidebar = page.locator('.lumal-layout__desktop-sidebar')
    const top = page.getByRole('navigation', { name: '主导航', exact: true })
    await expect(page.locator('.lumal-breadcrumb')).toContainText('系统管理')
    if (layout.value === 'sidebar-nav') {
      await expect(top).toHaveCount(0)
      const parent = sidebar.locator('.el-sub-menu').filter({ has: page.locator('.el-sub-menu__title').filter({ hasText: /^系统管理$/ }) })
      await parent.locator(':scope > .el-sub-menu__title').click()
      await expect(parent).not.toHaveClass(/is-opened/)
      await parent.locator(':scope > .el-sub-menu__title').click()
      await expect(parent).toHaveClass(/is-opened/)
      await sidebar.getByRole('menuitem', { name: '角色管理', exact: true }).click()
      await expect(sidebar.locator('.el-sub-menu.is-active')).not.toContainText('Schema 表单')
    }
    else if (layout.value === 'top-nav') {
      await expect(sidebar).toHaveCount(0)
      await top.getByRole('menuitem', { name: '系统管理', exact: true }).hover()
      await page.locator('.el-menu--popup:visible').getByRole('menuitem', { name: '角色管理', exact: true }).click()
    }
    else {
      await top.getByRole('menuitem', { name: '系统管理', exact: true }).click()
      await sidebar.getByRole('menuitem', { name: '角色管理', exact: true }).click()
    }
    await expect(page).toHaveURL(/\/system\/roles$/)
    await expect(page.getByRole('tab', { name: '角色管理', exact: true })).toBeVisible()
    if (layout.value !== 'top-nav')
      await expect(sidebar.locator('.el-menu-item.is-active')).toHaveText('角色管理')
    if (preset === 'vben-compatible') {
      const group = layout.value === 'sidebar-nav' ? sidebar : top
      await expect(group.getByRole('menuitem', { name: 'Vben 迁移示例', exact: true })).toBeVisible()
    }

    const headerHeight = (await page.locator('.lumal-header').boundingBox()).height
    const sidebarWidth = layout.value === 'top-nav' ? undefined : (await sidebar.boundingBox()).width
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.locator('.lumal-layout')).not.toHaveClass(/is-responsive/)
    await expect.poll(async () => (await page.locator('.lumal-header').boundingBox()).height).toBeCloseTo(headerHeight * 390 / 1280, 1)
    const mobile = page.locator('.lumal-layout__mobile-sidebar')
    await expect(mobile).not.toBeVisible()
    // 启用 vw 后维持当前业务布局；窄屏仍通过可见菜单真实跳转，不改走移动抽屉。
    if (layout.value === 'top-nav') {
      await expect(sidebar).toHaveCount(0)
      await top.getByRole('menuitem', { name: '系统管理', exact: true }).hover()
      await page.locator('.el-menu--popup:visible').getByRole('menuitem', { name: '用户管理', exact: true }).click()
    }
    else {
      await expect(sidebar).toBeVisible()
      await expect.poll(async () => (await sidebar.boundingBox()).width).toBeCloseTo(sidebarWidth * 390 / 1280, 1)
      await sidebar.getByRole('menuitem', { name: '用户管理', exact: true }).click()
    }
    await expect(page).toHaveURL(/\/system\/users$/)
    await expect(page.locator('.lumal-page__title').filter({ hasText: '用户管理' })).toBeVisible()
    await expect(mobile).toHaveAttribute('aria-hidden', 'true')
    await expect(mobile).toHaveAttribute('inert', '')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false)
    await page.setViewportSize({ width: 1280, height: 720 })
  }
  await setLayout(layouts[0])
}
