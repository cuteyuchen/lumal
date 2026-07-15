import { afterEach, describe, expect, it } from 'vitest'
import { mockCreateSystemUser, mockFetchSystemUsers } from '../domain/system'
import { cleanupSandboxes, createSandbox, deleteSandbox, getSandbox, resetSandbox, withSandbox } from '../utils/sandbox'
import { createSessionId, issueTokens, verifyToken } from '../utils/token'

const createdSandboxes: string[] = []

function createTestSandbox(): string {
  const id = createSessionId()
  createSandbox(id)
  createdSandboxes.push(id)
  return id
}

afterEach(() => {
  createdSandboxes.splice(0).forEach(deleteSandbox)
})

describe('mock sandbox', () => {
  it('隔离不同会话的数据并支持恢复种子', async () => {
    const first = createTestSandbox()
    const second = createTestSandbox()

    await withSandbox(first, () => mockCreateSystemUser({
      nickname: '沙箱用户',
      organizationId: 'organization-3',
      roles: ['guest'],
      status: 'enabled',
      username: 'sandbox-user',
    }))

    const firstResult = await withSandbox(first, () => mockFetchSystemUsers({ page: 1, pageSize: 20, query: { keyword: 'sandbox-user' } }))
    const secondResult = await withSandbox(second, () => mockFetchSystemUsers({ page: 1, pageSize: 20, query: { keyword: 'sandbox-user' } }))
    expect(firstResult.total).toBe(1)
    expect(secondResult.total).toBe(0)

    resetSandbox(first)
    await expect(withSandbox(first, () => mockFetchSystemUsers({ page: 1, pageSize: 20, query: { keyword: 'sandbox-user' } }))).resolves.toMatchObject({ total: 0 })
    await expect(withSandbox(first, () => mockFetchSystemUsers({ page: 1, pageSize: 20, query: { organizationId: 'organization-5' } }))).resolves.toMatchObject({
      items: [
        expect.objectContaining({ id: 'user-2', organizationId: 'organization-5' }),
        expect.objectContaining({ id: 'user-6', organizationId: 'organization-5' }),
      ],
      total: 2,
    })
  })

  it('签发并校验 access 和 refresh JWT', () => {
    const tokens = issueTokens(createSessionId(), 'admin')
    expect(verifyToken(tokens.accessToken, 'access')).toMatchObject({ kind: 'access', sub: 'admin' })
    expect(verifyToken(tokens.refreshToken, 'refresh')).toMatchObject({ kind: 'refresh', sub: 'admin' })
    expect(() => verifyToken(tokens.accessToken, 'refresh')).toThrow('凭据已过期')
  })

  it('清理过期沙箱并在达到容量时淘汰最久未访问会话', () => {
    const expired = createTestSandbox()
    getSandbox(expired).lastAccessedAt = 0
    cleanupSandboxes()
    expect(() => getSandbox(expired)).toThrow('演示会话已失效')

    const oldest = createTestSandbox()
    getSandbox(oldest).lastAccessedAt = 1
    for (let index = 0; index < 500; index += 1) createTestSandbox()
    expect(() => getSandbox(oldest)).toThrow('演示会话已失效')
  })
})
