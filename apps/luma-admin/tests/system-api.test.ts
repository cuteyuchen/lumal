import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseAdminPageResponse } from '../src/api/adapters'
import { loginAdmin } from '../src/api/auth'
import { loadAdminMenus } from '../src/api/menu'
import {
  createDictionaryItem,
  createDictionaryType,
  createSystemMenu,
  createSystemOrganization,
  createSystemRole,
  createSystemUser,
  deleteDictionaryItem,
  deleteDictionaryType,
  deleteSystemMenu,
  deleteSystemOrganization,
  deleteSystemRole,
  deleteSystemUser,
  fetchDictionaryItems,
  fetchDictionaryOptions,
  fetchDictionaryTypes,
  fetchSystemMenus,
  fetchSystemOrganizations,
  fetchSystemPermissionTree,
  fetchSystemRoleOptions,
  fetchSystemRolePermissions,
  fetchSystemRoles,
  fetchSystemUsers,
  resetSystemUserPassword,
  updateDictionaryItem,
  updateDictionaryType,
  updateSystemMenu,
  updateSystemOrganization,
  updateSystemRole,
  updateSystemRolePermissions,
  updateSystemUser,
  updateSystemUserRoles,
  updateSystemUserStatus,
} from '../src/api/system'
import { adminPermissionCodes } from '../src/mock/permission'
import {
  resetMockDictionaries,
  resetMockSystemMenus,
  resetMockSystemOrganizations,
  resetMockSystemRoles,
  resetMockSystemUsers,
} from '../src/mock/system'

describe('system mock api', () => {
  beforeEach(() => {
    resetMockDictionaries()
    resetMockSystemMenus()
    resetMockSystemOrganizations()
    resetMockSystemRoles()
    resetMockSystemUsers()
  })

  afterEach(() => {
    resetMockDictionaries()
    resetMockSystemMenus()
    resetMockSystemOrganizations()
    resetMockSystemRoles()
    resetMockSystemUsers()
  })

  it('支持用户分页和关键词、角色、状态查询', async () => {
    const firstPage = await fetchSystemUsers({
      page: 1,
      pageSize: 2,
      query: {},
    })
    const filtered = await fetchSystemUsers({
      page: 1,
      pageSize: 10,
      query: {
        keyword: '运营',
        role: 'operator',
        status: 'enabled',
      },
    })

    expect(firstPage.items).toHaveLength(2)
    expect(firstPage.total).toBe(6)
    expect(filtered.items.map(user => user.username)).toEqual(['operator', 'content-operator'])
  })

  it('支持新增、编辑和删除用户并立即反映到后续查询', async () => {
    const created = await createSystemUser({
      nickname: '测试用户',
      phone: '13900139000',
      roles: ['guest'],
      status: 'enabled',
      username: 'test-user',
    })

    let result = await fetchSystemUsers({
      page: 1,
      pageSize: 10,
      query: { keyword: 'test-user' },
    })
    expect(result.items).toEqual([created])

    const updated = await updateSystemUser(created.id, {
      nickname: '测试用户（已更新）',
      roles: ['operator', 'guest'],
      status: 'disabled',
    })
    expect(updated).toMatchObject({
      nickname: '测试用户（已更新）',
      roles: ['operator', 'guest'],
      status: 'disabled',
      username: 'test-user',
    })

    await deleteSystemUser(created.id)
    result = await fetchSystemUsers({
      page: 1,
      pageSize: 10,
      query: { keyword: 'test-user' },
    })
    expect(result.total).toBe(0)
  })

  it('拒绝重复用户名并提供角色选项', async () => {
    await expect(createSystemUser({
      nickname: '重复管理员',
      roles: ['admin'],
      username: 'admin',
    })).rejects.toThrow('用户名已存在')

    await expect(fetchSystemRoleOptions()).resolves.toEqual([
      { label: '超级管理员', value: 'admin' },
      { label: '运营人员', value: 'operator' },
      { label: '访客', value: 'guest' },
    ])
  })

  it('支持用户启停、角色分配和密码重置并同步到登录账号', async () => {
    await updateSystemUserRoles('user-2', ['operator', 'guest'])
    const roleUpdated = await fetchSystemUsers({
      page: 1,
      pageSize: 10,
      query: { keyword: 'operator' },
    })
    expect(roleUpdated.items.find(user => user.id === 'user-2')?.roles).toEqual(['operator', 'guest'])

    await updateSystemUserStatus('user-2', 'disabled')
    await expect(loginAdmin({ password: 'luma123', username: 'operator' })).rejects.toThrow('账号已停用')

    await updateSystemUserStatus('user-2', 'enabled')
    const resetResult = await resetSystemUserPassword('user-2')
    expect(resetResult.temporaryPassword).toBe('Luma@123456')
    await expect(loginAdmin({ password: 'luma123', username: 'operator' })).rejects.toThrow('账号或密码不正确')
    const loginResult = await loginAdmin({ password: resetResult.temporaryPassword, username: 'operator' })
    expect(loginResult.user.roles).toEqual(['operator', 'guest'])
    expect(loginResult.user.permissions).toEqual(expect.arrayContaining([
      adminPermissionCodes.systemDictUpdate,
      adminPermissionCodes.examplesView,
    ]))
  })

  it('支持角色 CRUD 和基于菜单、按钮生成的权限树', async () => {
    const initial = await fetchSystemRoles({ page: 1, pageSize: 10, query: {} })
    expect(initial.total).toBe(3)

    const created = await createSystemRole({
      code: 'auditor',
      description: '只读审计角色',
      name: '审计员',
      status: 'enabled',
    })
    const updated = await updateSystemRole(created.id, {
      description: '负责系统审计',
      name: '系统审计员',
      status: 'disabled',
    })
    expect(updated).toMatchObject({
      code: 'auditor',
      description: '负责系统审计',
      name: '系统审计员',
      status: 'disabled',
    })

    const tree = await fetchSystemPermissionTree()
    expect(tree.find(node => node.label === '系统管理')?.children?.some(node => node.label === '用户管理')).toBe(true)

    await updateSystemRolePermissions('auditor', [
      adminPermissionCodes.dashboardView,
      adminPermissionCodes.systemUserList,
      adminPermissionCodes.systemUserUpdate,
    ])
    await expect(fetchSystemRolePermissions('auditor')).resolves.toEqual([
      adminPermissionCodes.dashboardView,
      adminPermissionCodes.systemUserList,
      adminPermissionCodes.systemUserUpdate,
    ])

    await deleteSystemRole(created.id)
    await expect(fetchSystemRoles({
      page: 1,
      pageSize: 10,
      query: { keyword: 'auditor' },
    })).resolves.toMatchObject({ total: 0 })
  })

  it('角色授权关系会用于账号下一次登录', async () => {
    await updateSystemRolePermissions('guest', [
      adminPermissionCodes.dashboardView,
      adminPermissionCodes.projectList,
    ])

    const result = await loginAdmin({
      password: 'luma123',
      username: 'guest',
    })

    expect(result.user.permissions).toEqual([
      adminPermissionCodes.dashboardView,
      adminPermissionCodes.projectList,
    ])
    expect(result.session).toMatchObject({
      accessToken: expect.stringContaining('mock-token-guest'),
      refreshToken: 'mock-refresh-guest',
    })
  })

  it('公司分页和菜单异常字段只通过 adapter 转为标准模型', async () => {
    expect(parseAdminPageResponse({
      result: {
        records: [{ enabled: '1', id: '7' }],
        totalNum: '1',
      },
      resultMsg: 'ok',
      statusCode: '0000',
    }, item => ({
      enabled: (item as { enabled: string }).enabled === '1',
      id: Number((item as { id: string }).id),
    }))).toEqual({
      items: [{ enabled: true, id: 7 }],
      total: 1,
    })

    const menus = await loadAdminMenus()
    expect(menus[0]).toMatchObject({
      path: '/dashboard',
      title: '工作台',
    })
  })

  it('保护内置角色不被删除', async () => {
    await expect(deleteSystemRole('role-1')).rejects.toThrow('内置角色不能删除')
  })

  it('支持机构树的新增、移动、编辑和受保护删除', async () => {
    const created = await createSystemOrganization({
      code: 'quality-center',
      email: 'quality@luma.dev',
      leader: '沈言',
      name: '质量中心',
      order: 3,
      parentId: 'organization-1',
      phone: '010-80000006',
      status: 'enabled',
    })
    const child = await createSystemOrganization({
      code: 'quality-automation',
      name: '自动化测试组',
      order: 1,
      parentId: created.id,
      status: 'enabled',
    })

    await expect(deleteSystemOrganization(created.id)).rejects.toThrow('请先删除或移动下级机构')
    await updateSystemOrganization(child.id, {
      name: '质量工程组',
      parentId: 'organization-2',
      status: 'disabled',
    })

    let organizations = await fetchSystemOrganizations()
    expect(findOrganization(organizations, child.id)).toMatchObject({
      name: '质量工程组',
      parentId: 'organization-2',
      status: 'disabled',
    })
    await expect(updateSystemOrganization('organization-1', {
      parentId: 'organization-2',
    })).rejects.toThrow('不能将机构移动到自身或其下级')

    await deleteSystemOrganization(created.id)
    organizations = await fetchSystemOrganizations()
    expect(findOrganization(organizations, created.id)).toBeUndefined()
  })

  it('支持目录、菜单、按钮树的创建、编辑和删除', async () => {
    const directory = await createSystemMenu({
      order: 10,
      parentId: '',
      path: '/audit',
      title: '审计中心',
      type: 'directory',
    })
    const menu = await createSystemMenu({
      component: 'audit/index',
      name: 'AuditIndex',
      order: 1,
      parentId: directory.id,
      path: 'index',
      permissions: ['audit:list'],
      title: '审计日志',
      type: 'menu',
    })
    const button = await createSystemMenu({
      order: 1,
      parentId: menu.id,
      permissions: ['audit:export'],
      title: '导出审计日志',
      type: 'button',
    })

    let menus = await fetchSystemMenus()
    const auditDirectory = findMenu(menus, directory.id)
    expect(auditDirectory?.children?.[0]?.children?.[0]).toMatchObject({
      id: button.id,
      type: 'button',
    })

    let runtimeMenus = await loadAdminMenus()
    expect(findRuntimeMenu(runtimeMenus, '/audit/index')).toMatchObject({
      component: 'audit/index',
      name: 'AuditIndex',
      title: '审计日志',
    })

    await updateSystemMenu(menu.id, {
      component: 'audit/index',
      path: 'index',
      permissions: ['audit:view'],
      title: '审计记录',
      type: 'menu',
    })
    menus = await fetchSystemMenus()
    expect(findMenu(menus, menu.id)).toMatchObject({
      permissions: ['audit:view'],
      title: '审计记录',
    })
    runtimeMenus = await loadAdminMenus()
    expect(findRuntimeMenu(runtimeMenus, '/audit/index')).toMatchObject({
      title: '审计记录',
    })

    const tree = await fetchSystemPermissionTree()
    expect(findPermission(tree, 'audit:export')?.label).toBe('导出审计日志')

    await deleteSystemMenu(directory.id)
    menus = await fetchSystemMenus()
    expect(findMenu(menus, directory.id)).toBeUndefined()
    expect(findMenu(menus, button.id)).toBeUndefined()
    runtimeMenus = await loadAdminMenus()
    expect(findRuntimeMenu(runtimeMenus, '/audit/index')).toBeUndefined()
  })

  it('支持字典类型和字典项维护并生成标准 options', async () => {
    const type = await createDictionaryType({
      code: 'category',
      description: '内容分类',
      name: '内容分类',
      status: 'enabled',
    })
    const item = await createDictionaryItem({
      color: '#7c3aed',
      label: '公告',
      order: 1,
      status: 'enabled',
      typeCode: type.code,
      value: 'notice',
    })

    await expect(fetchDictionaryTypes()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'category', name: '内容分类' }),
    ]))
    await expect(fetchDictionaryItems(type.code)).resolves.toEqual([item])
    await expect(fetchDictionaryOptions(type.code)).resolves.toEqual([
      { color: '#7c3aed', label: '公告', value: 'notice' },
    ])

    await updateDictionaryType(type.id, {
      description: '内容业务分类',
      name: '业务分类',
      status: 'enabled',
    })
    await updateDictionaryItem(item.id, {
      color: '#2563eb',
      label: '系统公告',
      order: 2,
      status: 'enabled',
      value: 'notice',
    })
    await expect(fetchDictionaryOptions(type.code)).resolves.toEqual([
      { color: '#2563eb', label: '系统公告', value: 'notice' },
    ])

    await deleteDictionaryItem(item.id)
    await expect(fetchDictionaryItems(type.code)).resolves.toEqual([])
    await deleteDictionaryType(type.id)
    await expect(fetchDictionaryTypes()).resolves.not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'category' }),
    ]))
  })
})

function findMenu(menus: Awaited<ReturnType<typeof fetchSystemMenus>>, id: string) {
  for (const menu of menus) {
    if (menu.id === id) {
      return menu
    }
    const child = menu.children ? findMenu(menu.children, id) : undefined
    if (child) {
      return child
    }
  }

  return undefined
}

function findOrganization(
  organizations: Awaited<ReturnType<typeof fetchSystemOrganizations>>,
  id: string,
): Awaited<ReturnType<typeof fetchSystemOrganizations>>[number] | undefined {
  for (const organization of organizations) {
    if (organization.id === id) {
      return organization
    }
    const child = organization.children ? findOrganization(organization.children, id) : undefined
    if (child) {
      return child
    }
  }

  return undefined
}

function findPermission(tree: Awaited<ReturnType<typeof fetchSystemPermissionTree>>, permission: string) {
  for (const node of tree) {
    if (node.permissions.includes(permission)) {
      return node
    }
    const child = node.children ? findPermission(node.children, permission) : undefined
    if (child) {
      return child
    }
  }

  return undefined
}

function findRuntimeMenu(menus: Awaited<ReturnType<typeof loadAdminMenus>>, path: string): Awaited<ReturnType<typeof loadAdminMenus>>[number] | undefined {
  for (const menu of menus) {
    if (menu.path === path) {
      return menu
    }
    const child = findRuntimeMenu(menu.children, path)
    if (child) {
      return child
    }
  }

  return undefined
}
