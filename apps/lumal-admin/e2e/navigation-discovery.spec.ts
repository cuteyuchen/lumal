import { expect, test } from './fixtures'
import { loginAsAdmin, openTopMenu } from './helpers'

test('全局搜索、徽标、面包屑和 activeMenu 在真实导航中协同工作', async ({ page }) => {
  await page.context().route('https://element-plus.org/**', route => route.fulfill({
    body: '<!doctype html><html><body>Element Plus</body></html>',
    contentType: 'text/html',
    status: 200,
  }))
  await loginAsAdmin(page)

  await openTopMenu(page, '功能示例')
  await expect(page.locator('.lumal-layout__desktop-sidebar .lumal-menu-badge')).toContainText('NEW')

  await page.goto('/#/examples/detail')
  await expect(page).toHaveURL(/#\/examples\/detail$/)
  await expect(page.locator('.lumal-layout__desktop-sidebar .el-menu-item.is-active')).toContainText('示例总览')
  const breadcrumb = page.getByRole('navigation', { name: '面包屑' })
  await expect(breadcrumb).toContainText('功能示例')
  await expect(breadcrumb).toContainText('示例详情')

  await page.keyboard.press('Control+k')
  const search = page.getByRole('dialog', { name: '全局搜索' })
  const input = search.getByRole('combobox')
  await expect(input).toBeFocused()
  const options = search.getByRole('option')
  await input.press('ArrowUp')
  await expect(options.last()).toHaveAttribute('aria-selected', 'true')
  await input.press('ArrowDown')
  await expect(options.first()).toHaveAttribute('aria-selected', 'true')
  await input.fill('用户管理')
  await expect(search.getByRole('option')).toHaveCount(1)
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(page).toHaveURL(/#\/system\/user$/)
  await expect(search).toHaveCount(0)

  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  })
  await expect(page.getByRole('dialog', { name: '全局搜索' })).toBeVisible()
  await page.getByRole('dialog', { name: '全局搜索' }).getByRole('combobox', { name: '搜索菜单' }).press('Escape')
  await expect(page.getByRole('dialog', { name: '全局搜索' })).toHaveCount(0)

  await page.keyboard.press('Control+k')
  const externalSearch = page.getByRole('dialog', { name: '全局搜索' })
  const externalInput = externalSearch.getByRole('combobox', { name: '搜索菜单' })
  await externalInput.fill('Element Plus')
  const popupPromise = page.waitForEvent('popup')
  await externalInput.press('Enter')
  const popup = await popupPromise
  await expect(popup).toHaveURL(/https:\/\/element-plus\.org\//)
  await popup.close()
})

test('mixed-nav 顶级目录只切换侧栏，外链与内嵌子项各自导航', async ({ page }) => {
  await page.context().route('https://element-plus.org/**', async (route) => {
    await route.fulfill({
      body: '<!doctype html><html><body>Element Plus</body></html>',
      contentType: 'text/html',
      status: 200,
    })
  })
  await page.route('http://localhost:5175/**', async (route) => {
    await route.fulfill({
      body: '<!doctype html><html><body>DataV Guide</body></html>',
      contentType: 'text/html',
      status: 200,
    })
  })
  await loginAsAdmin(page)

  await openTopMenu(page, '系统管理')
  await page.getByRole('menuitem', { name: '菜单管理', exact: true }).click()
  await expect(page).toHaveURL(/#\/system\/menu$/)

  let popupCount = 0
  page.on('popup', () => {
    popupCount += 1
  })
  await openTopMenu(page, '外部资源')

  const sidebar = page.locator('.lumal-layout__desktop-sidebar')
  await expect(page).toHaveURL(/#\/system\/menu$/)
  await expect(sidebar.getByRole('menuitem', { name: 'Element Plus', exact: true })).toBeVisible()
  await expect(sidebar.getByRole('menuitem', { name: 'DataV 组件指南', exact: true })).toBeVisible()
  await expect(sidebar.locator('.el-menu-item.is-active')).toHaveCount(0)
  expect(popupCount).toBe(0)

  const popupPromise = page.waitForEvent('popup')
  await sidebar.getByRole('menuitem', { name: 'Element Plus', exact: true }).click()
  const popup = await popupPromise
  await expect(popup).toHaveURL(/https:\/\/element-plus\.org\//)
  await popup.close()
  await expect(page).toHaveURL(/#\/system\/menu$/)
  await expect(sidebar.locator('.el-menu-item.is-active')).toHaveCount(0)

  await sidebar.getByRole('menuitem', { name: 'DataV 组件指南', exact: true }).click()
  await expect(page).toHaveURL(/#\/resources\/datav-guide$/)
  await expect(page.locator('.lumal-admin-external-frame')).toBeVisible()
  await expect(sidebar.locator('.el-menu-item.is-active')).toContainText('DataV 组件指南')
})

test('全局字号设置会持久化并影响核心与业务文本', async ({ page }) => {
  await loginAsAdmin(page)
  const heading = page.getByRole('heading', { name: /欢迎回来/ })
  const initialSize = Number.parseFloat(await heading.evaluate(element => getComputedStyle(element).fontSize))

  await page.getByRole('button', { name: '偏好设置' }).click()
  const drawer = page.locator('.lumal-admin-settings-drawer')
  await drawer.getByRole('tab', { name: '外观', exact: true }).click()
  const fontSizeInput = drawer.getByRole('spinbutton').last()
  await fontSizeInput.fill('18')
  await fontSizeInput.press('Enter')

  // 用户仍输入设计字号，主题切换和恢复不能将 vw 覆盖回固定 px。
  await expect.poll(async () => Number.parseFloat(
    await page.locator('html').evaluate(element => getComputedStyle(element).fontSize),
  )).toBeCloseTo(18 * page.viewportSize()!.width / 1920, 1)
  await expect.poll(async () => Number.parseFloat(
    await heading.evaluate(element => getComputedStyle(element).fontSize),
  )).toBeGreaterThan(initialSize)
  await expect.poll(async () => page.evaluate(() => {
    const stored = localStorage.getItem('lumal-admin:preferences')
    return stored ? JSON.parse(stored).theme?.fontSize : undefined
  })).toBe(18)
  await page.reload()
  await expect.poll(async () => Number.parseFloat(
    await page.locator('html').evaluate(element => getComputedStyle(element).fontSize),
  )).toBeCloseTo(18 * page.viewportSize()!.width / 1920, 1)
})
