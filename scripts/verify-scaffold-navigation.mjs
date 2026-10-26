import { expect } from '@playwright/test'

/** 在生成项目的生产页面上验证分组、三种布局和移动端真实导航。 */
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

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(sidebar).not.toBeVisible()
    await page.getByRole('button', { name: '展开侧边栏', exact: true }).click()
    const mobile = page.locator('.lumal-layout__mobile-sidebar')
    await expect(mobile).toBeVisible()
    await expect(mobile.locator('.el-sub-menu.is-active')).toContainText('系统管理')
    await mobile.getByRole('menuitem', { name: '用户管理', exact: true }).click()
    await expect(page).toHaveURL(/\/system\/users$/)
    await expect(mobile).toHaveAttribute('aria-hidden', 'true')
    await expect(mobile).toHaveAttribute('inert', '')
    await expect.poll(() => mobile.evaluate(element => element.getBoundingClientRect().right)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false)
    await page.setViewportSize({ width: 1280, height: 720 })
  }
  await setLayout(layouts[0])
}
