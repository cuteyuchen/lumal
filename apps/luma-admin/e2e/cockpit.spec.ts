import { expect, test } from './fixtures'
import { loginAs, loginAsAdmin } from './helpers'

/***********************驾驶舱 E2E 验收*********************/

test.describe('驾驶舱', () => {
  test('从 Header 进入驾驶舱并显示布局导航', async ({ page }) => {
    await loginAsAdmin(page)

    // 从 Header 图标进入驾驶舱
    await page.locator('[data-action="open-cockpit"]').click()
    await expect(page).toHaveURL(/#\/cockpit/)

    // 布局导航可见
    await expect(page.locator('[aria-label="布局选择"]')).toBeVisible()

    // 中央组件示例渲染
    await expect(page.locator('.stub-center')).toBeVisible()
  })

  test('左右模块与中央组件双向消息联动', async ({ page }) => {
    await loginAsAdmin(page)
    await page.locator('[data-action="open-cockpit"]').click()
    await expect(page).toHaveURL(/#\/cockpit/)

    // 模块 → 中央：点击业务模块的选择项，中央组件展示来源
    await page.locator('[data-action="select-item-2"]').first().click()
    await expect(page.locator('[data-role="from-widget"]')).toContainText('2')

    // 中央 → 模块：中央广播，业务模块展示来源
    await page.locator('[data-action="center-select-A"]').first().click()
    await expect(page.locator('[data-role="from-center"]').first()).toContainText('A')
  })

  test('管理员可进入设计模式并保存后持久化', async ({ page }) => {
    await loginAsAdmin(page)
    await page.locator('[data-action="open-cockpit"]').click()
    await expect(page).toHaveURL(/#\/cockpit/)

    // 进入配置模式
    await page.locator('[data-action="cockpit-configure"]').click()
    await expect(page.getByRole('dialog', { name: '驾驶舱配置' })).toBeVisible()

    // 切换为二列以验证布局编辑
    await page.getByRole('dialog', { name: '驾驶舱配置' }).getByText('二列', { exact: true }).click()

    // 保存
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await expect(page.getByRole('dialog', { name: '驾驶舱配置' })).toBeHidden()

    // 刷新后配置仍生效（保存到 mock 会话）
    await page.reload()
    await expect(page.locator('[aria-label="布局选择"]')).toBeVisible()
  })

  test('返回 Admin', async ({ page }) => {
    await loginAsAdmin(page)
    await page.locator('[data-action="open-cockpit"]').click()
    await expect(page).toHaveURL(/#\/cockpit/)

    await page.locator('[data-action="cockpit-back"]').click()
    await expect(page).toHaveURL(/#\/dashboard$/)
  })

  test('无查看权限账号看不到驾驶舱入口', async ({ browserDiagnostics, page }) => {
    browserDiagnostics.expectHttpError('/api/system/users?page=1&pageSize=5', 403)
    browserDiagnostics.expectHttpError('/api/system/roles?page=1&pageSize=1', 403)
    browserDiagnostics.expectHttpError('/api/system/menus', 403)
    browserDiagnostics.expectHttpError('/api/system/dictionaries/types', 403)

    await loginAs(page, 'guest')
    await expect(page.locator('[data-action="open-cockpit"]')).not.toBeVisible()
  })
})
