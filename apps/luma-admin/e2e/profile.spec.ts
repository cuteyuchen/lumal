import { expect, test } from './fixtures'
import { loginAsAdmin } from './helpers'

test('个人中心可更新资料并校验修改密码表单', async ({ browserDiagnostics, page }) => {
  browserDiagnostics.expectHttpError('/api/profile/password', 400)

  await loginAsAdmin(page)
  await page.getByRole('button', { name: '进入个人中心' }).click()

  await expect(page).toHaveURL(/#\/profile$/)
  await expect(page.getByRole('tab', { name: '个人中心' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '个人中心' })).toBeVisible()

  const nickname = page.getByLabel('昵称')
  const phone = page.getByLabel('手机号')
  await nickname.fill('平台管理员')
  await phone.fill('13900139000')
  await page.getByRole('button', { name: '保存资料' }).click()

  await expect(page.getByText('个人资料已更新')).toBeVisible()
  await expect(page.locator('.luma-admin-header-actions__name')).toHaveText('平台管理员')

  await nickname.fill('超级管理员')
  await phone.fill('13800138001')
  await page.getByRole('button', { name: '保存资料' }).click()
  await expect(page.locator('.luma-admin-header-actions__name')).toHaveText('超级管理员')

  await page.getByRole('tab', { name: '修改密码' }).click()
  await page.getByLabel('当前密码').fill('wrong-password')
  await page.getByLabel('新密码', { exact: true }).fill('NewPassword123')
  await page.getByLabel('确认新密码').fill('NewPassword123')
  await page.getByRole('button', { name: '修改密码' }).click()
  await expect(page.getByText('当前密码不正确')).toBeVisible()

  await page.getByLabel('确认新密码').fill('DifferentPassword123')
  await page.getByRole('button', { name: '修改密码' }).click()
  await expect(page.getByText('两次输入的新密码不一致')).toBeVisible()
})
