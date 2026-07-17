import { Buffer } from 'node:buffer'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

export interface TokenPayload {
  exp: number
  jti: string
  kind: 'access' | 'refresh'
  sid: string
  sub: string
}

const secret = process.env.MOCK_JWT_SECRET || 'luma-demo-mock-secret-change-me'
const accessTtlSeconds = Number(process.env.MOCK_ACCESS_TTL_SECONDS || 30 * 60)
const refreshTtlSeconds = Number(process.env.MOCK_REFRESH_TTL_SECONDS || 8 * 60 * 60)

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function sign(unsigned: string): string {
  return createHmac('sha256', secret).update(unsigned).digest('base64url')
}

function createToken(payload: TokenPayload): string {
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}`
  return `${unsigned}.${sign(unsigned)}`
}

export function issueTokens(sid: string, username: string) {
  const now = Math.floor(Date.now() / 1000)
  const accessExpiresAt = now + accessTtlSeconds

  return {
    accessToken: createToken({ exp: accessExpiresAt, jti: randomUUID(), kind: 'access', sid, sub: username }),
    expiresAt: accessExpiresAt * 1000,
    refreshToken: createToken({ exp: now + refreshTtlSeconds, jti: randomUUID(), kind: 'refresh', sid, sub: username }),
  }
}

export function verifyToken(token: string, kind: TokenPayload['kind']): TokenPayload {
  const [header, payload, signature] = token.split('.')
  if (!header || !payload || !signature) {
    throw new Error('无效凭据')
  }

  const expected = Buffer.from(sign(`${header}.${payload}`))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('无效凭据')
  }

  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenPayload
  if (parsed.kind !== kind || parsed.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('凭据已过期')
  }
  return parsed
}

export function createSessionId(): string {
  return randomUUID()
}
