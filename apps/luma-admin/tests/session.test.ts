import { afterEach, describe, expect, it } from 'vitest'
import { permissionStore } from '../src/router'
import {
  adminSession,
  currentUser,
  isAuthenticated,
  login,
  logout,
} from '../src/services/session'

describe('admin session service', () => {
  afterEach(async () => {
    await logout()
  })

  it('admin 登录后会写入 token、当前用户、角色和权限', async () => {
    const user = await login('admin')

    expect(adminSession.getToken()).toContain('admin')
    expect(adminSession.getRefreshToken()).toBe('mock-refresh-admin')
    expect(isAuthenticated()).toBe(true)
    expect(currentUser.value).toMatchObject({
      name: '超级管理员',
      username: 'admin',
    })
    expect(user.permissions).toEqual(expect.arrayContaining([
      'dashboard:view',
      'system:user:list',
      'system:role:list',
      'system:menu:list',
      'system:dict:list',
      'system:config:view',
      'project:list',
      'examples:view',
      'examples:dictionary',
    ]))
    expect(permissionStore.roles).toEqual(['admin'])
    expect(permissionStore.permissions).toEqual(expect.arrayContaining(user.permissions))
  })

  it('登出会清理 token、当前用户、权限和角色', async () => {
    await login('operator')

    await logout()

    expect(adminSession.getToken()).toBe('')
    expect(isAuthenticated()).toBe(false)
    expect(currentUser.value).toBeNull()
    expect(permissionStore.permissions).toEqual([])
    expect(permissionStore.roles).toEqual([])
  })

  it('operator 和 guest 拥有不同访问能力', async () => {
    const operator = await login('operator')

    expect(operator.permissions).toEqual(expect.arrayContaining([
      'dashboard:view',
      'project:list',
      'system:dict:list',
      'system:dict:create',
      'system:dict:update',
      'examples:view',
      'examples:dictionary',
    ]))
    expect(operator.permissions).not.toContain('system:user:list')
    expect(operator.permissions).not.toContain('system:dict:delete')

    await logout()

    const guest = await login('guest')

    expect(guest.permissions).toEqual(expect.arrayContaining([
      'dashboard:view',
      'examples:view',
    ]))
    expect(guest.permissions).not.toContain('project:list')
    expect(guest.permissions).not.toContain('examples:dictionary')
  })
})
