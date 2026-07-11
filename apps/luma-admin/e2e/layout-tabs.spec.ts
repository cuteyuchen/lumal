import { expect, test } from '@playwright/test'
import { expectNoPageOverflow, loginAsAdmin, openTopMenu } from './helpers'

test('设置、标签页和移动布局可以完整操作并持久化', async ({ page }) => {
  await loginAsAdmin(page)
  await openTopMenu(page, '功能示例')
  await page.getByRole('menuitem', { name: 'Chart Panel', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Chart Panel' })).toBeVisible()

  await page.getByRole('tab', { name: 'Chart Panel' }).click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: '刷新当前页' })).toBeVisible()
  await page.getByRole('menuitem', { name: '刷新当前页' }).click()

  await page.getByRole('button', { name: '主题与布局设置' }).click()
  await page.getByRole('tab', { name: '主题', exact: true }).click()
  await page.getByRole('button', { name: '深色', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('tab', { name: '布局', exact: true }).click()
  await page.getByRole('button', { name: '顶部导航', exact: true }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()

  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole('button', { name: /菜单|侧边栏/ })).toBeVisible()
  await expectNoPageOverflow(page)
})

test('三种桌面布局在 768、1024、1440px 均无页面级溢出', async ({ page }) => {
  await loginAsAdmin(page)

  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.getByRole('button', { name: '主题与布局设置' }).click()
    await page.getByRole('tab', { name: '布局', exact: true }).click()

    for (const layout of ['侧边导航', '顶部导航', '混合导航']) {
      await page.getByRole('button', { name: layout, exact: true }).click()
      await expectNoPageOverflow(page)
    }

    await page.getByRole('button', { name: '关闭此对话框' }).click()
  }
})

test('系统主题和 reduced-motion 偏好会应用到真实页面', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await loginAsAdmin(page)
  await page.getByRole('button', { name: '主题与布局设置' }).click()
  await page.getByRole('tab', { name: '主题', exact: true }).click()
  await page.getByRole('button', { name: '跟随系统', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  const duration = await page.locator('.luma-layout__mobile-sidebar').evaluate(element =>
    getComputedStyle(element).transitionDuration,
  )
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001)
})
