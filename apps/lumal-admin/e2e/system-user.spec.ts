import { expect, test } from './fixtures'
import { expectNoPageOverflow, loginAsAdmin, openTopMenu } from './helpers'

async function openUserManagement(page: Parameters<typeof loginAsAdmin>[0]): Promise<void> {
  await loginAsAdmin(page)
  await openTopMenu(page, '系统管理')
  await page.getByRole('menuitem', { name: '用户管理', exact: true }).click()
  await expect(page.getByRole('heading', { name: '机构导航' })).toBeVisible()
}

test('用户管理支持机构筛选、批量启停和批量追加角色', async ({ page }) => {
  await openUserManagement(page)

  await page.getByLabel('搜索机构名称或编码').fill('product-operation')
  const organization = page.getByRole('treeitem', { name: '产品运营中心（product-operation）' })
  await expect(organization).toBeVisible()
  await organization.click()

  await expect(page.getByRole('cell', { name: 'operator', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'content-operator', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'admin', exact: true })).toHaveCount(0)

  const operatorRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'operator', exact: true }) })
  await operatorRow.locator('.el-checkbox').click()
  await page.getByRole('button', { name: '批量操作（1）' }).click()
  await page.getByText('批量停用', { exact: true }).click()
  await page.getByRole('dialog', { name: '批量停用' }).getByRole('button', { name: '停用', exact: true }).click()
  await expect(page.getByText('已停用 1 个用户')).toBeVisible()
  await expect(operatorRow.getByText('停用', { exact: true })).toBeVisible()

  await operatorRow.locator('.el-checkbox').click()
  await page.getByRole('button', { name: '批量操作（1）' }).click()
  await page.getByText('批量分配角色', { exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '批量分配角色（已选 1 人）' })
  await expect(dialog.getByText('追加角色', { exact: true })).toBeVisible()
  await dialog.locator('.el-form-item').filter({ hasText: '角色' }).locator('.el-select').click()
  await page.getByRole('option', { name: '访客', exact: true }).click()
  await page.keyboard.press('Escape')
  await dialog.getByRole('button', { name: '保存角色', exact: true }).click()

  await expect(page.getByText('已更新 1 个用户的角色')).toBeVisible()
  await expect(operatorRow).toContainText('运营人员、访客')
  await expect(page.getByRole('button', { name: '批量操作（0）' })).toBeDisabled()
})

test('用户管理在移动端紧凑显示机构筛选并在五档视口下无页面级横向溢出', async ({ page }, testInfo) => {
  await openUserManagement(page)

  await page.setViewportSize({ height: 812, width: 375 })
  await expect(page.getByText('当前机构：全部机构', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '展开机构导航', exact: true })).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByLabel('搜索机构名称或编码')).toBeHidden()
  await expect(page.locator('.lumal-crud-table__query')).toBeHidden()
  await expectNoPageOverflow(page)

  const metrics = await page.evaluate(() => {
    const actionTrigger = document.querySelector('.lumal-schema-table__mobile-actions') as HTMLElement | null
    const toolbarButton = document.querySelector('.lumal-schema-table__toolbar .el-button') as HTMLElement | null
    const firstBodyRow = document.querySelector('.lumal-schema-table__body .el-table__body tbody tr') as HTMLElement | null
    const actionColumn = document.querySelector('.lumal-schema-table__body .el-table__header th.el-table-fixed-column--right') as HTMLElement | null
    return {
      actionColumnWidth: actionColumn?.getBoundingClientRect().width ?? 0,
      actionHeight: actionTrigger?.getBoundingClientRect().height ?? 0,
      rowHeight: firstBodyRow?.getBoundingClientRect().height ?? 0,
      toolbarButtonHeight: toolbarButton?.getBoundingClientRect().height ?? 0,
      cells: [...firstBodyRow?.querySelectorAll('.cell') ?? []].map(cell => ({
        height: cell.getBoundingClientRect().height,
        lineHeight: getComputedStyle(cell).lineHeight,
        children: [...cell.children].map(child => ({
          class: child.className,
          height: child.getBoundingClientRect().height,
          lineHeight: getComputedStyle(child).lineHeight,
        })),
      })),
    }
  })
  await testInfo.attach('mobile-table-metrics', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' })
  expect(metrics.actionHeight).toBeGreaterThan(0)
  expect(metrics.actionHeight).toBeLessThanOrEqual(32)
  expect(metrics.toolbarButtonHeight).toBeGreaterThan(0)
  expect(metrics.toolbarButtonHeight).toBeLessThanOrEqual(32)
  expect(metrics.rowHeight).toBeGreaterThan(0)
  expect(metrics.rowHeight).toBeLessThanOrEqual(52)
  expect(metrics.actionColumnWidth).toBeGreaterThan(0)
  expect(metrics.actionColumnWidth).toBeLessThanOrEqual(84)

  const moreButton = page.locator('.lumal-schema-table__mobile-actions').first()
  await expect(moreButton).toBeVisible()
  await moreButton.click()
  await expect(moreButton).toHaveAttribute('aria-expanded', 'true')
  const viewAction = page.locator('.lumal-schema-table__mobile-actions-popper [data-action="view-user"], .el-popper [data-action="view-user"]').first()
  await expect(viewAction).toBeVisible()
  await viewAction.click()
  const viewDialog = page.getByRole('dialog', { name: '查看' })
  await expect(viewDialog).toBeVisible()
  await viewDialog.getByRole('button', { name: '关闭', exact: true }).click()
  await expect(viewDialog).toBeHidden()

  await page.getByRole('button', { name: '展开机构导航', exact: true }).click()
  await expect(page.getByRole('button', { name: '收起机构导航', exact: true })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByLabel('搜索机构名称或编码')).toBeVisible()
  const treeHeight = await page.locator('.lumal-admin-user-page__organization-tree').evaluate(element => element.getBoundingClientRect().height)
  expect(treeHeight).toBeLessThanOrEqual(160)

  for (const width of [660, 768]) {
    await page.setViewportSize({ height: width === 660 ? 1178 : 900, width })
    await expect(page.getByRole('heading', { name: '机构导航' })).toBeVisible()
    await expect(page.getByRole('button', { name: '收起机构导航', exact: true })).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByLabel('搜索机构名称或编码')).toBeVisible()
    await expectNoPageOverflow(page)
  }

  await page.setViewportSize({ height: 900, width: 1024 })
  await expect(page.locator('.lumal-admin-user-page__organization-toggle')).toHaveCount(0)
  await expect(page.getByLabel('搜索机构名称或编码')).toBeVisible()
  await expect(page.locator('.lumal-crud-table__query')).toBeVisible()
  await expectNoPageOverflow(page)

  await page.setViewportSize({ height: 812, width: 375 })
  await expect(page.getByRole('button', { name: '收起机构导航', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '收起机构导航', exact: true }).click()
  await expect(page.getByLabel('搜索机构名称或编码')).toBeHidden()

  await page.setViewportSize({ height: 900, width: 1024 })
  await expect(page.getByLabel('搜索机构名称或编码')).toBeVisible()
  await page.setViewportSize({ height: 812, width: 375 })
  await expect(page.getByLabel('搜索机构名称或编码')).toBeHidden()

  await page.setViewportSize({ height: 900, width: 1440 })
  await expect(page.getByLabel('搜索机构名称或编码')).toBeVisible()
  await expectNoPageOverflow(page)
})
