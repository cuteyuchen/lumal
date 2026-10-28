import { expect, test } from './fixtures'
import { loginAsAdmin } from './helpers'

test('Schema Form 保持范围日期样式、区块间距并支持图标选择', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/#/examples/schema-form')

  const toolbar = page.locator('.lumal-schema-form-demo__toolbar')
  await expect(toolbar).toBeVisible()
  expect(Number.parseFloat(await toolbar.evaluate(element => getComputedStyle(element).marginBottom)))
    .toBeCloseTo(20 * page.viewportSize()!.width / 1920, 1)

  const rangeInput = page.locator('.el-date-editor--daterange .el-range-input').first()
  await expect(rangeInput).toBeVisible()
  expect(await rangeInput.evaluate(element => getComputedStyle(element).borderStyle)).toBe('none')

  await page.getByRole('button', { name: '选择菜单图标' }).click()
  const picker = page.getByRole('dialog', { name: '选择菜单图标' })
  await expect(picker).toBeVisible()
  await picker.getByRole('listbox', { name: '图标列表' }).getByRole('option').first().click()
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
  await page.locator('.lumal-schema-table__column-options').getByText('状态', { exact: true }).click()
  await page.reload()
  await page.getByLabel('列设置').click()
  await expect(page.locator('.lumal-schema-table__column-options').getByRole('checkbox', { name: '状态', exact: true })).not.toBeChecked()
})

test('CRUD Table 可在弹窗与抽屉编辑器之间切换', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/#/examples/crud-table')

  const toolbar = page.locator('.lumal-schema-table__toolbar')
  const actions = toolbar.locator('.lumal-crud-table__toolbar')
  const tools = toolbar.locator('.lumal-schema-table__toolbar-tools')
  await expect(toolbar.locator('.lumal-schema-table__toolbar-title')).toHaveText('数据列表')
  await expect(actions.getByRole('button', { name: '新增', exact: true })).toBeVisible()
  await expect(tools.getByRole('button', { name: '隐藏筛选条件', exact: true })).toBeVisible()
  await expect(tools.getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  await expect(tools.getByRole('button', { name: '全屏', exact: true })).toBeVisible()
  await expect(tools.getByLabel('列设置', { exact: true })).toBeVisible()
  const desktopToolBoxes = await tools.locator('.el-button.is-circle, .lumal-schema-table__column-settings-trigger').evaluateAll(elements =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { height: rect.height, width: rect.width }
    }),
  )
  for (const box of desktopToolBoxes) {
    expect(box.height).toBeCloseTo(30 * page.viewportSize()!.width / 1920, 1)
    expect(box.width).toBeCloseTo(30 * page.viewportSize()!.width / 1920, 1)
  }

  await actions.getByRole('button', { name: '新增', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '新增' })
  await expect(dialog).toBeVisible()
  const labelWidths = await dialog.locator('.lumal-schema-form__item .el-form-item__label').evaluateAll(labels =>
    labels.map(label => Number.parseFloat(getComputedStyle(label).width)),
  )
  expect(labelWidths.length).toBeGreaterThan(0)
  for (const width of labelWidths)
    expect(width).toBeCloseTo(88 * page.viewportSize()!.width / 1920, 1)
  await dialog.getByRole('button', { name: '取消', exact: true }).click()

  await page.getByRole('button', { name: '编辑器：弹窗' }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  const editor = page.getByRole('dialog', { name: '新增' })
  await expect(editor).toBeVisible()
  await expect(editor).toContainText('状态')
  await expect(editor).toContainText('优先级')
})

test('CRUD Table 收起筛选同行布局并让表格填满剩余高度', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await loginAsAdmin(page)
  await page.goto('/#/examples/crud-table')

  const queryForm = page.locator('.lumal-crud-table__query-form')
  const queryActions = page.locator('.lumal-crud-table__query-actions')
  const formBox = await queryForm.boundingBox()
  const actionsBox = await queryActions.boundingBox()
  expect(formBox).not.toBeNull()
  expect(actionsBox).not.toBeNull()
  expect(Math.abs((formBox?.y ?? 0) + (formBox?.height ?? 0) - (actionsBox?.y ?? 0) - (actionsBox?.height ?? 0))).toBeLessThan(2)

  const crudBox = await page.locator('.lumal-crud-table').boundingBox()
  const tablePanelBox = await page.locator('.lumal-crud-table__table-panel').boundingBox()
  const tableScrollBox = await page.locator('.lumal-schema-table__scroll').boundingBox()
  expect(crudBox).not.toBeNull()
  expect(tablePanelBox).not.toBeNull()
  expect(tableScrollBox?.height ?? 0).toBeGreaterThan(200)
  expect(Math.abs((crudBox?.y ?? 0) + (crudBox?.height ?? 0) - (tablePanelBox?.y ?? 0) - (tablePanelBox?.height ?? 0))).toBeLessThan(2)

  const toggle = page.getByRole('button', { name: '隐藏筛选条件', exact: true })
  await toggle.click()
  await expect(page.locator('.lumal-crud-table__query')).toBeHidden()
  await expect(page.getByRole('button', { name: '显示筛选条件', exact: true })).toBeVisible()
})

test('CRUD Table 在窄视口保持设计布局、同比工具按钮和弹窗交互', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await loginAsAdmin(page)
  await page.goto('/#/examples/crud-table')

  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )).toBe(true)

  const toolbar = page.locator('.lumal-schema-table__toolbar')
  const tools = toolbar.locator('.lumal-schema-table__toolbar-tools')
  const toolbarBox = await toolbar.boundingBox()
  expect(toolbarBox).not.toBeNull()
  expect((toolbarBox?.x ?? 0) + (toolbarBox?.width ?? 0)).toBeLessThanOrEqual(375)
  await expect(page.locator('.lumal-crud-table__pagination .el-pagination__jump')).toBeVisible()
  await expect(page.locator('.lumal-crud-table')).not.toHaveClass(/is-responsive/)

  const refreshBox = await tools.getByRole('button', { name: '刷新', exact: true }).boundingBox()
  const fullscreenBox = await tools.getByRole('button', { name: '全屏', exact: true }).boundingBox()
  const queryToggleBox = await tools.getByRole('button', { name: '隐藏筛选条件', exact: true }).boundingBox()
  for (const box of [queryToggleBox, refreshBox, fullscreenBox]) {
    expect(box).not.toBeNull()
    expect(box!.height).toBeCloseTo(30 * 375 / 1920, 1)
    expect(box!.width).toBeCloseTo(30 * 375 / 1920, 1)
  }

  await toolbar.getByRole('button', { name: '新增', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '新增' })
  const dialogPanel = page.locator('.lumal-crud-table__dialog')
  await expect(dialogPanel).toBeVisible()
  const dialogBox = await dialogPanel.boundingBox()
  expect(dialogBox).not.toBeNull()
  expect(dialogBox?.width ?? 0).toBeLessThanOrEqual(351)

  const nameField = dialog.locator('.lumal-schema-form__item').filter({ hasText: '名称' }).first()
  const labelBox = await nameField.locator('.el-form-item__label').boundingBox()
  const contentBox = await nameField.locator('.el-form-item__content').boundingBox()
  expect(labelBox).not.toBeNull()
  expect(contentBox).not.toBeNull()
  expect(labelBox!.width).toBeCloseTo(88 * 375 / 1920, 1)
  expect(labelBox!.x + labelBox!.width).toBeCloseTo(contentBox!.x, 1)
  expect(Math.abs(labelBox!.y - contentBox!.y)).toBeLessThan(1)

  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(dialogPanel).toBeHidden()
})
