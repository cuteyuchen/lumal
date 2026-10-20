import type { AuthSessionData } from '@lumal/core/auth'
import type { LumalMenuRecord } from '@lumal/core/router'
import type { AccessSnapshot, CurrentUser, PageResult } from './contracts'
import { parseAuthSession } from '@lumal/core/auth'
import { createStandardResponseParser, parsePageResult } from '@lumal/core/request'
import { localMenus, viewComponents } from '../router/views'

export interface HttpAdapter {
  parseResponse: (data: unknown) => unknown
  parseSession: (data: unknown) => AuthSessionData
  parseUser: (data: unknown) => CurrentUser
  parseAccess: (data: unknown) => AccessSnapshot
  parseMenus: (data: unknown) => LumalMenuRecord[]
  parsePage: (data: unknown) => PageResult
  menusPath: string
  configMode?: 'object'
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('后端返回了无效对象')
  return value as Record<string, unknown>
}
function strings(value: unknown): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string'))
    throw new Error('角色和权限必须是字符串数组')
  return value
}
function parseUser(value: unknown): CurrentUser {
  const raw = record(value)
  if (!['id', 'name', 'username'].every(key => typeof raw[key] === 'string' && raw[key]))
    throw new Error('当前用户缺少 id/name/username')
  return { id: String(raw.id), name: String(raw.name), username: String(raw.username) }
}
function parseAccess(value: unknown): AccessSnapshot {
  const raw = record(value)
  return { roles: strings(raw.roles), permissions: strings(raw.permissions) }
}
function parseMenus(value: unknown): LumalMenuRecord[] {
  if (!Array.isArray(value))
    throw new Error('菜单响应必须是数组')
  const visit = (items: unknown[]): LumalMenuRecord[] => items.map((item) => {
    const raw = record(item)
    if (typeof raw.path !== 'string' || !raw.path.startsWith('/'))
      throw new Error('菜单 path 必须是站内绝对路径')
    if (raw.component && (typeof raw.component !== 'string' || !viewComponents[raw.component]))
      throw new Error(`菜单组件不在白名单中：${String(raw.component)}`)
    return {
      path: raw.path,
      name: typeof raw.name === 'string' ? raw.name : undefined,
      component: typeof raw.component === 'string' ? raw.component : undefined,
      redirect: typeof raw.redirect === 'string' ? raw.redirect : undefined,
      meta: raw.meta ? record(raw.meta) : undefined,
      children: Array.isArray(raw.children) ? visit(raw.children) : undefined,
    }
  })
  return visit(value)
}

// 默认直接消费标准 JSON。特定后端包装仅在显式选择的应用 adapter 中处理。
export function createHttpAdapter(name = 'standard'): HttpAdapter {
  const standard: HttpAdapter = {
    parseResponse: value => value,
    parseSession: parseAuthSession,
    parseUser,
    parseAccess,
    parseMenus,
    parsePage: value => Array.isArray(value) ? { items: value, total: value.length } : parsePageResult(value),
    menusPath: '/menus',
  }
  if (name === 'standard')
    return standard
  if (name !== 'lumal-mock')
    throw new Error(`未知 HTTP adapter：${name}`)
  const unwrap = createStandardResponseParser({
    fieldNames: { code: 'statusCode', data: 'result', message: 'resultMsg' },
    successCodes: ['0000'],
    sessionExpiredCodes: ['AUTH_EXPIRED'],
  })
  return {
    ...standard,
    // Lumal Mock 是显式接入示例，不能影响标准模式的协议。
    parseResponse: data => unwrap({ data } as Parameters<typeof unwrap>[0]),
    parseSession: value => parseAuthSession(value, { fieldNames: { accessToken: 'access_token', refreshToken: 'refresh_token', expiresAt: 'expire_time' } }),
    parsePage: value => Array.isArray(value) ? { items: value, total: value.length } : parsePageResult(value, { fieldNames: { items: 'records', total: 'totalNum' } }),
    menusPath: '/menu',
    configMode: 'object',
    parseAccess(value) {
      const access = parseAccess(value)
      // 此后端以 view 权限管理配置更新；只在显式 adapter 中映射应用权限。
      return {
        ...access,
        permissions: access.permissions.includes('system:config:view')
          ? [...new Set([...access.permissions, 'system:config:update'])]
          : access.permissions,
      }
    },
    parseMenus(value) {
      // 参考 Mock 包含图表等额外演示页面，只映射当前预设声明的页面。
      if (!Array.isArray(value))
        throw new Error('Mock 菜单响应必须是数组')
      const supported = new Map(localMenus.map(menu => [menu.component, menu]))
      const visit = (items: unknown[]): LumalMenuRecord[] => items.flatMap((item) => {
        const raw = record(item)
        const component = raw.viewPath === 'system/dict' ? 'system/dictionaries/types' : String(raw.viewPath ?? '')
        const selected = supported.get(component)
        return [
          ...(selected
            ? [{
                ...selected,
                meta: {
                  ...selected.meta,
                  title: String(raw.menuName ?? selected.meta?.title),
                  authority: strings(raw.authCode ?? []),
                },
              }]
            : []),
          ...(Array.isArray(raw.nodes) ? visit(raw.nodes) : []),
        ]
      })
      return visit(value)
    },
  }
}
