import { expect, test } from './fixtures'
import { loginAs } from './helpers'

/***********************驾驶舱外链验收*********************/

test.describe('驾驶舱外链', () => {
  test('Header 入口引用独立驾驶舱应用', async ({ browserDiagnostics, page }, testInfo) => {
    browserDiagnostics.expectHttpError('/api/system/users?page=1&pageSize=5', 403)
    browserDiagnostics.expectHttpError('/api/system/roles?page=1&pageSize=1', 403)
    browserDiagnostics.expectHttpError('/api/system/menus', 403)

    await loginAs(page, 'operator')

    const link = page.locator('[data-action="open-cockpit"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', testInfo.config.metadata.cockpitUrl ?? 'http://localhost:5180/')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
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
