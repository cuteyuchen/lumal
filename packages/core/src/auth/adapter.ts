import type { AuthSessionData, ParseAuthSessionOptions } from './types'

export function parseAuthSession(
  response: unknown,
  options: ParseAuthSessionOptions = {},
): AuthSessionData {
  const source = options.parseResponse ? options.parseResponse(response) : response

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new TypeError('会话响应格式不正确')
  }

  const record = source as Record<string, unknown>
  const accessToken = record[options.fieldNames?.accessToken ?? 'accessToken']
  const refreshToken = record[options.fieldNames?.refreshToken ?? 'refreshToken']
  const rawExpiresAt = record[options.fieldNames?.expiresAt ?? 'expiresAt']
  const expiresAt = rawExpiresAt === undefined || rawExpiresAt === null ? undefined : Number(rawExpiresAt)

  if (typeof accessToken !== 'string' || !accessToken) {
    throw new TypeError('会话响应缺少有效的 accessToken')
  }

  const session: AuthSessionData = {
    accessToken,
    ...(typeof refreshToken === 'string' && refreshToken ? { refreshToken } : {}),
    ...(expiresAt !== undefined && Number.isFinite(expiresAt) ? { expiresAt } : {}),
  }

  return options.transform ? options.transform(session) : session
}
