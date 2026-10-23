import type { DataRow } from './contracts'
import type { LocalDatabase } from './local-contracts'
import { localMenus, permissionCodes } from '../router/views'
import { seedMenuRows } from '../stored-menus'

// 仅开发用途。存储和校验不能替代生产后端的认证、授权与密码散列。
export function createLocalDatabase(): LocalDatabase {
  const initial: Record<string, DataRow[]> = {
    users: [
      { id: 'admin', username: 'admin', nickname: '管理员', organizationId: 'root', roles: ['admin'], status: 'enabled', phone: '', createdAt: '', password: 'lumal123' },
      { id: 'guest', username: 'guest', nickname: '访客', organizationId: 'root', roles: ['guest'], status: 'enabled', phone: '', createdAt: '', password: 'lumal123' },
    ],
    roles: [
      { id: 'admin', code: 'admin', name: '管理员', description: '内置管理员', builtIn: true, status: 'enabled', permissions: permissionCodes },
      { id: 'guest', code: 'guest', name: '访客', description: '默认访客', builtIn: true, status: 'enabled', permissions: [] },
    ],
    menus: seedMenuRows(localMenus),
  }
  return {
    read<T extends DataRow>(resource: string, fallback?: () => T[]): T[] {
      const raw = localStorage.getItem(`demo:system:${resource}`)
      const value: unknown = raw ? JSON.parse(raw) : structuredClone(initial[resource] ?? fallback?.() ?? [])
      if (!Array.isArray(value) || value.some(row => !row || typeof row !== 'object' || Array.isArray(row)))
        throw new Error(`本地演示数据损坏：${resource}`)
      return value as T[]
    },
    write(resource, rows) {
      localStorage.setItem(`demo:system:${resource}`, JSON.stringify(rows))
    },
  }
}
