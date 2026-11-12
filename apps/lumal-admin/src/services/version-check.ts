import type { CreateVersionCheckOptions, LumalVersionInfo } from '@lumal/core/composables'
import { resolveVersionManifestUrl } from '@lumal/core/composables'

/***********************构建身份*********************/
// 生产构建由插件注入；开发服务器不生成清单，用占位身份兜底且不启用检测。
export const adminVersionInfo: LumalVersionInfo = typeof __LUMAL_VERSION_INFO__ !== 'undefined'
  ? __LUMAL_VERSION_INFO__
  : { buildId: 'development', version: '0.0.0' }

const DEFAULT_INTERVAL = 5 * 60 * 1000
const DEFAULT_INITIAL_DELAY = 1_500

function resolveVersionCheckInterval(): number {
  const raw = import.meta.env.VITE_VERSION_CHECK_INTERVAL?.trim()
  if (!raw)
    return DEFAULT_INTERVAL

  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_INTERVAL
}

function resolveVersionCheckUrl(): string {
  // 子路径与 /px/ 独立构建都从自己的 BASE_URL 获取，不请求站点根路径。
  return import.meta.env.VITE_VERSION_CHECK_URL?.trim()
    || resolveVersionManifestUrl(import.meta.env.BASE_URL)
}

function resolveVersionCheckEnabled(): boolean {
  if (import.meta.env.VITE_VERSION_CHECK === 'false')
    return false
  return import.meta.env.PROD
}

export const adminVersionCheckOptions: CreateVersionCheckOptions = {
  current: adminVersionInfo,
  enabled: resolveVersionCheckEnabled(),
  initialDelay: DEFAULT_INITIAL_DELAY,
  interval: resolveVersionCheckInterval(),
  url: resolveVersionCheckUrl(),
}

/***********************刷新守卫*********************/
type VersionReloadGuard = () => boolean | Promise<boolean>

const reloadGuards = new Set<VersionReloadGuard>()

/**
 * 业务页面可注册未保存内容守卫；返回 false 时保留页面和提示。
 * 返回的注销函数应在组件卸载时调用。
 */
export function registerVersionReloadGuard(guard: VersionReloadGuard): () => void {
  reloadGuards.add(guard)
  return () => {
    reloadGuards.delete(guard)
  }
}

export async function runVersionReloadGuards(): Promise<boolean> {
  for (const guard of [...reloadGuards]) {
    try {
      if (await guard() === false)
        return false
    }
    catch {
      // 守卫异常时宁可阻止刷新，也不能丢弃可能未保存的内容。
      return false
    }
  }
  return true
}
