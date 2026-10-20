export interface MorphRuntime {
  MorphIcon: typeof import('morphicons/vue')['MorphIcon']
}

let runtimePromise: Promise<MorphRuntime> | undefined

/** 通用转换由 @lumal/icons/morph 负责，此处只按需加载官方 Vue 绑定。 */
export function loadMorphRuntime(): Promise<MorphRuntime> {
  runtimePromise ??= import('morphicons/vue').then(binding => ({ MorphIcon: binding.MorphIcon })).catch((error: unknown) => {
    runtimePromise = undefined
    throw error
  })
  return runtimePromise
}
