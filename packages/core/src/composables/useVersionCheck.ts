import type { Ref, ShallowRef } from 'vue'
import { getCurrentInstance, onMounted, onScopeDispose, ref, shallowRef } from 'vue'

/***********************构建身份*********************/
export interface LumalVersionInfo {
  /** 每次实际构建唯一；更新判断只看该字段。 */
  buildId: string
  /** 仅用于展示，不参与比较。 */
  version?: string
  commit?: string
  builtAt?: string
}

export type VersionCheckErrorReason = 'http' | 'invalid' | 'network' | 'timeout'

export class VersionCheckError extends Error {
  readonly reason: VersionCheckErrorReason

  constructor(message: string, reason: VersionCheckErrorReason) {
    super(message)
    this.name = 'VersionCheckError'
    this.reason = reason
  }
}

/***********************可注入环境*********************/
export interface VersionCheckDocument {
  readonly hidden?: boolean
  readonly visibilityState?: string
  addEventListener: (type: 'visibilitychange', listener: () => void) => void
  removeEventListener: (type: 'visibilitychange', listener: () => void) => void
}

export interface VersionCheckWindow {
  addEventListener: (type: 'online' | 'offline', listener: () => void) => void
  removeEventListener: (type: 'online' | 'offline', listener: () => void) => void
}

export interface VersionCheckResponse {
  ok: boolean
  status: number
  headers?: { get: (name: string) => string | null }
  json: () => Promise<unknown>
}

export type VersionCheckFetch = (url: string, init?: RequestInit) => Promise<VersionCheckResponse>

export interface VersionCheckEnvironment {
  document?: VersionCheckDocument | null
  window?: VersionCheckWindow | null
  location?: { reload: () => void } | null
  fetch?: VersionCheckFetch
  setTimeout?: (handler: () => void, timeout: number) => unknown
  clearTimeout?: (handle: unknown) => void
}

export interface CreateVersionCheckOptions {
  /** 页面加载时内置的构建身份。 */
  current: LumalVersionInfo
  /** 部署静态元数据地址，应由调用方按 BASE_URL 构造。 */
  url: string
  /** 默认 true；false 时 start/check 都不发请求。 */
  enabled?: boolean
  /** 轮询间隔，默认 5 分钟；小于等于 0 时只做首查和可见性/联网触发。 */
  interval?: number
  /** 首次检查延迟，默认 0，用于避开应用启动竞态。 */
  initialDelay?: number
  /** 单次请求超时，默认 10 秒；小于等于 0 时不设超时。 */
  timeout?: number
  /** 刷新前守卫；返回 false 时保留当前页面并让对话框继续显示。 */
  beforeReload?: () => boolean | Promise<boolean>
  environment?: VersionCheckEnvironment
  onUpdate?: (info: LumalVersionInfo) => void
  /** 提示关闭或部署回滚到当前构建时触发，用于同步 UI 状态。 */
  onUpdateCleared?: () => void
  onError?: (error: VersionCheckError) => void
  onCheckingChange?: (checking: boolean) => void
}

export interface VersionCheckController {
  /** 幂等启动；重复调用不会创建第二个计时器或重复监听。 */
  start: () => void
  /** 清理计时器、事件监听与在途请求；可再次 start。 */
  stop: () => void
  /** 手动检查；并发调用复用同一个请求。 */
  check: () => Promise<LumalVersionInfo | null>
  /** 关闭当前提示；同一 buildId 不再提示，另一个 buildId 可再次提示。 */
  dismiss: () => void
  /** 调用完整刷新；守卫拒绝或重复触发时返回 false。 */
  reload: () => Promise<boolean>
  getUpdate: () => LumalVersionInfo | null
  hasStarted: () => boolean
}

const DEFAULT_INTERVAL = 5 * 60 * 1000
const DEFAULT_TIMEOUT = 10 * 1000

function resolveVersionManifestUrl(base: string, fileName = 'version.json'): string {
  const normalizedBase = base.trim() || '/'
  const withTrailingSlash = normalizedBase.endsWith('/') ? normalizedBase : `${normalizedBase}/`
  return `${withTrailingSlash}${fileName.replace(/^\/+/, '')}`
}

export { resolveVersionManifestUrl }

function normalizeVersionInfo(value: unknown): LumalVersionInfo | null {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return null

  const record = value as Record<string, unknown>
  if (typeof record.buildId !== 'string' || !record.buildId.trim())
    return null

  return {
    buildId: record.buildId.trim(),
    version: typeof record.version === 'string' ? record.version : undefined,
    commit: typeof record.commit === 'string' ? record.commit : undefined,
    builtAt: typeof record.builtAt === 'string' ? record.builtAt : undefined,
  }
}

function toVersionCheckError(error: unknown, timedOut = false): VersionCheckError {
  if (error instanceof VersionCheckError)
    return error
  if (timedOut)
    return new VersionCheckError('版本检测请求超时', 'timeout')
  if (error instanceof Error && error.name === 'AbortError')
    return new VersionCheckError('版本检测请求已取消', 'network')
  return new VersionCheckError(error instanceof Error ? error.message : '版本检测请求失败', 'network')
}

interface ResolvedVersionCheckEnvironment {
  document: VersionCheckDocument | null
  window: VersionCheckWindow | null
  location: { reload: () => void } | null
  fetch: VersionCheckFetch | undefined
  setTimeout: (handler: () => void, timeout: number) => unknown
  clearTimeout: (handle: unknown) => void
}

function resolveEnvironment(input: VersionCheckEnvironment | undefined): ResolvedVersionCheckEnvironment {
  const documentRef = input?.document === undefined
    ? (typeof document === 'undefined' ? null : document)
    : input.document
  const windowRef = input?.window === undefined
    ? (typeof window === 'undefined' ? null : window)
    : input.window
  const locationRef = input?.location === undefined
    ? (typeof location === 'undefined' ? null : location)
    : input.location
  const fetchRef = input?.fetch
    ?? (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined)

  return {
    document: documentRef as VersionCheckDocument | null,
    window: windowRef as VersionCheckWindow | null,
    location: locationRef,
    fetch: fetchRef,
    setTimeout: input?.setTimeout ?? ((handler, timeout) => globalThis.setTimeout(handler, timeout)),
    clearTimeout: input?.clearTimeout ?? (handle => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>)),
  }
}

/**
 * 部署构建版本检查：首查直接与内置 buildId 比较，不用远端响应建立基线。
 * 定时链、请求和事件监听都由本实例持有，stop 后不残留任何在途回调。
 */
export function createVersionChecker(options: CreateVersionCheckOptions): VersionCheckController {
  const {
    current,
    url,
    enabled = true,
    interval = DEFAULT_INTERVAL,
    initialDelay = 0,
    timeout = DEFAULT_TIMEOUT,
  } = options
  const environment = resolveEnvironment(options.environment)
  const documentRef = environment.document
  const windowRef = environment.window

  let started = false
  let timer: unknown
  let inFlight: Promise<LumalVersionInfo | null> | undefined
  let activeAbort: AbortController | undefined
  let update: LumalVersionInfo | null = null
  let notifiedBuildId: string | null = null
  let dismissedBuildId: string | null = null
  let reloading = false
  let reloaded = false
  let generation = 0

  function clearTimer(): void {
    if (timer === undefined)
      return
    environment.clearTimeout(timer)
    timer = undefined
  }

  function isHidden(): boolean {
    return Boolean(documentRef?.hidden)
  }

  function schedule(delay: number): void {
    clearTimer()
    if (!started)
      return
    timer = environment.setTimeout(() => {
      timer = undefined
      void runScheduledCheck()
    }, Math.max(0, delay))
  }

  async function runScheduledCheck(): Promise<void> {
    if (!started || isHidden())
      return

    const runGeneration = generation
    await check()

    // stop/start 期间旧检查不能清掉新一轮刚安排的首次检查。
    if (started && runGeneration === generation && interval > 0 && !isHidden())
      schedule(interval)
  }

  function handleVisibilityChange(): void {
    if (!started)
      return
    if (isHidden()) {
      clearTimer()
      return
    }
    schedule(0)
  }

  function handleOnline(): void {
    if (!started || isHidden())
      return
    schedule(0)
  }

  function attachListeners(): void {
    documentRef?.addEventListener('visibilitychange', handleVisibilityChange)
    windowRef?.addEventListener('online', handleOnline)
  }

  function detachListeners(): void {
    documentRef?.removeEventListener('visibilitychange', handleVisibilityChange)
    windowRef?.removeEventListener('online', handleOnline)
  }

  function clearUpdate(): void {
    if (!update)
      return
    update = null
    try {
      options.onUpdateCleared?.()
    }
    catch {
      // 状态同步回调异常不能影响提示关闭。
    }
  }

  function applyRemote(remote: LumalVersionInfo): void {
    if (remote.buildId === current.buildId) {
      // 部署回滚到当前构建时关闭提示，不把“部署发生变化”误当成持续更新。
      clearUpdate()
      return
    }
    if (remote.buildId === dismissedBuildId || remote.buildId === notifiedBuildId)
      return

    notifiedBuildId = remote.buildId
    update = remote
    try {
      options.onUpdate?.(remote)
    }
    catch {
      // 业务回调异常不能影响后续轮询或应用运行。
    }
  }

  function reportError(error: VersionCheckError): void {
    try {
      options.onError?.(error)
    }
    catch {
      // 错误上报本身不能再制造未捕获异常。
    }
  }

  function check(): Promise<LumalVersionInfo | null> {
    if (!enabled)
      return Promise.resolve(null)
    if (inFlight)
      return inFlight

    const runGeneration = generation
    const controller = typeof AbortController === 'function' ? new AbortController() : undefined
    activeAbort = controller

    // 用 then 延迟执行，确保 inFlight 在首个 await 前已经赋值，避免同步异常留下悬挂请求。
    const request = Promise.resolve().then(async (): Promise<LumalVersionInfo | null> => {
      let timeoutHandle: unknown
      let timedOut = false

      try {
        options.onCheckingChange?.(true)

        if (!environment.fetch)
          throw new VersionCheckError('当前环境不支持 fetch', 'network')

        if (controller && timeout > 0) {
          timeoutHandle = environment.setTimeout(() => {
            timedOut = true
            controller.abort()
          }, timeout)
        }

        const response = await environment.fetch(url, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller?.signal,
        })

        if (!response.ok)
          throw new VersionCheckError(`版本检测失败：HTTP ${response.status}`, 'http')

        const contentType = response.headers?.get('content-type')?.toLowerCase() ?? ''
        if (contentType.includes('text/html'))
          throw new VersionCheckError('版本接口返回了 HTML 页面', 'invalid')

        let payload: unknown
        try {
          payload = await response.json()
        }
        catch {
          throw new VersionCheckError('版本接口不是合法 JSON', 'invalid')
        }

        const remote = normalizeVersionInfo(payload)
        if (!remote)
          throw new VersionCheckError('版本接口缺少有效 buildId', 'invalid')

        // stop 期间的响应不能重新打开提示。
        if (runGeneration !== generation || (controller?.signal.aborted && !timedOut))
          return null

        applyRemote(remote)
        return remote
      }
      catch (error) {
        if (runGeneration === generation && (!controller?.signal.aborted || timedOut))
          reportError(toVersionCheckError(error, timedOut))
        return null
      }
      finally {
        if (timeoutHandle !== undefined)
          environment.clearTimeout(timeoutHandle)
        if (activeAbort === controller)
          activeAbort = undefined
        if (runGeneration === generation)
          inFlight = undefined
        try {
          options.onCheckingChange?.(false)
        }
        catch {
          // 状态回调异常不改变请求结果。
        }
      }
    })

    inFlight = request
    return request
  }

  function start(): void {
    if (started || !enabled)
      return

    started = true
    attachListeners()

    // 页面已在后台时等待 visible，避免启动即发请求又被暂停。
    if (!isHidden())
      schedule(initialDelay)
  }

  function stop(): void {
    if (!started && inFlight === undefined)
      return

    started = false
    generation += 1
    clearTimer()
    activeAbort?.abort()
    activeAbort = undefined
    inFlight = undefined
    detachListeners()
  }

  function dismiss(): void {
    if (!update)
      return
    dismissedBuildId = update.buildId
    clearUpdate()
  }

  async function reload(): Promise<boolean> {
    if (reloading || reloaded)
      return false

    reloading = true
    try {
      if (options.beforeReload && await options.beforeReload() === false)
        return false

      stop()

      if (!environment.location)
        throw new VersionCheckError('当前环境无法刷新页面', 'network')

      environment.location.reload()
      reloaded = true
      return true
    }
    catch (error) {
      reportError(toVersionCheckError(error))
      return false
    }
    finally {
      reloading = false
    }
  }

  return {
    start,
    stop,
    check,
    dismiss,
    reload,
    getUpdate: () => update,
    hasStarted: () => started,
  }
}

/***********************Vue 组合式函数*********************/
export interface UseVersionCheckReturn {
  update: Readonly<ShallowRef<LumalVersionInfo | null>>
  checking: Readonly<Ref<boolean>>
  lastError: Readonly<ShallowRef<VersionCheckError | null>>
  start: () => void
  stop: () => void
  check: () => Promise<LumalVersionInfo | null>
  dismiss: () => void
  reload: () => Promise<boolean>
}

/**
 * 在组件作用域内自动启动和清理版本检查。
 * 不在组件内调用时只创建控制器，由调用方显式 start/stop。
 */
export function useVersionCheck(options: CreateVersionCheckOptions): UseVersionCheckReturn {
  const update = shallowRef<LumalVersionInfo | null>(null)
  const checking = ref(false)
  const lastError = shallowRef<VersionCheckError | null>(null)

  const controller = createVersionChecker({
    ...options,
    onUpdate(info) {
      update.value = info
      options.onUpdate?.(info)
    },
    onUpdateCleared() {
      update.value = null
      options.onUpdateCleared?.()
    },
    onError(error) {
      lastError.value = error
      options.onError?.(error)
    },
    onCheckingChange(value) {
      checking.value = value
      options.onCheckingChange?.(value)
    },
  })

  if (getCurrentInstance()) {
    onMounted(controller.start)
    onScopeDispose(controller.stop)
  }

  return {
    update,
    checking,
    lastError,
    start: controller.start,
    stop: controller.stop,
    check: controller.check,
    dismiss: controller.dismiss,
    reload: controller.reload,
  }
}
