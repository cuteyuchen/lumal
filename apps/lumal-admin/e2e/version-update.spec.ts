import { expect, test } from './fixtures'

const nextManifest = {
  buildId: 'e2e-next-0000000-2026-11-04T10:00:00.000Z',
  builtAt: '2026-11-04T10:00:00.000Z',
  commit: 'e2e-next',
  version: '0.1.2-beta',
}

test.describe('版本更新提示', () => {
  test('生产构建发现新版本后提示，可用键盘关闭且不阻断页面', async ({ page }, testInfo) => {
    test.skip(!testInfo.config.metadata?.productionPreview, '仅在生产构建产物中验证')

    await page.route(/\/version\.json$/, route => route.fulfill({
      body: JSON.stringify(nextManifest),
      contentType: 'application/json',
      status: 200,
    }))
    await page.goto('/')

    const dialog = page.getByRole('dialog', { name: '发现新版本' })
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog).toContainText('v0.1.2-beta')
    await expect(dialog).toContainText('未保存的内容将丢失')

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('立即刷新只触发一次完整页面重载', async ({ page }, testInfo) => {
    test.skip(!testInfo.config.metadata?.productionPreview, '仅在生产构建产物中验证')

    let documentRequests = 0
    page.on('request', (request) => {
      if (request.resourceType() === 'document')
        documentRequests += 1
    })
    await page.route(/\/version\.json$/, route => route.fulfill({
      body: JSON.stringify(nextManifest),
      contentType: 'application/json',
      status: 200,
    }))
    await page.goto('/')

    const dialog = page.getByRole('dialog', { name: '发现新版本' })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await Promise.all([
      page.waitForEvent('framenavigated'),
      page.getByRole('button', { name: '立即刷新' }).click(),
    ])

    // 刷新后新页面仍会检测到部署构建与自身不同，说明页面确实重新加载了。
    await expect(page.getByRole('dialog', { name: '发现新版本' })).toBeVisible({ timeout: 10_000 })
    expect(documentRequests).toBe(2)
  })

  test('根路径与 /px/ 各自提供不同构建身份的 version.json', async ({ request }, testInfo) => {
    test.skip(!testInfo.config.metadata?.productionPreview, '仅在生产构建产物中验证')

    const rootResponse = await request.get('/version.json')
    const pxResponse = await request.get('/px/version.json')
    expect(rootResponse.ok()).toBe(true)
    expect(pxResponse.ok()).toBe(true)

    const rootManifest = await rootResponse.json()
    const pxManifest = await pxResponse.json()
    expect(rootManifest.buildId).toBe(`${rootManifest.commit}-${rootManifest.builtAt}`)
    expect(pxManifest.buildId).toBe(`${pxManifest.commit}-${pxManifest.builtAt}`)
    expect(rootManifest.buildId).not.toBe(pxManifest.buildId)
  })
})
