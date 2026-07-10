import type { Ref } from 'vue'
import { onBeforeUnmount, ref } from 'vue'

/***********************全屏*********************/
export interface UseFullscreenReturn {
  isFullscreen: Ref<boolean>
  enter: (target?: HTMLElement) => Promise<void>
  exit: () => Promise<void>
  toggle: (target?: HTMLElement) => Promise<void>
}

/**
 * 浏览器全屏组合式逻辑：进入/退出/切换全屏并同步状态。
 * 非浏览器环境或不支持时静默降级，不抛异常。
 */
export function useFullscreen(defaultTarget?: () => HTMLElement | undefined): UseFullscreenReturn {
  const isFullscreen = ref(false)

  function resolveTarget(target?: HTMLElement): HTMLElement | undefined {
    return target ?? defaultTarget?.() ?? (typeof document !== 'undefined' ? document.documentElement : undefined)
  }

  function syncState(): void {
    isFullscreen.value = typeof document !== 'undefined' && Boolean(document.fullscreenElement)
  }

  async function enter(target?: HTMLElement): Promise<void> {
    const element = resolveTarget(target)

    if (!element?.requestFullscreen) {
      return
    }

    await element.requestFullscreen()
    syncState()
  }

  async function exit(): Promise<void> {
    if (typeof document === 'undefined' || !document.exitFullscreen || !document.fullscreenElement) {
      return
    }

    await document.exitFullscreen()
    syncState()
  }

  async function toggle(target?: HTMLElement): Promise<void> {
    if (isFullscreen.value) {
      await exit()
      return
    }

    await enter(target)
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', syncState)
    onBeforeUnmount(() => {
      document.removeEventListener('fullscreenchange', syncState)
    })
  }

  return {
    isFullscreen,
    enter,
    exit,
    toggle,
  }
}
