import { expect, test } from './fixtures'
import { loginAsAdmin, openTopMenu } from './helpers'

test('全局搜索、徽标、面包屑和 activeMenu 在真实导航中协同工作', async ({ page }) => {
  await loginAsAdmin(page)

  await openTopMenu(page, '功能示例')
  await expect(page.locator('.luma-layout__desktop-sidebar .luma-menu-badge')).toContainText('NEW')

  await page.goto('/#/examples/detail')
  await expect(page).toHaveURL(/#\/examples\/detail$/)
  await expect(page.locator('.luma-layout__desktop-sidebar .el-menu-item.is-active')).toContainText('示例总览')
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
  await page.getByRole('combobox').press('Escape')
  await expect(page.getByRole('dialog', { name: '全局搜索' })).toHaveCount(0)

  await page.keyboard.press('Control+k')
  const externalSearch = page.getByRole('dialog', { name: '全局搜索' })
  const externalInput = externalSearch.getByRole('combobox', { name: '搜索菜单' })
  await externalInput.fill('外部文档')
  const popupPromise = page.waitForEvent('popup')
  await externalInput.press('Enter')
  const popup = await popupPromise
  expect(popup.url()).toContain('element-plus.org')
  await popup.close()
})

test('全局字号设置会持久化并影响核心与业务文本', async ({ page }) => {
  await loginAsAdmin(page)
  const heading = page.getByRole('heading', { name: /欢迎回来/ })
  const initialSize = Number.parseFloat(await heading.evaluate(element => getComputedStyle(element).fontSize))

  await page.getByRole('button', { name: '偏好设置' }).click()
  const drawer = page.locator('.luma-admin-settings-drawer')
  await drawer.getByRole('tab', { name: '外观', exact: true }).click()
  const fontSizeInput = drawer.getByRole('spinbutton').last()
  await fontSizeInput.fill('18')
  await fontSizeInput.press('Enter')

  await expect(page.locator('html')).toHaveCSS('--luma-font-size-base', '18px')
  await expect.poll(async () => Number.parseFloat(
    await heading.evaluate(element => getComputedStyle(element).fontSize),
  )).toBeGreaterThan(initialSize)
  await expect.poll(async () => page.evaluate(() => {
    const stored = localStorage.getItem('luma-admin:preferences')
    return stored ? JSON.parse(stored).theme?.fontSize : undefined
  })).toBe(18)
})
