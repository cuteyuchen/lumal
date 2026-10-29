import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

async function waitForDashboardResponses(page: Page): Promise<void> {
  // Header 已出现不代表五个工作台请求已结束，尤其不能在访客 403 尚未送达时结束诊断。
  const paths = ['/api/system/users', '/api/system/roles', '/api/system/menus', '/api/system/dictionaries/types', '/api/system/roles/options']
  await Promise.all(paths.map(async (path) => {
    const response = await page.waitForResponse(response => new URL(response.url()).pathname === path && response.request().method() === 'GET')
    await response.finished()
  }))
}

export async function resetBrowserState(page: Page): Promise<void> {
  await page.goto('/#/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await resetBrowserState(page)
  await Promise.all([waitForDashboardResponses(page), page.getByTestId('login-submit').click()])
  await expect(page).toHaveURL(/#\/dashboard$/)
  await expect(page.getByRole('heading', { name: /欢迎回来/ })).toBeVisible()
}

export async function loginAs(page: Page, account: 'admin' | 'guest' | 'operator'): Promise<void> {
  await resetBrowserState(page)
  await page.getByTestId('login-account').click()
  const labels = {
    admin: '超级管理员',
    guest: '访客账号',
    operator: '运营人员',
  }
  await page.getByRole('option', { name: labels[account], exact: true }).click()
  await Promise.all([waitForDashboardResponses(page), page.getByTestId('login-submit').click()])
  await expect(page).toHaveURL(/#\/dashboard$/)
}

export async function expectNoPageOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(overflow.scrollWidth).toBe(overflow.clientWidth)
}

export async function openTopMenu(page: Page, name: string): Promise<void> {
  const items = page.getByRole('menuitem', { name, exact: true })
  let item = items.filter({ visible: true }).last()

  if (!await item.count()) {
    await page.locator('.lumal-top-nav .el-sub-menu__icon-more').click()
    item = items.filter({ visible: true }).last()
  }

  await item.click()
}

export async function openPreferences(page: Page): Promise<void> {
  const desktopButton = page.getByRole('button', { name: '偏好设置', exact: true })
  if (await desktopButton.isVisible()) {
    await desktopButton.click()
    return
  }
  await page.getByRole('button', { name: '账户与更多操作' }).click()
  await page.getByRole('menuitem', { name: '偏好设置', exact: true }).click()
}
