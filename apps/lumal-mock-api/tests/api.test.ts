import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createServer } from 'node:http'
import { createApp, eventHandler, getRequestURL, toNodeListener } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import apiHandler from '../routes/api/[...path]'
import { updateMockAccountRoles } from '../domain/auth'
import { setMockRolePermissions } from '../domain/permission'
import { withSandbox } from '../utils/sandbox'
import { verifyToken } from '../utils/token'

interface Envelope<T> {
  result: T
  resultMsg: string
  statusCode: string
}

interface LoginResult {
  access_token: string
}

let baseUrl = ''
let server: Server

beforeAll(async () => {
  const app = createApp()
  app.use(eventHandler((event) => {
    event.context.params = {
      path: getRequestURL(event).pathname.replace(/^\/api\/?/, ''),
    }
    return apiHandler(event)
  }))
  server = createServer(toNodeListener(app))
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}/api`
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
  })
})

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ body: Envelope<T>, status: number }> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  return {
    body: await response.json() as Envelope<T>,
    status: response.status,
  }
}

async function login(): Promise<string> {
  const response = await request<LoginResult>('/auth/login', {
    body: JSON.stringify({ account: 'admin', password: 'lumal123', username: 'admin' }),
    method: 'POST',
  })
  expect(response.status).toBe(200)
  return response.body.result.access_token
}

function authenticated(token: string, method = 'GET', body?: unknown): RequestInit {
  return {
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: { Authorization: `Bearer ${token}` },
    method,
  }
}

describe('system organization and batch user API', () => {
  it('仅凭用户列表权限即可读取精简机构树，但不能读取机构管理数据', async () => {
    const token = await login()
    const sid = verifyToken(token, 'access').sid
    await withSandbox(sid, () => {
      setMockRolePermissions('user-list-only', ['system:user:list'])
      updateMockAccountRoles('admin', ['user-list-only'])
    })

    const options = await request<Array<Record<string, unknown>>>(
      '/system/organizations/options',
      authenticated(token),
    )
    expect(options.status).toBe(200)
    expect(options.body.result[0]).toMatchObject({
      disabled: false,
      label: 'Lumal 总部（lumal-headquarters）',
      value: 'organization-1',
    })

    const organizations = await request(
      '/system/organizations',
      authenticated(token),
    )
    expect(organizations.status).toBe(403)
    expect(organizations.body).toMatchObject({ statusCode: 'FORBIDDEN' })
  })

  it('按机构子树查询用户并通过批量接口返回去重后的更新结果', async () => {
    const token = await login()
    const users = await request<{ records: Array<{ id: string }>, totalNum: number }>(
      '/system/users?page=1&pageSize=20&organizationId=organization-2',
      authenticated(token),
    )
    expect(users.body.result).toEqual({
      records: [
        expect.objectContaining({ id: 'user-4' }),
        expect.objectContaining({ id: 'user-5' }),
      ],
      totalNum: 2,
    })

    const statusResult = await request<{ items: Array<{ id: string, status: string }>, updated: number }>(
      '/system/users/batch/status',
      authenticated(token, 'PATCH', {
        ids: ['user-2', 'user-2', 'user-6'],
        status: 'disabled',
      }),
    )
    expect(statusResult.status).toBe(200)
    expect(statusResult.body.result).toEqual({
      items: [
        expect.objectContaining({ id: 'user-2', status: 'disabled' }),
        expect.objectContaining({ id: 'user-6', status: 'disabled' }),
      ],
      updated: 2,
    })

    const roleResult = await request<{ items: Array<{ id: string, roles: string[] }>, updated: number }>(
      '/system/users/batch/roles',
      authenticated(token, 'PUT', {
        ids: ['user-2', 'user-6'],
        mode: 'append',
        roles: ['guest'],
      }),
    )
    expect(roleResult.status).toBe(200)
    expect(roleResult.body.result).toEqual({
      items: [
        expect.objectContaining({ id: 'user-2', roles: ['operator', 'guest'] }),
        expect.objectContaining({ id: 'user-6', roles: ['operator', 'guest'] }),
      ],
      updated: 2,
    })
  })

  it('批量请求含无效用户时不更新任何合法用户', async () => {
    const token = await login()
    const failed = await request(
      '/system/users/batch/roles',
      authenticated(token, 'PUT', {
        ids: ['user-1', 'missing-user'],
        mode: 'replace',
        roles: ['guest'],
      }),
    )
    expect(failed.status).toBe(404)
    expect(failed.body).toMatchObject({ statusCode: 'NOT_FOUND' })

    const users = await request<{ records: Array<{ id: string, roles: string[] }> }>(
      '/system/users?page=1&pageSize=20',
      authenticated(token),
    )
    expect(users.body.result.records.find(user => user.id === 'user-1')?.roles).toEqual(['admin'])
  })
})
