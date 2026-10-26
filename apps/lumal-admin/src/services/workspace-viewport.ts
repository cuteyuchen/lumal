import type { ViewportMode, ViewportPolicy } from '@lumal/viewport'
import { readonly, shallowRef } from 'vue'

export type AdminViewportMode = Extract<ViewportMode, 'responsive' | 'contain' | 'width'>

export const adminViewportStorageKey = 'lumal-admin:workspace-viewport'
export const adminViewportOptions = [
  { value: 'responsive', label: '响应式' },
  { value: 'contain', label: '等比完整' },
  { value: 'width', label: '按宽缩放' },
] as const

// 仅为 Demo 内容区的设计尺寸，不包含 Header、Tabbar 或侧栏。
export const adminViewportDefaults = {
  designWidth: 1280,
  designHeight: 720,
  minScale: 0.75,
  minFontSize: 12,
} satisfies ViewportPolicy

/***********************本地偏好与安全回退*********************/
export function isAdminViewportMode(value: unknown): value is AdminViewportMode {
  return adminViewportOptions.some(option => option.value === value)
}

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  }
  catch {
    return undefined
  }
}

export function readAdminViewportMode(storage = browserStorage()): AdminViewportMode {
  try {
    const value = storage?.getItem(adminViewportStorageKey)
    return isAdminViewportMode(value) ? value : 'responsive'
  }
  catch {
    return 'responsive'
  }
}

const mode = shallowRef<AdminViewportMode>(readAdminViewportMode())
export const adminViewportMode = readonly(mode)

export function setAdminViewportMode(value: unknown): void {
  if (!isAdminViewportMode(value))
    return
  mode.value = value
  try {
    browserStorage()?.setItem(adminViewportStorageKey, value)
  }
  catch {
    // 禁用存储不影响本次会话切换，也不改变认证或权限。
  }
}

export function resolveAdminWorkspacePolicy(value: AdminViewportMode, selfManaged = false): ViewportPolicy {
  return { ...adminViewportDefaults, mode: selfManaged ? 'responsive' : value }
}
