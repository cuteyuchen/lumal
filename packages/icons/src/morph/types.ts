import type { IconInput } from 'morphicons'
import type { IconDefinition } from '../types'
import type { MorphSvg } from './svg'

export type LumalIconMorphSpring = 'smooth' | 'snappy' | 'bouncy'
export type IconMorphSource = string | IconDefinition

/** 可直接交给 Morphicons 的任意框架绑定，不包含 Vue 等框架对象。 */
export interface PreparedIconMorph extends MorphSvg {
  icon: IconInput
  d: string
  shape: string
}

export interface IconMorphOptions {
  enabled?: boolean
  spring?: LumalIconMorphSpring
  size?: number | string
  color?: string
  title?: string
}

export interface IconMorphController {
  /** 初始静态图标同步可见；就绪不触发入场动画。false 表示静态回退。 */
  ready: Promise<boolean>
  update: (source: IconMorphSource, options?: IconMorphOptions) => Promise<boolean>
  /** 取消动画、异步任务与偏好监听，留下当前目标的静态 SVG。 */
  destroy: () => void
}
