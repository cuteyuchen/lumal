import { expect } from '@playwright/test'

/** 对每个独立系统页面执行真实 UI 操作，Local/HTTP 共用同一套业务断言。 */
export async function verifyScaffoldSystem(page, path, project, api) {
  const dialog = () => page.getByRole('dialog').filter({ visible: true })
  const row = text => page.locator('.el-table__row').filter({ hasText: text })
  const field = (name, scope = dialog()) => scope.locator(`input[name="${name}"]`)
  const save = async (name = '保存') => {
    await dialog().getByRole('button', { name, exact: true }).click()
    await expect(dialog()).toHaveCount(0)
  }
  const select = async (name, label, scope = dialog()) => {
    await scope.locator(`[data-field="${name}"] .el-select`).click()
    await page.getByRole('option', { name: label, exact: true }).click()
    await page.keyboard.press('Escape')
  }
  const remove = async (record, confirm = '删除') => {
    await record.getByRole('button', { name: '删除', exact: true }).click()
    await page.locator('.el-message-box').getByRole('button', { name: confirm, exact: true }).click()
    await expect(record).toHaveCount(0)
    await expect(page.locator('.el-message-box')).not.toBeVisible()
  }
  const visit = async (route, title) => {
    await page.goto(path(route))
    await expect(page.locator('.lumal-page__title').filter({ hasText: title })).toBeVisible()
    await expect(page.locator('.el-loading-mask').filter({ visible: true })).toHaveCount(0)
  }

  // 机构树与用户关联：新增子机构后真实选择它，删除前验证关联保护。
  await visit('/system/organizations', '机构管理')
  await row('总部').getByRole('button', { name: '新增子机构', exact: true }).click()
  await field('name').fill('验收机构')
  await field('code').fill('acceptance')
  await field('leader').fill('验收负责人')
  await save()
  await expect(row('验收机构')).toBeVisible()
  await row('验收机构').getByRole('button', { name: '编辑', exact: true }).click()
  await field('leader').fill('已编辑负责人')
  await save()
  await expect(row('验收机构')).toContainText('已编辑负责人')
  await page.getByLabel('搜索机构', { exact: true }).fill('不存在')
  await expect(page.locator('.el-table__row')).toHaveCount(0)
  await page.getByLabel('搜索机构', { exact: true }).fill('')

  // 角色资料和授权分别保存，回显包含半选父节点。
  await visit('/system/roles', '角色管理')
  await expect(row('管理员').getByRole('button', { name: '删除', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await field('name').fill('验收角色')
  await field('code').fill('acceptance')
  await save()
  await row('验收角色').getByRole('button', { name: '编辑', exact: true }).click()
  await field('name').fill('验收只读角色')
  await save()
  await row('验收只读角色').getByRole('button', { name: '授权', exact: true }).click()
  await expect(dialog().locator('.el-tree-node')).not.toHaveCount(0)
  const roleGroup = dialog().locator('.el-tree-node__content').filter({ hasText: /^角色管理$/ }).locator('..')
  const treeLeaf = roleGroup.locator('.el-tree-node__content').filter({ hasText: /^(查询角色|list)$/ })
  await treeLeaf.locator('.el-checkbox').click()
  await expect(dialog().locator('.el-checkbox__input.is-indeterminate').first()).toBeVisible()
  if (project.apiMode === 'http') {
    api.state.failAuthorization = true
    await dialog().getByRole('button', { name: '保存授权', exact: true }).click()
    await expect(dialog().getByRole('alert')).toContainText('授权保存失败')
    api.state.failAuthorization = false
  }
  await save('保存授权')
  await row('验收只读角色').getByRole('button', { name: '授权', exact: true }).click()
  await expect(dialog().locator('.el-checkbox.is-checked')).toHaveCount(1)
  await expect(dialog().locator('.el-checkbox__input.is-indeterminate').first()).toBeVisible()
  if (project.apiMode === 'http') {
    api.state.failAccess = true
    await dialog().getByRole('button', { name: '保存授权', exact: true }).click()
    await expect(dialog().getByRole('alert')).toContainText('授权已保存，但会话刷新失败')
    api.state.failAccess = false
    await dialog().getByRole('button', { name: '重试刷新', exact: true }).click()
  }
  else {
    await dialog().getByRole('button', { name: '关闭', exact: true }).click()
  }
  await expect(dialog()).toHaveCount(0)

  // 用户 CRUD、机构筛选、角色选择、状态与批量操作。
  await visit('/system/users', '用户管理')
  await expect(row('admin').getByRole('button', { name: '停用', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await field('username').fill('acceptance-user')
  await field('nickname').fill('验收用户')
  await dialog().locator('[data-field="organizationId"] .el-select').click()
  await page.locator('.el-select-dropdown:visible .el-tree-node__content').filter({ hasText: /^验收机构$/ }).click()
  await save()
  await page.locator('input[name="keyword"]').fill('acceptance-user')
  await page.getByRole('button', { name: '查询', exact: true }).click()
  await expect(row('acceptance-user')).toContainText('验收机构')
  await row('acceptance-user').getByRole('button', { name: '查看', exact: true }).click()
  await expect(dialog()).toContainText('验收用户')
  await dialog().getByRole('button', { name: /关闭/ }).last().click()
  await row('acceptance-user').getByRole('button', { name: '编辑', exact: true }).click()
  await field('nickname').fill('已编辑验收用户')
  await save()
  await expect(row('acceptance-user')).toContainText('已编辑验收用户')
  await row('acceptance-user').getByRole('button', { name: '停用', exact: true }).click()
  await expect(row('acceptance-user').getByRole('button', { name: '启用', exact: true })).toBeVisible()
  await row('acceptance-user').locator('.el-checkbox').click()
  await page.getByRole('button', { name: '批量启用', exact: true }).click()
  await expect(row('acceptance-user').getByRole('button', { name: '停用', exact: true })).toBeVisible()
  await row('acceptance-user').getByRole('button', { name: '分配角色', exact: true }).click()
  await select('roles', '验收只读角色')
  await save('保存角色')
  await expect(row('acceptance-user')).toContainText('验收只读角色')
  await page.locator('.user-organizations .el-tree-node__content').filter({ hasText: /^验收机构$/ }).click()
  await expect(row('acceptance-user')).toBeVisible()

  // 菜单目录/页面/按钮具有各自字段规则，页面只能选择本地白名单。
  await visit('/system/menus', '菜单管理')
  await page.getByRole('button', { name: '新增节点', exact: true }).click()
  await select('type', '目录')
  await field('title').fill('验收目录')
  await field('name').fill('Acceptance')
  await field('path').fill('/acceptance')
  await expect(dialog().locator('[data-field="component"]')).toHaveCount(0)
  await save()
  await row('验收目录').getByRole('button', { name: '新增子节点', exact: true }).click()
  await field('title').fill('验收页面')
  await field('name').fill('AcceptancePage')
  await field('path').fill('/acceptance/page')
  await select('component', 'system/users')
  await save()
  await row('验收页面').getByRole('button', { name: '新增子节点', exact: true }).click()
  await field('title').fill('验收按钮')
  await field('permissions').fill('system:user:create')
  await expect(dialog().locator('[data-field="component"]')).toHaveCount(0)
  await expect(dialog().locator('[data-field="path"]')).toHaveCount(0)
  await save()
  await row('验收页面').getByRole('button', { name: '编辑', exact: true }).click()
  await field('title').fill('已编辑验收页面')
  await save()
  await expect(row('已编辑验收页面')).toBeVisible()
  await remove(row('验收按钮'))
  await remove(row('已编辑验收页面'))
  await remove(row('验收目录'))
  await page.getByRole('button', { name: '刷新导航', exact: true }).click()
  await expect(page.locator('.el-message--success').filter({ hasText: '导航与权限已重新加载' })).toBeVisible()

  // 字典分类与字典项独立页面，通过分类入口带查询参数关联。
  await visit('/system/dictionaries/types', '字典分类')
  await page.getByRole('button', { name: '新增分类', exact: true }).click()
  await field('name').fill('验收字典')
  await field('code').fill('acceptance')
  await save()
  await row('验收字典').getByRole('button', { name: '字典项', exact: true }).click()
  await expect(page).toHaveURL(/typeCode=acceptance/)
  await page.getByRole('button', { name: '新增字典项', exact: true }).click()
  await field('label').fill('验收通过')
  await field('value').fill('accepted')
  await save()
  await expect(row('验收通过')).toContainText('acceptance')
  await row('验收通过').getByRole('button', { name: '编辑', exact: true }).click()
  await field('label').fill('已编辑字典项')
  await save()
  await remove(row('已编辑字典项'))
  await visit('/system/dictionaries/types', '字典分类')
  await row('验收字典').getByRole('button', { name: '编辑', exact: true }).click()
  await field('name').fill('已编辑字典')
  await save()
  await remove(row('已编辑字典'))

  // 新角色只获查询角色权限；父级必须跳到角色页而非硬编码用户页。
  await page.getByRole('button', { name: '退出登录', exact: true }).click()
  await page.getByLabel('用户名', { exact: true }).fill('acceptance-user')
  await page.getByLabel('密码', { exact: true }).fill(project.apiMode === 'local' ? 'lumal123' : 'integration-pass')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()
  await visit('/system', '角色管理')
  await expect(page).toHaveURL(/\/system\/roles$/)
  await expect(page.getByRole('menuitem', { name: '用户管理', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '新增', exact: true })).toHaveCount(0)
  await page.goto(path('/system/users'))
  await expect(page).toHaveURL(/\/403$/)
  await page.getByRole('button', { name: '退出登录', exact: true }).click()
  await page.getByLabel('用户名', { exact: true }).fill('admin')
  await page.getByLabel('密码', { exact: true }).fill(project.apiMode === 'local' ? 'lumal123' : 'integration-pass')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()

  // 配置是独立表单；个人资料与密码均验证真实服务结果。
  await visit('/system/config', '系统配置')
  await page.locator('input[name="appName"]').fill('')
  await page.getByRole('button', { name: '保存配置', exact: true }).click()
  await expect(page.locator('.el-form-item__error')).toBeVisible()
  await page.locator('input[name="appName"]').fill('验收应用')
  await page.getByRole('button', { name: '保存配置', exact: true }).click()
  await expect(page.locator('.el-message--success').filter({ hasText: '配置已保存' })).toBeVisible()
  await page.getByRole('button', { name: '重读配置', exact: true }).click()
  await expect(page.locator('input[name="appName"]')).toHaveValue('验收应用')
  if (project.apiMode === 'http') {
    api.state.failConfigSave = true
    await page.locator('input[name="appName"]').fill('不能写入的配置')
    await page.getByRole('button', { name: '保存配置', exact: true }).click()
    await expect(page.locator('.el-alert--error')).toContainText('配置保存失败')
    api.state.failConfigSave = false
    await page.getByRole('button', { name: '重新加载', exact: true }).click()
    await expect(page.locator('input[name="appName"]')).toHaveValue('验收应用')
    await expect(page.locator('.el-alert--error')).toHaveCount(0)
    api.state.failList = true
    await page.getByRole('button', { name: '重读配置', exact: true }).click()
    await expect(page.locator('.el-alert--error')).toContainText('测试网络失败')
    api.state.failList = false
    await page.getByRole('button', { name: '重新加载', exact: true }).click()
    await expect(page.locator('.el-alert--error')).toHaveCount(0)
    await expect(page.locator('input[name="appName"]')).toHaveValue('验收应用')
  }
  await page.getByRole('button', { name: '个人中心', exact: true }).click()
  await page.locator('input[name="nickname"]').fill('验收管理员')
  const profileWrites = api.state.profileWrites
  if (project.apiMode === 'http')
    api.state.failAccess = true
  await page.getByRole('button', { name: '保存资料', exact: true }).click()
  if (project.apiMode === 'http') {
    await expect(page.locator('.el-alert--error')).toContainText('资料已保存，但会话刷新失败')
    await expect(page.getByRole('button', { name: '保存资料', exact: true })).toBeDisabled()
    expect(api.state.profileWrites).toBe(profileWrites + 1)
    api.state.failAccess = false
    await page.getByRole('button', { name: '重试会话刷新', exact: true }).click()
    await expect(page.locator('.el-alert--error')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '保存资料', exact: true })).toBeEnabled()
    expect(api.state.profileWrites).toBe(profileWrites + 1)
    await expect(page.getByRole('menuitem', { name: '系统管理', exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()
  await expect(page.locator('input[name="nickname"]')).toHaveValue('验收管理员')
  await page.getByRole('tab', { name: '修改密码', exact: true }).click()
  await page.locator('input[name="currentPassword"]').fill('wrong-password')
  await page.locator('input[name="newPassword"]').fill('acceptance-pass')
  await page.locator('input[name="confirmPassword"]').fill('acceptance-pass')
  await page.getByRole('button', { name: '更新密码', exact: true }).click()
  await expect(page.locator('.el-alert--error')).toContainText('密码')
  await page.locator('input[name="currentPassword"]').fill(project.apiMode === 'local' ? 'lumal123' : 'integration-pass')
  await page.getByRole('button', { name: '更新密码', exact: true }).click()
  await expect(page.locator('.el-alert--success')).toContainText('密码')

  // 清理引用后才允许删除角色和机构。
  await visit('/system/users', '用户管理')
  await page.locator('input[name="keyword"]').fill('acceptance-user')
  await page.getByRole('button', { name: '查询', exact: true }).click()
  await remove(row('acceptance-user'), '删除')
  await visit('/system/roles', '角色管理')
  await remove(row('验收只读角色'), '删除')
  await visit('/system/organizations', '机构管理')
  await remove(row('验收机构'))
}
