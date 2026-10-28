import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { expectNoPageOverflow, loginAsAdmin } from './helpers'

async function openMenuDialog(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: '新增根节点', exact: true }).click()
  const dialog = page.locator('.lumal-menu-dialog')
  await expect(dialog).toBeVisible()
  return dialog
}

async function closeMenuDialog(dialog: Locator): Promise<void> {
  await dialog.locator('.el-dialog__headerbtn').click()
  await expect(dialog).toBeHidden()
}

test('菜单弹窗在桌面端保持宽度、栅格对齐并适配深浅主题', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 })
  await loginAsAdmin(page)
  await page.goto('/#/system/menu')
  await expect(page.getByRole('heading', { name: '菜单管理', exact: true })).toBeVisible()

  let dialog = await openMenuDialog(page)
  const dialogBox = await dialog.boundingBox()
  expect(dialogBox).not.toBeNull()
  expect(dialogBox!.width).toBeCloseTo(960 * 1440 / 1920, 1)
  expect(Math.abs((dialogBox?.x ?? 0) - (1440 - (dialogBox?.width ?? 0)) / 2)).toBeLessThan(2)

  const labelWidths = await dialog.locator('.el-form-item__label').evaluateAll(elements =>
    elements.map(element => Math.round(element.getBoundingClientRect().width)),
  )
  expect(labelWidths.length).toBeGreaterThan(5)
  expect(new Set(labelWidths)).toEqual(new Set([96 * 1440 / 1920]))

  const titleContent = await dialog.locator('[data-field="title"] .el-form-item__content').boundingBox()
  const nameContent = await dialog.locator('[data-field="name"] .el-form-item__content').boundingBox()
  const parentContent = await dialog.locator('[data-field="parentId"] .el-form-item__content').boundingBox()
  const pathContent = await dialog.locator('[data-field="path"] .el-form-item__content').boundingBox()
  expect(Math.abs((titleContent?.x ?? 0) - (nameContent?.x ?? 0))).toBeLessThan(2)
  expect(Math.abs((parentContent?.x ?? 0) - (pathContent?.x ?? 0))).toBeLessThan(2)
  expect(titleContent?.width ?? 0).toBeGreaterThan(300 * 1440 / 1920)

  const lightBackground = await dialog.evaluate(element => getComputedStyle(element).backgroundColor)
  expect(lightBackground).not.toBe('rgba(0, 0, 0, 0)')
  await closeMenuDialog(dialog)

  await page.getByRole('button', { name: '切换深色模式', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  dialog = await openMenuDialog(page)
  const darkBackground = await dialog.evaluate(element => getComputedStyle(element).backgroundColor)
  expect(darkBackground).not.toBe('rgba(0, 0, 0, 0)')
  expect(darkBackground).not.toBe(lightBackground)
  expect((await dialog.boundingBox())!.width).toBeCloseTo(960 * 1440 / 1920, 1)
  await expectNoPageOverflow(page)
})

test('菜单弹窗在 768px 和 375px 下保持双列比例、标签和内容不溢出', async ({ page }) => {
  test.setTimeout(60_000)
  await loginAsAdmin(page)
  await page.goto('/#/system/menu')
  await expect(page.getByRole('heading', { name: '菜单管理', exact: true })).toBeVisible()

  for (const viewport of [
    { height: 900, width: 768 },
    { height: 812, width: 375 },
  ]) {
    await page.setViewportSize(viewport)
    const dialog = await openMenuDialog(page)
    const dialogBox = await dialog.boundingBox()
    expect(dialogBox).not.toBeNull()
    expect(dialogBox?.x ?? -1).toBeGreaterThanOrEqual(0)
    expect((dialogBox?.x ?? 0) + (dialogBox?.width ?? 0)).toBeLessThanOrEqual(viewport.width)
    expect(dialogBox!.width).toBeCloseTo(960 * viewport.width / 1920, 1)

    // 两列必须在同一帧采样，避免把弹窗入场位移误判为栅格错位。
    const [titleItem, parentItem] = await dialog.locator('[data-field="title"], [data-field="parentId"]').evaluateAll(elements =>
      elements.map((element) => {
        const { x, y, width } = element.getBoundingClientRect()
        return { x, y, width }
      }),
    )
    expect(Math.abs(titleItem.y - parentItem.y)).toBeLessThan(1)
    expect(parentItem.x).toBeGreaterThan(titleItem.x + titleItem.width)
    const labelWidth = await dialog.locator('.el-form-item__label').first().evaluate(element => element.getBoundingClientRect().width)
    expect(labelWidth).toBeCloseTo(96 * viewport.width / 1920, 1)

    const bodyOverflow = await dialog.locator('.el-dialog__body').evaluate(element => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }))
    expect(bodyOverflow.scrollWidth).toBe(bodyOverflow.clientWidth)
    await expectNoPageOverflow(page)
    await closeMenuDialog(dialog)
  }
})
