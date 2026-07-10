import type {
  CreatePreferencesStoreOptions,
  LumaPreferences,
  PreferencesStore,
  ResolvedThemeMode,
  ThemeRuntimeEnvironment,
} from './types'
import { shallowRef } from 'vue'
import { applyThemePreferences, watchSystemTheme } from './dom'
import {
  createDefaultPreferences,
  mergePreferences,
  normalizePreferences,
  resolveThemeMode,
} from './preferences'

/***********************运行环境*********************/
function resolveRuntime(runtime?: ThemeRuntimeEnvironment): ThemeRuntimeEnvironment {
  if (runtime) {
    return runtime
  }

  return {
    document: typeof document === 'undefined' ? undefined : document,
    matchMedia: typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? undefined
      : window.matchMedia.bind(window),
  }
}

/***********************缓存读写*********************/
function readPreferences(options: CreatePreferencesStoreOptions): LumaPreferences | undefined {
  let raw: string | null = null

  try {
    raw = options.storage.getItem(options.storageKey)

    if (raw === null) {
      return undefined
    }

    return normalizePreferences(JSON.parse(raw), options.defaults)
  }
  catch {
    try {
      options.storage.removeItem(options.storageKey)
    }
    catch {
      // 存储不可用时仍回退内存默认值。
    }

    return undefined
  }
}

function writePreferences(options: CreatePreferencesStoreOptions, preferences: LumaPreferences): void {
  try {
    options.storage.setItem(options.storageKey, JSON.stringify(preferences))
  }
  catch {
    // 存储配额或隐私模式不可用时不阻断当前会话。
  }
}

/***********************偏好 Store*********************/
export function createPreferencesStore(options: CreatePreferencesStoreOptions): PreferencesStore {
  const runtime = resolveRuntime(options.runtime)
  const initial = readPreferences(options) ?? createDefaultPreferences(options.defaults)
  const state = shallowRef(initial)
  const resolvedThemeMode = shallowRef<ResolvedThemeMode>(resolveThemeMode(initial.theme.mode, runtime))
  const autoApply = options.autoApply ?? true
  let clearSystemThemeListener: () => void = () => undefined

  function apply(): ResolvedThemeMode {
    clearSystemThemeListener()
    resolvedThemeMode.value = applyThemePreferences(state.value, runtime)
    clearSystemThemeListener = watchSystemTheme(state.value, (mode) => {
      resolvedThemeMode.value = mode
      applyThemePreferences(state.value, runtime)
    }, runtime)
    return resolvedThemeMode.value
  }

  function patch(next = {}): void {
    state.value = mergePreferences(state.value, next, options.defaults)
    writePreferences(options, state.value)

    if (autoApply) {
      apply()
    }
    else {
      resolvedThemeMode.value = resolveThemeMode(state.value.theme.mode, runtime)
    }
  }

  function reset(): void {
    state.value = createDefaultPreferences(options.defaults)
    writePreferences(options, state.value)

    if (autoApply) {
      apply()
    }
    else {
      resolvedThemeMode.value = resolveThemeMode(state.value.theme.mode, runtime)
    }
  }

  function exportCurrent(): LumaPreferences {
    return normalizePreferences(state.value, options.defaults)
  }

  function dispose(): void {
    clearSystemThemeListener()
  }

  if (autoApply) {
    apply()
  }

  return {
    apply,
    dispose,
    exportCurrent,
    patch,
    reset,
    resolvedThemeMode,
    state,
  }
}
