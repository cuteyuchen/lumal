import type { AuthSessionData } from '@luma/core/auth'
import type { ParseStandardResponseOptions } from '@luma/core/request'
import type { MenuRecordFieldNames, NormalizedMenuNode } from '@luma/core/router'
import type { AdminUser } from './types'
import { parseAuthSession } from '@luma/core/auth'
import { parsePageResult, parseStandardResponse } from '@luma/core/request'
import { normalizeMenuRecords } from '@luma/core/router'

const companyResponseOptions = {
  fieldNames: {
    code: 'statusCode',
    data: 'result',
    message: 'resultMsg',
  },
  sessionExpiredCodes: ['AUTH_EXPIRED'],
  successCodes: ['0000'],
} satisfies Omit<ParseStandardResponseOptions, 'transform'>

const companyMenuFieldNames: MenuRecordFieldNames = {
  authority: 'authCode',
  children: 'nodes',
  component: 'viewPath',
  externalLink: 'url',
  icon: 'menuIcon',
  name: 'routeName',
  order: 'sortNo',
  path: 'routePath',
  title: 'menuName',
}

interface AdminTransportResponseOptions {
  code?: string
  message?: string
}

export interface AdminTransportMenuInput {
  activeMenu?: string
  authority?: string[]
  badge?: string | number
  badgeTone?: string
  badgeType?: 'dot' | 'text'
  children?: AdminTransportMenuInput[]
  component?: string
  externalLink?: string
  externalTarget?: '_blank' | '_self'
  hidden?: boolean
  hideInBreadcrumb?: boolean
  icon?: string
  name: string
  order?: number
  path: string
  redirect?: string
  title: string
  type?: string
}

export function createAdminResponseTransport<TData>(
  data: TData,
  options: AdminTransportResponseOptions = {},
): Record<string, unknown> {
  return {
    result: data,
    resultMsg: options.message ?? 'ok',
    statusCode: options.code ?? '0000',
  }
}

export function createAdminSessionTransport(
  session: AuthSessionData,
  user: AdminUser,
): Record<string, unknown> {
  return createAdminResponseTransport({
    access_token: session.accessToken,
    expire_time: session.expiresAt === undefined ? undefined : String(session.expiresAt),
    refresh_token: session.refreshToken,
    user,
  })
}

export function createAdminPageTransport<TItem>(items: TItem[], total: string | number): Record<string, unknown> {
  return {
    records: items,
    totalNum: total,
  }
}

export function createAdminMenuTransport(record: AdminTransportMenuInput): Record<string, unknown> {
  return {
    authCode: record.authority,
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
    nodes: record.children?.map(createAdminMenuTransport),
    redirect: record.redirect,
    routeName: record.name,
    routePath: record.path,
    sortNo: record.order,
    url: record.externalLink,
    viewPath: record.component,
  }
}

export function parseAdminResponse<TData>(response: unknown): TData {
  return parseStandardResponse<unknown, TData>(response as Record<string, unknown>, companyResponseOptions)
}

export function parseAdminSession(response: unknown): AuthSessionData {
  return parseAuthSession(response, {
    fieldNames: {
      accessToken: 'access_token',
      expiresAt: 'expire_time',
      refreshToken: 'refresh_token',
    },
  })
}

export function parseAdminLoginResponse(response: unknown): { session: AuthSessionData, user: AdminUser } {
  const result = parseAdminResponse<Record<string, unknown>>(response)

  return {
    session: parseAdminSession(result),
    user: result.user as AdminUser,
  }
}

export function parseAdminMenuResponse(response: unknown): NormalizedMenuNode[] {
  return parseAdminMenuData(parseAdminResponse<Record<string, unknown>[]>(response))
}

export function parseAdminMenuData(records: Record<string, unknown>[]): NormalizedMenuNode[] {
  return normalizeMenuRecords(records, {
    fieldNames: companyMenuFieldNames,
  })
}

export function parseAdminPageResponse<TItem>(
  response: unknown,
  transform?: (item: unknown, index: number) => TItem,
) {
  return parsePageResult<TItem>(parseAdminResponse(response), {
    fieldNames: {
      items: 'records',
      total: 'totalNum',
    },
    transform,
  })
}
