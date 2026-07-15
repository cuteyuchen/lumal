import { expect, test } from './fixtures'
import { loginAsAdmin, openTopMenu } from './helpers'

test('用户管理支持查询和新增流程', async ({ page }) => {
  const username = `e2e-${Date.now()}`
  await loginAsAdmin(page)
  await openTopMenu(page, '系统管理')
  await page.getByRole('menuitem', { name: '用户管理', exact: true }).click()

  await page.getByLabel('关键词').fill('admin')
  await page.getByRole('button', { name: '查询', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'admin', exact: true })).toBeVisible()

  await page.getByRole('button', { name: '新增用户', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '新增' })
  await dialog.getByLabel('用户名').fill(username)
  await dialog.getByLabel('昵称').fill('E2E 用户')
  await dialog.locator('.el-form-item').filter({ hasText: '角色' }).locator('.el-select').click()
  await page.getByRole('option', { name: '运营人员', exact: true }).click()
  await dialog.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByText('用户新增成功')).toBeVisible()
  await page.getByLabel('关键词').fill(username)
  await page.getByRole('button', { name: '查询', exact: true }).click()
  await expect(page.getByRole('cell', { name: username, exact: true })).toBeVisible()
})

test('会话凭据失效后重新进入登录页', async ({ page }) => {
  await loginAsAdmin(page)
  await page.evaluate(() => localStorage.removeItem('luma-admin:token'))
  await page.reload()
  await expect(page).toHaveURL(/#\/login\?redirect=\/dashboard$/)
})
