import type { ComputedRef, InjectionKey, MaybeRefOrGetter, Plugin } from 'vue'
import { computed, inject, toValue } from 'vue'

export type ViewportMode = 'disabled' | 'responsive' | 'contain' | 'width' | 'vw'

/** 这里只描述策略；全局、路由和容器的作用范围由安装点及包装位置决定。 */
export interface ViewportPolicy {
  mode?: ViewportMode
  designWidth?: number
  designHeight?: number
  minScale?: number
  maxScale?: number
  /** 物理 CSS px 下限，仅供字号工具和 CSS 变量使用，不强制修改后代字体。 */
  minFontSize?: number
}

export interface ResolvedViewportPolicy extends ViewportPolicy {
  mode: ViewportMode
  designWidth: number
  designHeight: number
  minFontSize: number
}

const policyKey: InjectionKey<ComputedRef<ResolvedViewportPolicy>> = Symbol('lumal-viewport-policy')
const modes = new Set<ViewportMode>(['disabled', 'responsive', 'contain', 'width', 'vw'])
const positive = (value: number | undefined, fallback: number) => Number.isFinite(value) && value! > 0 ? value! : fallback

export function resolveViewportPolicy(
  defaults: ViewportPolicy = {},
  override?: ViewportPolicy | false,
): ResolvedViewportPolicy {
  const merged = { ...defaults, ...(override === false ? { mode: 'disabled' as const } : override) }
  return {
    ...merged,
    mode: modes.has(merged.mode!) ? merged.mode! : 'responsive',
    designWidth: positive(merged.designWidth, 1920),
    designHeight: positive(merged.designHeight, 1080),
    minFontSize: positive(merged.minFontSize, 0),
  }
}

/** 安装只提供默认配置，不注册守卫、不写全局样式，也不 transform 根元素。 */
export function createViewportPlugin(defaults: MaybeRefOrGetter<ViewportPolicy> = {}): Plugin {
  return {
    install(app) {
      app.provide(policyKey, computed(() => resolveViewportPolicy(toValue(defaults))))
    },
  }
}

export function useViewportPolicy(override?: MaybeRefOrGetter<ViewportPolicy | false | undefined>) {
  const defaults = inject(policyKey, computed(() => resolveViewportPolicy()))
  return computed(() => resolveViewportPolicy(defaults.value, toValue(override)))
}

/** 未变换浮层直接使用结果；已变换画布使用结果 / scale 作为设计坐标字号。 */
export function computeViewportFontSize(designSize: number, scale: number, minimum = 0): number {
  return Math.max(positive(minimum, 0), positive(designSize, 0) * positive(scale, 1))
}
