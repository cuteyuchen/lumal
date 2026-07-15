import { expect, test } from './fixtures'
import { loginAsAdmin, openTopMenu } from './helpers'

test('角色页显示角色编码并可打开菜单与按钮授权树', async ({ page }) => {
  await loginAsAdmin(page)
  await openTopMenu(page, '系统管理')
  await page.getByRole('menuitem', { name: '角色管理', exact: true }).click()

  await expect(page.getByRole('columnheader', { name: '角色编码' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'admin', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '授权' }).first().click()

  await expect(page.getByRole('dialog', { name: '角色授权：超级管理员（admin）' })).toBeVisible()
  await expect(page.getByText('勾选菜单会联动下级页面和按钮权限')).toBeVisible()
  await expect(page.getByRole('treeitem', { name: '角色管理' })).toBeVisible()
  await expect(page.getByRole('treeitem', { name: '角色授权' })).toBeVisible()
})
