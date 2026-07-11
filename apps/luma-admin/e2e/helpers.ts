import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function resetBrowserState(page: Page): Promise<void> {
  await page.goto('/#/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await resetBrowserState(page)
  await page.getByTestId('login-submit').click()
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
  await page.getByTestId('login-submit').click()
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
  await page.getByRole('menuitem', { name, exact: true }).click()
}
