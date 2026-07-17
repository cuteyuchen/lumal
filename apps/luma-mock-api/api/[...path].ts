import type { AdminLoginRequest, AdminUser } from '../domain/auth'
import type {
  SaveSystemDictionaryItemInput,
  SaveSystemDictionaryTypeInput,
  SaveSystemMenuInput,
  SaveSystemOrganizationInput,
  SaveSystemRoleInput,
  SaveSystemUserInput,
  SystemMenuRecord,
  SystemUserRoleBatchMode,
} from '../domain/system'
import {
  defineEventHandler,
  getHeader,
  getMethod,
  getQuery,
  getRouterParam,
  readBody,
  readMultipartFormData,
  setHeader,
  setResponseStatus,
} from 'h3'
import {
  adminAccountOptions,
  changeMockAccountPassword,
  mockAccounts,
  verifyMockAccount,
} from '../domain/auth'
import {
  mockBatchUpdateSystemUserRoles,
  mockBatchUpdateSystemUserStatus,
  mockCreateDictionaryItem,
  mockCreateDictionaryType,
  mockCreateSystemMenu,
  mockCreateSystemOrganization,
  mockCreateSystemRole,
  mockCreateSystemUser,
  mockDeleteDictionaryItem,
  mockDeleteDictionaryType,
  mockDeleteSystemMenu,
  mockDeleteSystemOrganization,
  mockDeleteSystemRole,
  mockDeleteSystemUser,
  mockFetchDictionaryItems,
  mockFetchDictionaryOptions,
  mockFetchDictionaryTypes,
  mockFetchSystemMenus,
  mockFetchSystemOrganizationOptions,
  mockFetchSystemOrganizations,
  mockFetchSystemPermissionTree,
  mockFetchSystemRoleOptions,
  mockFetchSystemRolePermissions,
  mockFetchSystemRoles,
  mockFetchSystemUsers,
  mockResetSystemUserPassword,
  mockUpdateDictionaryItem,
  mockUpdateDictionaryType,
  mockUpdateSystemMenu,
  mockUpdateSystemOrganization,
  mockUpdateSystemRole,
  mockUpdateSystemRolePermissions,
  mockUpdateSystemUser,
  mockUpdateSystemUserRoles,
  mockUpdateSystemUserStatus,
} from '../domain/system'
import { ApiError, fail, ok, page } from '../utils/http'
import {
  createSandbox,
  deleteSandbox,
  getSandbox,
  resetSandbox,
  withSandbox,
} from '../utils/sandbox'
import { createSessionId, issueTokens, verifyToken } from '../utils/token'

interface AuthContext {
  sid: string
  user: AdminUser
}

interface RateEntry {
  count: number
  resetAt: number
}

const rateBuckets = new Map<string, RateEntry>()

function checkRateLimit(key: string, limit: number): void {
  const now = Date.now()
  const entry = rateBuckets.get(key)
  if (!entry || entry.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 })
    return
  }
  entry.count += 1
  if (entry.count > limit)
    throw new ApiError('请求过于频繁，请稍后重试', 429, 'RATE_LIMITED')
}

function getCurrentAccount(username: string) {
  return Object.values(mockAccounts).find(account => account.username === username)
}

function requirePermission(user: AdminUser, permission: string): void {
  if (!user.permissions.includes(permission)) {
    throw new ApiError('无权限执行当前操作', 403, 'FORBIDDEN')
  }
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function readRequiredBody<T>(event: Parameters<typeof readBody>[0]): Promise<T> {
  const body = await readBody<T>(event)
  if (body === undefined || body === null)
    throw new ApiError('请求体不能为空')
  return body as T
}

function toMenuTransport(record: SystemMenuRecord): Record<string, unknown> {
  return {
    authCode: record.permissions?.length ? record.permissions : record.permission ? [record.permission] : undefined,
    menuIcon: record.icon,
    menuName: record.title,
    menuType: record.type,
    meta: {
      activeMenu: record.activeMenu,
      badge: record.badge,
      badgeTone: record.badgeTone,
      badgeType: record.badgeType,
      externalTarget: record.externalTarget,
      hideInBreadcrumb: record.hideInBreadcrumb,
      hideInMenu: record.hidden,
    },
    nodes: record.children?.filter(child => child.type !== 'button').map(toMenuTransport),
    redirect: record.redirect,
    routeName: record.name || record.id,
    routePath: record.path,
    sortNo: record.order,
    url: record.externalLink,
    viewPath: record.component,
  }
}

function authFromHeader(event: Parameters<typeof getHeader>[0], kind: 'access' | 'refresh' = 'access') {
  const authorization = getHeader(event, 'authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  if (!token)
    throw new ApiError('缺少访问凭据', 401, 'AUTH_EXPIRED')
  try {
    return verifyToken(token, kind)
  }
  catch {
    throw new ApiError('访问凭据已失效', 401, 'AUTH_EXPIRED')
  }
}

async function authenticate(event: Parameters<typeof getHeader>[0]): Promise<AuthContext> {
  const payload = authFromHeader(event)
  getSandbox(payload.sid)
  return withSandbox(payload.sid, () => {
    const account = getCurrentAccount(payload.sub)
    if (!account || !account.enabled)
      throw new ApiError('当前账号已失效', 401, 'AUTH_EXPIRED')
    return { sid: payload.sid, user: structuredClone(account.user) }
  })
}

function configureCors(event: Parameters<typeof setHeader>[0]): void {
  const origin = getHeader(event, 'origin')
  const allowed = (process.env.MOCK_CORS_ORIGINS || '').split(',').map(item => item.trim()).filter(Boolean)
  if (origin && allowed.length && !allowed.includes(origin)) {
    throw new ApiError('当前来源不允许访问演示接口', 403, 'FORBIDDEN')
  }
  setHeader(event, 'Access-Control-Allow-Origin', origin || '*')
  setHeader(event, 'Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Request-Id')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  setHeader(event, 'Vary', 'Origin')
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const method = getMethod(event)
  const path = `/${getRouterParam(event, 'path') || ''}`.replace(/\/$/, '') || '/'
  const ip = (getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || 'unknown').split(',')[0]!.trim()

  try {
    configureCors(event)
    if (method === 'OPTIONS') {
      setResponseStatus(event, 204)
      return null
    }

    checkRateLimit(`all:${ip}`, Number(process.env.MOCK_RATE_LIMIT || 120))

    if (method === 'GET' && path === '/status') {
      return ok({ service: 'luma-mock-api', status: 'ok' })
    }
    if (method === 'GET' && path === '/auth/accounts') {
      return ok(adminAccountOptions)
    }
    if (method === 'POST' && path === '/auth/login') {
      checkRateLimit(`login:${ip}`, Number(process.env.MOCK_LOGIN_RATE_LIMIT || 10))
      const body = await readRequiredBody<AdminLoginRequest>(event)
      const sid = createSessionId()
      createSandbox(sid)
      try {
        const result = await withSandbox(sid, () => verifyMockAccount(body))
        const tokens = issueTokens(sid, result.user.username)
        return ok({
          access_token: tokens.accessToken,
          expire_time: String(tokens.expiresAt),
          refresh_token: tokens.refreshToken,
          user: result.user,
        })
      }
      catch (error) {
        deleteSandbox(sid)
        throw error
      }
    }
    if (method === 'POST' && path === '/auth/refresh') {
      const body = await readRequiredBody<{ refreshToken?: string }>(event)
      if (!body.refreshToken)
        throw new ApiError('缺少刷新凭据', 401, 'AUTH_EXPIRED')
      let payload
      try {
        payload = verifyToken(body.refreshToken, 'refresh')
        getSandbox(payload.sid)
      }
      catch {
        throw new ApiError('刷新凭据已失效', 401, 'AUTH_EXPIRED')
      }
      const tokens = issueTokens(payload.sid, payload.sub)
      return ok({
        access_token: tokens.accessToken,
        expire_time: String(tokens.expiresAt),
        refresh_token: tokens.refreshToken,
      })
    }

    const auth = await authenticate(event)

    if (method === 'POST' && path === '/auth/logout') {
      deleteSandbox(auth.sid)
      return ok(null)
    }
    if (method === 'POST' && path === '/session/reset') {
      resetSandbox(auth.sid)
      return ok(null)
    }
    if (method === 'GET' && path === '/session/me') {
      return ok(auth.user)
    }

    return await withSandbox(auth.sid, async (sandbox) => {
      if (method === 'GET' && path === '/menu') {
        const menus = await mockFetchSystemMenus()
        return ok(menus.filter(menu => menu.type !== 'button').map(toMenuTransport))
      }

      if (method === 'POST' && path === '/upload') {
        const parts = await readMultipartFormData(event)
        const file = parts?.find(part => part.filename)
        if (!file?.data || !file.filename)
          throw new ApiError('请选择上传文件')
        if (file.data.byteLength > 5 * 1024 * 1024)
          throw new ApiError('演示文件不能超过 5MB')
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
        if (file.type && !allowedTypes.includes(file.type))
          throw new ApiError('演示接口不支持当前文件类型')
        return ok({ name: file.filename, size: file.data.byteLength, type: file.type || 'application/octet-stream', url: `/demo-uploads/${encodeURIComponent(file.filename)}` })
      }

      if (path === '/profile' && method === 'GET') {
        const result = await mockFetchSystemUsers({ page: 1, pageSize: 100, query: { keyword: auth.user.username } })
        const user = result.items.find(item => item.username === auth.user.username)
        if (!user)
          throw new ApiError('当前用户资料不存在', 404, 'NOT_FOUND')
        return ok(user)
      }
      if (path === '/profile' && method === 'PUT') {
        const body = await readRequiredBody<{ nickname?: unknown, phone?: unknown }>(event)
        const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : ''
        const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
        if (!nickname)
          throw new ApiError('昵称不能为空')
        if (nickname.length > 32)
          throw new ApiError('昵称不能超过 32 个字符')
        if (phone && !/^1\d{10}$/.test(phone))
          throw new ApiError('请输入正确的 11 位手机号')
        const result = await mockFetchSystemUsers({ page: 1, pageSize: 100, query: { keyword: auth.user.username } })
        const user = result.items.find(item => item.username === auth.user.username)
        if (!user)
          throw new ApiError('当前用户资料不存在', 404, 'NOT_FOUND')
        return ok(await mockUpdateSystemUser(user.id, { ...user, nickname, phone }))
      }
      if (path === '/profile/password' && method === 'PUT') {
        const body = await readRequiredBody<{ currentPassword?: string, newPassword?: string }>(event)
        if (!body.currentPassword || !body.newPassword || body.newPassword.length < 8 || body.newPassword.length > 32) {
          throw new ApiError('新密码长度需为 8 到 32 位')
        }
        changeMockAccountPassword(auth.user.username, body.currentPassword, body.newPassword)
        return ok(null)
      }

      if (path === '/system/config' && method === 'GET')
        return ok(sandbox.config)
      if (path === '/system/config' && method === 'PUT') {
        requirePermission(auth.user, 'system:config:view')
        const body = await readRequiredBody<typeof sandbox.config>(event)
        sandbox.config = { ...sandbox.config, ...body }
        return ok(sandbox.config)
      }
      if (path === '/system/config/restore' && method === 'POST') {
        requirePermission(auth.user, 'system:config:view')
        sandbox.config = {
          appName: 'Luma Admin',
          colorPrimary: '#1677ff',
          layout: 'mixed-nav',
          tabbarEnable: true,
          transitionEnable: true,
        }
        return ok(sandbox.config)
      }

      // 驾驶舱配置：GET 供运行态加载（仅需登录），PUT 需编辑权限
      if (path === '/cockpit/config' && method === 'GET')
        return ok(sandbox.cockpitConfig)
      if (path === '/cockpit/config' && method === 'PUT') {
        requirePermission(auth.user, 'cockpit:edit')
        const body = await readRequiredBody<Record<string, unknown>>(event)
        sandbox.cockpitConfig = { ...body }
        return ok(sandbox.cockpitConfig)
      }

      const query = getQuery(event)
      if (path === '/system/users' && method === 'GET') {
        requirePermission(auth.user, 'system:user:list')
        const result = await mockFetchSystemUsers({
          page: toNumber(query.page, 1),
          pageSize: toNumber(query.pageSize, 10),
          query: {
            keyword: String(query.keyword || ''),
            organizationId: String(query.organizationId || ''),
            role: String(query.roles || ''),
            status: query.status as '' | 'disabled' | 'enabled',
          },
        })
        return page(result.items, result.total)
      }
      if (path === '/system/users' && method === 'POST') {
        requirePermission(auth.user, 'system:user:create')
        return ok(await mockCreateSystemUser(await readRequiredBody<SaveSystemUserInput>(event)))
      }
      if (path === '/system/users/batch/status' && method === 'PATCH') {
        requirePermission(auth.user, 'system:user:status')
        const body = await readRequiredBody<{ ids: string[], status: 'disabled' | 'enabled' }>(event)
        return ok(await mockBatchUpdateSystemUserStatus(body.ids, body.status))
      }
      if (path === '/system/users/batch/roles' && method === 'PUT') {
        requirePermission(auth.user, 'system:user:assign-roles')
        const body = await readRequiredBody<{ ids: string[], mode: SystemUserRoleBatchMode, roles: string[] }>(event)
        return ok(await mockBatchUpdateSystemUserRoles(body.ids, body.roles, body.mode))
      }
      let match = path.match(/^\/system\/users\/([^/]+)$/)
      if (match && method === 'PUT') {
        requirePermission(auth.user, 'system:user:update')
        return ok(await mockUpdateSystemUser(match[1]!, await readRequiredBody<SaveSystemUserInput>(event)))
      }
      if (match && method === 'DELETE') {
        requirePermission(auth.user, 'system:user:delete')
        await mockDeleteSystemUser(match[1]!)
        return ok(null)
      }
      match = path.match(/^\/system\/users\/([^/]+)\/(status|roles|reset-password)$/)
      if (match && match[2] === 'status' && method === 'PATCH') {
        requirePermission(auth.user, 'system:user:status')
        const body = await readRequiredBody<{ status: 'disabled' | 'enabled' }>(event)
        return ok(await mockUpdateSystemUserStatus(match[1]!, body.status))
      }
      if (match && match[2] === 'roles' && method === 'PUT') {
        requirePermission(auth.user, 'system:user:assign-roles')
        const body = await readRequiredBody<{ roles: string[] }>(event)
        return ok(await mockUpdateSystemUserRoles(match[1]!, body.roles))
      }
      if (match && match[2] === 'reset-password' && method === 'POST') {
        requirePermission(auth.user, 'system:user:reset-password')
        return ok(await mockResetSystemUserPassword(match[1]!))
      }

      if (path === '/system/roles/options' && method === 'GET')
        return ok(await mockFetchSystemRoleOptions())
      if (path === '/system/roles' && method === 'GET') {
        requirePermission(auth.user, 'system:role:list')
        const result = await mockFetchSystemRoles({
          page: toNumber(query.page, 1),
          pageSize: toNumber(query.pageSize, 10),
          query: { keyword: String(query.keyword || ''), status: query.status as '' | 'disabled' | 'enabled' },
        })
        return page(result.items, result.total)
      }
      if (path === '/system/roles' && method === 'POST') {
        requirePermission(auth.user, 'system:role:create')
        return ok(await mockCreateSystemRole(await readRequiredBody<SaveSystemRoleInput>(event)))
      }
      match = path.match(/^\/system\/roles\/([^/]+)$/)
      if (match && method === 'PUT') {
        requirePermission(auth.user, 'system:role:update')
        return ok(await mockUpdateSystemRole(match[1]!, await readRequiredBody<SaveSystemRoleInput>(event)))
      }
      if (match && method === 'DELETE') {
        requirePermission(auth.user, 'system:role:delete')
        await mockDeleteSystemRole(match[1]!)
        return ok(null)
      }
      if (path === '/system/permissions/tree' && method === 'GET')
        return ok(await mockFetchSystemPermissionTree())
      match = path.match(/^\/system\/roles\/([^/]+)\/permissions$/)
      if (match && method === 'GET')
        return ok(await mockFetchSystemRolePermissions(match[1]!))
      if (match && method === 'PUT') {
        requirePermission(auth.user, 'system:role:authorize')
        const body = await readRequiredBody<{ permissions: string[] }>(event)
        return ok(await mockUpdateSystemRolePermissions(match[1]!, body.permissions))
      }

      if (path === '/system/organizations' && method === 'GET') {
        requirePermission(auth.user, 'system:organization:list')
        return ok(await mockFetchSystemOrganizations())
      }
      if (path === '/system/organizations/options' && method === 'GET') {
        requirePermission(auth.user, 'system:user:list')
        return ok(await mockFetchSystemOrganizationOptions())
      }
      if (path === '/system/organizations' && method === 'POST') {
        requirePermission(auth.user, 'system:organization:create')
        return ok(await mockCreateSystemOrganization(await readRequiredBody<SaveSystemOrganizationInput>(event)))
      }
      match = path.match(/^\/system\/organizations\/([^/]+)$/)
      if (match && method === 'PUT') {
        requirePermission(auth.user, 'system:organization:update')
        return ok(await mockUpdateSystemOrganization(match[1]!, await readRequiredBody<SaveSystemOrganizationInput>(event)))
      }
      if (match && method === 'DELETE') {
        requirePermission(auth.user, 'system:organization:delete')
        await mockDeleteSystemOrganization(match[1]!)
        return ok(null)
      }

      if (path === '/system/menus' && method === 'GET') {
        requirePermission(auth.user, 'system:menu:list')
        return ok(await mockFetchSystemMenus())
      }
      if (path === '/system/menus' && method === 'POST') {
        requirePermission(auth.user, 'system:menu:create')
        return ok(await mockCreateSystemMenu(await readRequiredBody<SaveSystemMenuInput>(event)))
      }
      match = path.match(/^\/system\/menus\/([^/]+)$/)
      if (match && method === 'PUT') {
        requirePermission(auth.user, 'system:menu:update')
        return ok(await mockUpdateSystemMenu(match[1]!, await readRequiredBody<SaveSystemMenuInput>(event)))
      }
      if (match && method === 'DELETE') {
        requirePermission(auth.user, 'system:menu:delete')
        await mockDeleteSystemMenu(match[1]!)
        return ok(null)
      }

      if (path === '/system/dictionaries/types' && method === 'GET') {
        requirePermission(auth.user, 'system:dict:list')
        return ok(await mockFetchDictionaryTypes())
      }
      if (path === '/system/dictionaries/types' && method === 'POST') {
        requirePermission(auth.user, 'system:dict:create')
        return ok(await mockCreateDictionaryType(await readRequiredBody<SaveSystemDictionaryTypeInput>(event)))
      }
      match = path.match(/^\/system\/dictionaries\/types\/([^/]+)$/)
      if (match && method === 'PUT') {
        requirePermission(auth.user, 'system:dict:update')
        return ok(await mockUpdateDictionaryType(match[1]!, await readRequiredBody<SaveSystemDictionaryTypeInput>(event)))
      }
      if (match && method === 'DELETE') {
        requirePermission(auth.user, 'system:dict:delete')
        await mockDeleteDictionaryType(match[1]!)
        return ok(null)
      }
      if (path === '/system/dictionaries/items' && method === 'GET') {
        requirePermission(auth.user, 'system:dict:list')
        return ok(await mockFetchDictionaryItems(String(query.typeCode || '')))
      }
      if (path === '/system/dictionaries/items' && method === 'POST') {
        requirePermission(auth.user, 'system:dict:create')
        return ok(await mockCreateDictionaryItem(await readRequiredBody<SaveSystemDictionaryItemInput>(event)))
      }
      match = path.match(/^\/system\/dictionaries\/items\/([^/]+)$/)
      if (match && method === 'PUT') {
        requirePermission(auth.user, 'system:dict:update')
        return ok(await mockUpdateDictionaryItem(match[1]!, await readRequiredBody<SaveSystemDictionaryItemInput>(event)))
      }
      if (match && method === 'DELETE') {
        requirePermission(auth.user, 'system:dict:delete')
        await mockDeleteDictionaryItem(match[1]!)
        return ok(null)
      }
      match = path.match(/^\/system\/dictionaries\/options\/([^/]+)$/)
      if (match && method === 'GET')
        return ok(await mockFetchDictionaryOptions(match[1]!))

      throw new ApiError('接口不存在', 404, 'NOT_FOUND')
    })
  }
  catch (error) {
    return fail(event, error)
  }
  finally {
    // eslint-disable-next-line no-console
    console.info(`[luma-mock-api] ${method} ${path} ${Date.now() - startedAt}ms`)
  }
})
