import type {
  LumalVersionInfo,
  VersionCheckEnvironment,
  VersionCheckError,
  VersionCheckErrorReason,
  VersionCheckFetch,
  VersionCheckResponse,
} from '../src/composables'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createVersionChecker,
  resolveVersionManifestUrl,
} from '../src/composables'

const current: LumalVersionInfo = {
  buildId: 'abc1234-2026-11-04T08:00:00.000Z',
  builtAt: '2026-11-04T08:00:00.000Z',
  commit: 'abc1234',
  version: '0.1.1-beta',
}

const next: LumalVersionInfo = {
  buildId: 'def5678-2026-11-04T09:00:00.000Z',
  builtAt: '2026-11-04T09:00:00.000Z',
  commit: 'def5678',
  version: '0.1.1-beta',
}

const later: LumalVersionInfo = {
  buildId: 'fed4321-2026-11-04T10:00:00.000Z',
  builtAt: '2026-11-04T10:00:00.000Z',
  commit: 'fed4321',
  version: '0.1.2-beta',
}

function jsonResponse(
  body: unknown,
  status = 200,
  contentType = 'application/json; charset=utf-8',
): VersionCheckResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: name => name.toLowerCase() === 'content-type' ? contentType : null,
    },
    json: async () => body,
  }
}

function createTestEnvironment(options: { hidden?: boolean } = {}) {
  const documentListeners = new Map<string, Set<() => void>>()
  const windowListeners = new Map<string, Set<() => void>>()
  let hidden = options.hidden ?? false

  const documentRef = {
    get hidden() {
      return hidden
    },
    get visibilityState() {
      return hidden ? 'hidden' : 'visible'
    },
    addEventListener(type: string, listener: () => void) {
      const listeners = documentListeners.get(type) ?? new Set()
      listeners.add(listener)
      documentListeners.set(type, listeners)
    },
    removeEventListener(type: string, listener: () => void) {
      documentListeners.get(type)?.delete(listener)
    },
  }
  const windowRef = {
    addEventListener(type: string, listener: () => void) {
      const listeners = windowListeners.get(type) ?? new Set()
      listeners.add(listener)
      windowListeners.set(type, listeners)
    },
    removeEventListener(type: string, listener: () => void) {
      windowListeners.get(type)?.delete(listener)
    },
  }
  const reload = vi.fn()
  let implementation: VersionCheckFetch = async () => jsonResponse(next)
  const fetchMock = vi.fn((url: string, init?: RequestInit) => implementation(url, init))

  const environment: VersionCheckEnvironment = {
    document: documentRef,
    window: windowRef,
    location: { reload },
    fetch: fetchMock,
    setTimeout: (handler, timeout) => setTimeout(handler, timeout),
    clearTimeout: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
  }

  function emit(listeners: Map<string, Set<() => void>>, type: string): void {
    for (const listener of [...(listeners.get(type) ?? [])])
      listener()
  }

  return {
    environment,
    fetchMock,
    reload,
    respond(handler: VersionCheckFetch) {
      implementation = handler
    },
    setHidden(value: boolean) {
      hidden = value
      emit(documentListeners, 'visibilitychange')
    },
    setOnline() {
      emit(windowListeners, 'online')
    },
    listenerCounts() {
      return {
        document: [...documentListeners.values()].reduce((total, listeners) => total + listeners.size, 0),
        window: [...windowListeners.values()].reduce((total, listeners) => total + listeners.size, 0),
      }
    },
  }
}

async function flushMicrotasks(): Promise<void> {
  for (let index = 0; index < 10; index += 1)
    await Promise.resolve()
}

async function advance(milliseconds: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(milliseconds)
  await flushMicrotasks()
}

describe('resolveVersionManifestUrl', () => {
  it('按 BASE_URL 拼接，不硬编码站点根路径', () => {
    expect(resolveVersionManifestUrl('/')).toBe('/version.json')
    expect(resolveVersionManifestUrl('')).toBe('/version.json')
    expect(resolveVersionManifestUrl('/px')).toBe('/px/version.json')
    expect(resolveVersionManifestUrl('/px/')).toBe('/px/version.json')
    expect(resolveVersionManifestUrl('/app/', 'build-info.json')).toBe('/app/build-info.json')
  })
})

describe('createVersionChecker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('当前 buildId 与远端一致时不提示，首查也不依赖远端基线', async () => {
    const testEnvironment = createTestEnvironment()
    const onUpdate = vi.fn()
    testEnvironment.respond(async () => jsonResponse(current))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      initialDelay: 10,
      onUpdate,
      url: '/version.json',
    })

    checker.start()
    await advance(10)

    expect(testEnvironment.fetchMock).toHaveBeenCalledWith('/version.json', expect.objectContaining({
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }))
    expect(onUpdate).not.toHaveBeenCalled()
    checker.stop()
  })

  it('首查发现页面已过期时立即提示，版本号相同也按 buildId 判断', async () => {
    const testEnvironment = createTestEnvironment()
    const onUpdate = vi.fn()
    testEnvironment.respond(async () => jsonResponse(next))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      interval: 60_000,
      onUpdate,
      url: '/version.json',
    })

    checker.start()
    await advance(0)

    expect(next.version).toBe(current.version)
    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onUpdate).toHaveBeenCalledWith(next)
    expect(checker.getUpdate()).toEqual(next)
    checker.stop()
  })

  it('同一 buildId 只提示一次，稍后后不重复骚扰，出现更晚构建再次提示', async () => {
    const testEnvironment = createTestEnvironment()
    const onUpdate = vi.fn()
    testEnvironment.respond(async () => jsonResponse(next))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      interval: 1_000,
      onUpdate,
      url: '/version.json',
    })

    checker.start()
    await advance(0)
    await advance(1_000)
    await advance(1_000)
    expect(onUpdate).toHaveBeenCalledOnce()

    checker.dismiss()
    expect(checker.getUpdate()).toBeNull()
    await advance(1_000)
    expect(onUpdate).toHaveBeenCalledOnce()

    testEnvironment.respond(async () => jsonResponse(later))
    await advance(1_000)
    expect(onUpdate).toHaveBeenCalledTimes(2)
    expect(onUpdate).toHaveBeenLastCalledWith(later)
    checker.stop()
  })

  it('页面隐藏时暂停计时，恢复可见后立即检查', async () => {
    const testEnvironment = createTestEnvironment()
    testEnvironment.respond(async () => jsonResponse(current))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      interval: 1_000,
      url: '/version.json',
    })

    checker.start()
    await advance(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)

    testEnvironment.setHidden(true)
    await advance(5_000)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)

    testEnvironment.setHidden(false)
    await advance(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(2)

    checker.stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('检查完成时页面已隐藏，不再安排下一次计时', async () => {
    const testEnvironment = createTestEnvironment()
    let resolveResponse: ((response: VersionCheckResponse) => void) | undefined
    testEnvironment.respond(() => new Promise<VersionCheckResponse>((resolve) => {
      resolveResponse = resolve
    }))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      interval: 1_000,
      url: '/version.json',
    })

    checker.start()
    await advance(0)
    testEnvironment.setHidden(true)
    resolveResponse?.(jsonResponse(current))
    await flushMicrotasks()

    expect(vi.getTimerCount()).toBe(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)

    testEnvironment.setHidden(false)
    testEnvironment.respond(async () => jsonResponse(current))
    await advance(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(2)
    checker.stop()
  })

  it('离线恢复或网络上线时立即检查，不等待下一个轮询周期', async () => {
    const testEnvironment = createTestEnvironment()
    testEnvironment.respond(async () => jsonResponse(current))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      interval: 60_000,
      url: '/version.json',
    })

    checker.start()
    await advance(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)

    await advance(30_000)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)

    testEnvironment.setOnline()
    await advance(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(2)

    checker.stop()
  })

  it('重复 start 不创建第二个计时器，stop 清理监听和计时器后可再次启动', async () => {
    const testEnvironment = createTestEnvironment()
    testEnvironment.respond(async () => jsonResponse(current))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      interval: 10_000,
      url: '/version.json',
    })

    checker.start()
    checker.start()
    expect(checker.hasStarted()).toBe(true)
    expect(testEnvironment.listenerCounts()).toEqual({ document: 1, window: 1 })
    await advance(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)

    checker.stop()
    expect(checker.hasStarted()).toBe(false)
    expect(testEnvironment.listenerCounts()).toEqual({ document: 0, window: 0 })
    expect(vi.getTimerCount()).toBe(0)

    await advance(30_000)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)

    checker.start()
    await advance(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(2)
    checker.stop()
  })

  it('并发检查复用同一个请求，不产生重叠 fetch', async () => {
    const testEnvironment = createTestEnvironment()
    let resolveResponse: ((response: VersionCheckResponse) => void) | undefined
    testEnvironment.respond(() => new Promise<VersionCheckResponse>((resolve) => {
      resolveResponse = resolve
    }))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      interval: 60_000,
      url: '/version.json',
    })

    const first = checker.check()
    const second = checker.check()
    expect(first).toBe(second)
    await flushMicrotasks()
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)

    resolveResponse?.(jsonResponse(next))
    await flushMicrotasks()
    expect(checker.getUpdate()).toEqual(next)

    testEnvironment.respond(async () => jsonResponse(next))
    await checker.check()
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(2)
    checker.stop()
  })

  it('停止后的在途请求不会阻塞重新启动', async () => {
    const testEnvironment = createTestEnvironment()
    let call = 0
    testEnvironment.respond((_url, init) => {
      call += 1
      if (call === 1) {
        return new Promise<VersionCheckResponse>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('aborted')
            error.name = 'AbortError'
            reject(error)
          })
        })
      }
      return Promise.resolve(jsonResponse(current))
    })
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      interval: 60_000,
      url: '/version.json',
    })

    checker.start()
    await advance(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)

    checker.stop()
    checker.start()
    await advance(1)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(2)
    checker.stop()
  })

  it('404、500、HTML、非法 JSON、缺字段与网络异常都不产生假更新', async () => {
    const scenarios: Array<{
      name: string
      response: () => Promise<VersionCheckResponse>
      reason: VersionCheckErrorReason
    }> = [
      { name: '404', response: async () => jsonResponse({}, 404), reason: 'http' },
      { name: '500', response: async () => jsonResponse({}, 500), reason: 'http' },
      { name: 'HTML fallback', response: async () => jsonResponse('<html></html>', 200, 'text/html'), reason: 'invalid' },
      {
        name: '非法 JSON',
        response: async () => ({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => {
            throw new SyntaxError('Unexpected token <')
          },
        }),
        reason: 'invalid',
      },
      { name: '缺 buildId', response: async () => jsonResponse({ version: '1.0.0' }), reason: 'invalid' },
      { name: '空 buildId', response: async () => jsonResponse({ buildId: '   ' }), reason: 'invalid' },
      {
        name: '网络异常',
        response: async () => {
          throw new TypeError('Failed to fetch')
        },
        reason: 'network',
      },
    ]

    for (const scenario of scenarios) {
      const testEnvironment = createTestEnvironment()
      const onUpdate = vi.fn()
      const onError = vi.fn()
      testEnvironment.respond(scenario.response)
      const checker = createVersionChecker({
        current,
        environment: testEnvironment.environment,
        onError,
        onUpdate,
        url: '/version.json',
      })

      await expect(checker.check()).resolves.toBeNull()
      expect(onUpdate, scenario.name).not.toHaveBeenCalled()
      expect(onError, scenario.name).toHaveBeenCalledOnce()
      expect((onError.mock.calls[0]![0] as VersionCheckError).reason, scenario.name).toBe(scenario.reason)
      checker.stop()
    }
  })

  it('请求超时会中止并上报，不打开更新提示', async () => {
    const testEnvironment = createTestEnvironment()
    const onError = vi.fn()
    const onUpdate = vi.fn()
    testEnvironment.respond((_url, init) => new Promise<VersionCheckResponse>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const error = new Error('aborted')
        error.name = 'AbortError'
        reject(error)
      })
    }))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      timeout: 1_000,
      onError,
      onUpdate,
      url: '/version.json',
    })

    const request = checker.check()
    await advance(1_000)
    await expect(request).resolves.toBeNull()

    expect(onUpdate).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
    expect((onError.mock.calls[0]![0] as VersionCheckError).reason).toBe('timeout')
    checker.stop()
  })

  it('stop 会中止在途请求，晚到响应不会重新提示或上报', async () => {
    const testEnvironment = createTestEnvironment()
    const onUpdate = vi.fn()
    const onError = vi.fn()
    testEnvironment.respond((_url, init) => new Promise<VersionCheckResponse>((resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const error = new Error('aborted')
        error.name = 'AbortError'
        reject(error)
      })
      // 模拟忽略 abort 的环境：即使稍后 resolve，也不能改变状态。
      setTimeout(() => resolve(jsonResponse(next)), 50)
    }))
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      onError,
      onUpdate,
      url: '/version.json',
    })

    checker.start()
    await advance(0)
    expect(testEnvironment.fetchMock).toHaveBeenCalledTimes(1)
    checker.stop()
    await advance(100)

    expect(onUpdate).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    expect(checker.getUpdate()).toBeNull()
  })

  it('立即刷新只执行一次完整 reload，守卫拒绝时不刷新', async () => {
    const testEnvironment = createTestEnvironment()
    const onError = vi.fn()
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      onError,
      url: '/version.json',
    })

    const blocked = createVersionChecker({
      beforeReload: async () => false,
      current,
      environment: testEnvironment.environment,
      url: '/version.json',
    })
    await expect(blocked.reload()).resolves.toBe(false)
    expect(testEnvironment.reload).not.toHaveBeenCalled()

    const allowed = createVersionChecker({
      beforeReload: async () => true,
      current,
      environment: testEnvironment.environment,
      url: '/version.json',
    })
    await expect(allowed.reload()).resolves.toBe(true)
    expect(testEnvironment.reload).toHaveBeenCalledOnce()
    await expect(allowed.reload()).resolves.toBe(false)
    expect(testEnvironment.reload).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
    checker.stop()
  })

  it('刷新守卫抛错时保留页面并上报错误', async () => {
    const testEnvironment = createTestEnvironment()
    const onError = vi.fn()
    const checker = createVersionChecker({
      beforeReload: () => {
        throw new Error('未保存内容')
      },
      current,
      environment: testEnvironment.environment,
      onError,
      url: '/version.json',
    })

    await expect(checker.reload()).resolves.toBe(false)
    expect(testEnvironment.reload).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
  })

  it('开发或关闭状态不检查，也不会注册计时器', async () => {
    const testEnvironment = createTestEnvironment()
    const checker = createVersionChecker({
      current,
      enabled: false,
      environment: testEnvironment.environment,
      url: '/version.json',
    })

    checker.start()
    await advance(10_000)

    expect(checker.hasStarted()).toBe(false)
    expect(testEnvironment.fetchMock).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('通过回调同步 checking 状态，便于 UI 展示', async () => {
    const testEnvironment = createTestEnvironment()
    const states: boolean[] = []
    const checker = createVersionChecker({
      current,
      environment: testEnvironment.environment,
      onCheckingChange: state => states.push(state),
      url: '/version.json',
    })

    await checker.check()
    expect(states).toEqual([true, false])
  })
})
