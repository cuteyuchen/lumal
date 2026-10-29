import { expect, test } from './fixtures'
import { expectNoPageOverflow, loginAsAdmin } from './helpers'

/***********************统一 vw 下的业务浮层回归*********************/
test('示例及 CRUD 页面没有旧画布包装，新增弹窗可见并可操作', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  const pages = [
    { path: '/examples/viewport' },
    { path: '/examples/datav' },
    { path: '/examples/cockpit' },
    { path: '/examples/crud-table', create: '新增' },
    { path: '/system/user', create: '新增用户' },
    { path: '/system/role', create: '新增角色' },
  ]
  for (const { create, path } of pages) {
    await page.goto(`/#${path}`)
    await expect(page.locator('[data-viewport-mode]')).toHaveCount(0)
    await expect(page.locator('.lumal-layout')).toHaveCSS('transform', 'none')
    await expect(page.getByRole('switch', { name: 'VW 适配', exact: true })).toHaveAttribute('aria-checked', 'true')
    if (create) {
      await page.getByRole('button', { name: create, exact: true }).click()
      const dialog = page.getByRole('dialog', { name: '新增', exact: true })
      await expect(dialog).toBeInViewport()
      const input = dialog.getByRole('textbox').first()
      await input.click()
      await expect(input).toBeFocused()
      await dialog.getByRole('button', { name: '取消', exact: true }).click()
      await expect(dialog).toBeHidden()
    }
    await expectNoPageOverflow(page)
  }
})

test('vw 页面中 Select 与 Dialog 正常 Teleport，定位和点击不重复缩放', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/#/system/dict-item')
  await expect(page.locator('.lumal-layout')).toHaveCSS('transform', 'none')
  const typeSelect = page.locator('.lumal-dictionary-items__filter .el-select')
  await typeSelect.click()
  const dropdown = page.locator('.el-select-dropdown:visible')
  await expect(dropdown).toBeInViewport()
  expect(await dropdown.evaluate(element => element.closest('.lumal-layout'))).toBeNull()
  await dropdown.getByRole('option').first().click()
  await page.getByRole('button', { name: '新增字典项', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '新增字典项', exact: true })
  await expect(dialog).toBeInViewport()
  expect(await dialog.evaluate(element => element.closest('.lumal-layout'))).toBeNull()
  await dialog.getByLabel('显示标签', { exact: true }).click()
  await expect(dialog.getByLabel('显示标签', { exact: true })).toBeFocused()
  await dialog.locator('[data-field="status"] .el-select').click()
  await expect(dropdown).toBeInViewport()
  expect(await dropdown.evaluate(element => element.closest('.lumal-layout'))).toBeNull()
  await dropdown.getByRole('option').first().click()
  await testInfo.attach('vw-teleported-dialog', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' })
  await dialog.locator('.el-dialog__headerbtn').click()
  await expect(dialog).toBeHidden()
  await expectNoPageOverflow(page)
})
