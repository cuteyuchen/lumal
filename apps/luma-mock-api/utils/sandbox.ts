import type { AdminAccountKey, MockAccount } from '../domain/auth'
import type { MockSystemState } from '../domain/system'
import { exportMockAccounts, importMockAccounts, resetMockAccounts } from '../domain/auth'
import { exportMockRolePermissions, importMockRolePermissions, resetMockRolePermissions } from '../domain/permission'
import {
  exportMockSystemState,
  importMockSystemState,
  resetMockDictionaries,
  resetMockSystemMenus,
  resetMockSystemOrganizations,
  resetMockSystemRoles,
  resetMockSystemUsers,
} from '../domain/system'
import { ApiError } from './http'

export interface AdminSystemConfig {
  appName: string
  colorPrimary: string
  layout: 'mixed-nav' | 'sidebar' | 'top-nav'
  tabbarEnable: boolean
  transitionEnable: boolean
}

interface DomainSnapshot {
  accounts: Record<AdminAccountKey, MockAccount>
  permissions: Record<string, string[]>
  system: MockSystemState
}

/** 驾驶舱配置以通用 JSON 结构存储，mock 不感知 @luma/cockpit 内部模型 */
export type CockpitConfigRecord = Record<string, unknown>

export interface Sandbox {
  config: AdminSystemConfig
  cockpitConfig: CockpitConfigRecord
  createdAt: number
  id: string
  lastAccessedAt: number
  snapshot: DomainSnapshot
}

const initialConfig: AdminSystemConfig = {
  appName: 'Luma Admin',
  colorPrimary: '#1677ff',
  layout: 'mixed-nav',
  tabbarEnable: true,
  transitionEnable: true,
}

/**
 * 中性默认驾驶舱配置，用于演示真实 HTTP 加载/保存流程。
 * 名称保持中性，不含任何行业术语。
 */
const initialCockpitConfig: CockpitConfigRecord = {
  schemaVersion: 3,
  id: 'admin-demo-cockpit',
  title: '应用驾驶舱',
  activeLayoutId: 'layout-a',
  layouts: [
    {
      id: 'layout-a',
      title: '布局 A',
      left: {
        columns: [{ id: 'left-column-a', width: 320 }],
        rows: [
          {
            id: 'left-row-a',
            height: 100,
            mode: 'grid',
            cells: [
              {
                id: 'left-cell-a',
                widget: { id: 'w-a', type: 'stub-widget', title: '示例模块' },
              },
            ],
            widgets: [],
          },
        ],
      },
      right: {
        columns: [{ id: 'right-column-a', width: 320 }],
        rows: [
          {
            id: 'right-row-a',
            height: 100,
            mode: 'grid',
            cells: [{ id: 'right-cell-a' }],
            widgets: [],
          },
        ],
      },
    },
  ],
}

function capture(): DomainSnapshot {
  return {
    accounts: exportMockAccounts(),
    permissions: exportMockRolePermissions(),
    system: exportMockSystemState(),
  }
}

function restore(snapshot: DomainSnapshot): void {
  importMockAccounts(snapshot.accounts)
  importMockRolePermissions(snapshot.permissions)
  importMockSystemState(snapshot.system)
}

function resetGlobals(): DomainSnapshot {
  resetMockRolePermissions()
  resetMockAccounts()
  resetMockSystemUsers()
  resetMockSystemRoles()
  resetMockSystemMenus()
  resetMockSystemOrganizations()
  resetMockDictionaries()
  return capture()
}

const seed = resetGlobals()
const sandboxes = new Map<string, Sandbox>()
const idleTtlMs = Number(process.env.MOCK_SANDBOX_TTL_MS || 8 * 60 * 60 * 1000)
const maxSandboxes = Number(process.env.MOCK_MAX_SANDBOXES || 500)
let domainQueue: Promise<unknown> = Promise.resolve()

function clone<T>(value: T): T {
  return structuredClone(value)
}

function enqueue<T>(action: () => Promise<T> | T): Promise<T> {
  const result = domainQueue.then(action, action)
  domainQueue = result.then(() => undefined, () => undefined)
  return result
}

export function createSandbox(id: string): Sandbox {
  cleanupSandboxes()
  if (sandboxes.size >= maxSandboxes) {
    const oldest = [...sandboxes.values()].sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)[0]
    if (oldest)
      sandboxes.delete(oldest.id)
  }

  const now = Date.now()
  const sandbox: Sandbox = {
    config: clone(initialConfig),
    cockpitConfig: clone(initialCockpitConfig),
    createdAt: now,
    id,
    lastAccessedAt: now,
    snapshot: clone(seed),
  }
  sandboxes.set(id, sandbox)
  return sandbox
}

export function getSandbox(id: string): Sandbox {
  const sandbox = sandboxes.get(id)
  if (!sandbox || Date.now() - sandbox.lastAccessedAt > idleTtlMs) {
    sandboxes.delete(id)
    throw new ApiError('演示会话已失效', 401, 'AUTH_EXPIRED')
  }
  sandbox.lastAccessedAt = Date.now()
  return sandbox
}

export function deleteSandbox(id: string): void {
  sandboxes.delete(id)
}

export function resetSandbox(id: string): void {
  const sandbox = getSandbox(id)
  sandbox.snapshot = clone(seed)
  sandbox.config = clone(initialConfig)
  sandbox.cockpitConfig = clone(initialCockpitConfig)
}

export function cleanupSandboxes(): void {
  const now = Date.now()
  sandboxes.forEach((sandbox, id) => {
    if (now - sandbox.lastAccessedAt > idleTtlMs)
      sandboxes.delete(id)
  })
}

export function withSandbox<T>(id: string, action: (sandbox: Sandbox) => Promise<T> | T): Promise<T> {
  return enqueue(async () => {
    const sandbox = getSandbox(id)
    restore(sandbox.snapshot)
    const result = await action(sandbox)
    sandbox.snapshot = capture()
    sandbox.lastAccessedAt = Date.now()
    return result
  })
}

const cleanupTimer = setInterval(cleanupSandboxes, 10 * 60 * 1000)
cleanupTimer.unref?.()
