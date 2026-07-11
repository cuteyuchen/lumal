import type { AuthSessionData } from '@luma/core/auth'
import type { ParseStandardResponseOptions } from '@luma/core/request'
import type { MenuRecordFieldNames, NormalizedMenuNode } from '@luma/core/router'
import type { AdminUser } from '../mock/auth'
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
  return normalizeMenuRecords(parseAdminResponse<Record<string, unknown>[]>(response), {
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
