import type { InjectionKey, Slots } from 'vue'
import type { CockpitMessageBus } from '../messaging/types'
import type { CockpitRegistry } from '../registry/types'
import type { CockpitRenderMode } from '../types'
import { inject } from 'vue'

/***********************运行时内部环境上下文*********************/

/**
 * 由 LumaCockpit 向整棵运行时子树提供的稳定环境。
 * 不含 categoryId / pageId，这些随页面变化，通过 props 下传。
 */
export interface CockpitRuntimeEnv {
  cockpitId: string
  mode: CockpitRenderMode
  registry: CockpitRegistry
  messages: CockpitMessageBus
  /** 是否在页面切换后保留组件状态 */
  cachePages: boolean
  /** 宿主传入的插槽，供深层 Host 渲染降级/自定义内容 */
  slots: Slots
}

export const cockpitRuntimeEnvKey: InjectionKey<CockpitRuntimeEnv> = Symbol('luma-cockpit-runtime-env')

export function useCockpitRuntimeEnv(): CockpitRuntimeEnv {
  const env = inject(cockpitRuntimeEnvKey, null)
  if (!env)
    throw new Error('[cockpit] 运行时环境缺失，组件必须在 LumaCockpit 内渲染。')
  return env
}
