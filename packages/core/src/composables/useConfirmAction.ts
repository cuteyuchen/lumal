/***********************确认操作*********************/
export interface ConfirmActionOptions {
  title?: string
  message?: string
  confirmButtonText?: string
  cancelButtonText?: string
}

export interface UseConfirmActionOptions {
  /** 确认交互实现，默认无 UI，需业务注入（如 ElMessageBox.confirm）。 */
  confirm?: (options: Required<ConfirmActionOptions>) => Promise<unknown>
  /** 默认文案。 */
  defaults?: ConfirmActionOptions
}

const builtinDefaults: Required<ConfirmActionOptions> = {
  title: '提示',
  message: '确定执行此操作？',
  confirmButtonText: '确定',
  cancelButtonText: '取消',
}

/**
 * 二次确认组合式逻辑：确认通过后执行回调，取消则返回 undefined。
 * 不默认依赖 Element Plus，确认交互由 confirm 注入，便于测试与替换。
 */
export function useConfirmAction(options: UseConfirmActionOptions = {}): {
  confirmAction: <T>(callback: () => Promise<T> | T, actionOptions?: ConfirmActionOptions) => Promise<T | undefined>
} {
  const confirm = options.confirm
  const defaults = { ...builtinDefaults, ...options.defaults }

  async function confirmAction<T>(
    callback: () => Promise<T> | T,
    actionOptions: ConfirmActionOptions = {},
  ): Promise<T | undefined> {
    const resolved = { ...defaults, ...actionOptions }

    if (confirm) {
      try {
        await confirm(resolved)
      }
      catch {
        return undefined
      }
    }

    return await callback()
  }

  return { confirmAction }
}
