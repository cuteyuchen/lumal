import { expect, test } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test('Schema Form 保持范围日期样式、区块间距并支持图标选择', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/#/examples/schema-form')

  const toolbar = page.locator('.luma-schema-form-demo__toolbar')
  await expect(toolbar).toBeVisible()
  expect(await toolbar.evaluate(element => getComputedStyle(element).marginBottom)).toBe('20px')

  const rangeInput = page.locator('.el-date-editor--daterange .el-range-input').first()
  await expect(rangeInput).toBeVisible()
  expect(await rangeInput.evaluate(element => getComputedStyle(element).borderStyle)).toBe('none')

  await page.getByRole('button', { name: '选择菜单图标' }).click()
  const picker = page.getByRole('dialog', { name: '选择菜单图标' })
  await expect(picker).toBeVisible()
  await picker.getByRole('option').first().click()
  await picker.getByRole('button', { name: '确认选择' }).click()
  await expect(picker).toBeHidden()
})

test('Schema Table 支持错误恢复与持久化列设置', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/#/examples/schema-table')

  await page.getByRole('button', { name: '模拟错误' }).click()
  await expect(page.getByRole('alert')).toContainText('表格数据加载失败')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.getByRole('alert')).toBeHidden()

  await page.getByLabel('列设置').click()
  await page.locator('.luma-schema-table__column-options').getByLabel('状态').uncheck()
  await page.reload()
  await page.getByLabel('列设置').click()
  await expect(page.locator('.luma-schema-table__column-options').getByLabel('状态')).not.toBeChecked()
})

test('CRUD Table 可在弹窗与抽屉编辑器之间切换', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/#/examples/crud-table')

  await page.getByRole('button', { name: '编辑器：弹窗' }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await expect(page.locator('.el-drawer')).toBeVisible()
  await expect(page.locator('.el-drawer')).toContainText('状态')
  await expect(page.locator('.el-drawer')).toContainText('优先级')
})
