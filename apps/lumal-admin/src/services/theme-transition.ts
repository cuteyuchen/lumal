import { nextTick } from 'vue'

export interface ThemeTransitionOrigin {
  clientX: number
  clientY: number
}

interface ViewTransitionLike {
  finished: Promise<void>
  ready: Promise<void>
  skipTransition?: () => void
}

type ThemeTransitionDocument = Pick<Document, 'documentElement'> & {
  startViewTransition?: (update: () => void | Promise<void>) => ViewTransitionLike
}

export interface ThemeTransitionEnvironment {
  document?: ThemeTransitionDocument
  matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'>
  viewport?: Pick<Window, 'innerHeight' | 'innerWidth'>
}

let transitionRunning = false
let transitionFinished = Promise.resolve()

/** 等待页面快照释放后再播放局部图标形变。 */
export function waitForAdminThemeTransition(): Promise<void> {
  return transitionFinished
}

function resolveEnvironment(): ThemeTransitionEnvironment {
  return {
    document: typeof document === 'undefined' ? undefined : document,
    matchMedia: typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? undefined
      : window.matchMedia.bind(window),
    viewport: typeof window === 'undefined' ? undefined : window,
  }
}

export async function runAdminThemeTransition(
  updateTheme: () => void,
  origin?: ThemeTransitionOrigin,
  environment: ThemeTransitionEnvironment = resolveEnvironment(),
): Promise<void> {
  const documentRef = environment.document
  const viewport = environment.viewport
  const reduceMotion = environment.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

  if (
    transitionRunning
    || reduceMotion
    || !documentRef?.startViewTransition
    || !viewport
    || typeof documentRef.documentElement.animate !== 'function'
  ) {
    if (!transitionRunning) {
      updateTheme()
    }
    return
  }

  transitionRunning = true
  let finish!: () => void
  // 必须先建立完成信号，updateTheme 中同步触发的 watcher 才能等待本次过渡。
  transitionFinished = new Promise<void>((resolve) => {
    finish = resolve
  })
  let transition: ViewTransitionLike | undefined
  const wasDark = documentRef.documentElement.classList.contains('dark')
  const x = Math.max(0, Math.min(origin?.clientX ?? viewport.innerWidth - 28, viewport.innerWidth))
  const y = Math.max(0, Math.min(origin?.clientY ?? 28, viewport.innerHeight))
  const radius = Math.hypot(
    Math.max(x, viewport.innerWidth - x),
    Math.max(y, viewport.innerHeight - y),
  )
  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${radius}px at ${x}px ${y}px)`,
  ]

  try {
    transition = documentRef.startViewTransition(async () => {
      updateTheme()
      await nextTick()
    })
    await transition.ready
    const animation = documentRef.documentElement.animate(
      { clipPath: wasDark ? clipPath : [...clipPath].reverse() },
      {
        duration: 400,
        easing: 'ease-in',
        pseudoElement: wasDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
      },
    )

    await animation.finished
  }
  finally {
    try {
      transition?.skipTransition?.()
      await transition?.finished.catch(() => {})
    }
    finally {
      transitionRunning = false
      finish()
    }
  }
}
