<script setup lang="ts">
import type { Component as VueComponent } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { computed, defineComponent, inject, onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue'
import { routeLocationKey, routerKey, RouterView } from 'vue-router'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  viewKey?: number | string
  transition?: boolean
  transitionName?: string
  progress?: boolean
  loading?: boolean
  cache?: boolean
  cacheMax?: number
  /** 当前允许保留的视图 key。移除 key 会销毁对应实例；刷新时替换该标签的 key。 */
  cacheKeys?: (number | string)[]
}>(), {
  cache: false,
  cacheMax: 20,
  loading: false,
  progress: false,
  transition: false,
  transitionName: 'fade-side',
  viewKey: 'default',
})

/***********************模板引用*********************/
const routerViewRef = useTemplateRef<HTMLElement>('routerViewRef')

/***********************视图状态*********************/
const route = inject(routeLocationKey, undefined)
const router = inject(routerKey, undefined)
const navigating = shallowRef(false)
const progressVisible = computed(() => props.progress && navigating.value)
const loadingVisible = computed(() => props.loading && navigating.value)
const resolvedCacheMax = computed(() => Number.isFinite(props.cacheMax) && props.cacheMax > 0 ? Math.max(1, Math.floor(props.cacheMax)) : 20)
const resolvedTransitionName = computed(() => props.transition ? props.transitionName : undefined)

/***********************视图缓存身份与剔除*********************/
// 为每个标签版本提供独立名字，利用 KeepAlive 的公开 include 契约剔除实例，
// 不依赖 Vue 私有缓存字段；元数据同步限量，避免关闭/刷新后持续增长。
const entries = new Map<number | string, { name: string, component: VueComponent }>()
const cachedView = shallowRef<VueComponent>()
const cacheNames = shallowRef<string[]>([])
let cacheNameSeed = 0
watch(
  [() => props.viewKey, () => props.cacheKeys?.slice(), () => props.cache, resolvedCacheMax, () => route?.meta.keepAlive],
  () => {
    const allowed = props.cacheKeys ? new Set(props.cacheKeys) : undefined
    for (const key of entries.keys()) {
      if (!props.cache || (allowed && !allowed.has(key)) || (key === props.viewKey && route?.meta.keepAlive === false))
        entries.delete(key)
    }
    let entry = entries.get(props.viewKey)
    if (props.cache && route?.meta.keepAlive !== false && (!allowed || allowed.has(props.viewKey))) {
      if (!entry) {
        const name = `LumalCachedView${++cacheNameSeed}`
        entry = {
          name,
          component: defineComponent({ name, setup: (_, { slots }) => () => slots.default?.() }),
        }
      }
      entries.delete(props.viewKey)
      entries.set(props.viewKey, entry)
    }
    else {
      entry = undefined
    }
    while (entries.size > resolvedCacheMax.value)
      entries.delete(entries.keys().next().value!)
    cachedView.value = entry?.component
    cacheNames.value = [...entries.values()].map(item => item.name)
  },
  { immediate: true },
)

/***********************真实导航反馈*********************/
let pendingRoute: RouteLocationNormalized | undefined
const removeBeforeGuard = router?.beforeEach((to) => {
  pendingRoute = to
  navigating.value = true
})
const removeAfterGuard = router?.afterEach((to) => {
  if (pendingRoute === to)
    navigating.value = false
})
const removeErrorHandler = router?.onError((_error, to) => {
  if (pendingRoute === to)
    navigating.value = false
})
onBeforeUnmount(() => {
  removeBeforeGuard?.()
  removeAfterGuard?.()
  removeErrorHandler?.()
  entries.clear()
})

/***********************公开方法*********************/
defineExpose({
  getRouterViewElement: () => routerViewRef.value,
})
</script>

<template>
  <div ref="routerViewRef" class="lumal-router-view">
    <div v-if="progressVisible" class="lumal-router-view__progress" aria-hidden="true">
      <span class="lumal-router-view__progress-bar" />
    </div>

    <RouterView v-slot="{ Component }">
      <Transition
        appear
        mode="out-in"
        :name="resolvedTransitionName"
        :css="transition"
      >
        <KeepAlive v-if="cache" :include="cacheNames" :max="resolvedCacheMax">
          <component :is="cachedView" v-if="cachedView" :key="viewKey">
            <component :is="Component" />
          </component>
          <component :is="Component" v-else :key="viewKey" />
        </KeepAlive>
        <component :is="Component" v-else :key="viewKey" />
      </Transition>
    </RouterView>

    <div v-if="loadingVisible" class="lumal-router-view__loading" aria-hidden="true">
      <span class="lumal-router-view__loading-dot" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.lumal-router-view {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  /* 仅由 LumalContent 承担纵向滚动，避免移动端双重滚动容器互相截断 */
  overflow-x: hidden;
  overflow-y: visible;
}

.lumal-router-view :deep(> *) {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
}

.lumal-router-view__progress {
  position: fixed;
  z-index: 3000;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  overflow: hidden;
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.lumal-router-view__progress-bar {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--el-color-primary);
  transform-origin: left center;
  animation: lumal-router-view-progress 0.32s ease-out both;
}

.lumal-router-view__loading {
  position: absolute;
  z-index: 19;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--el-bg-color-page) 72%, transparent);
  pointer-events: none;
}

.lumal-router-view__loading-dot {
  width: 28px;
  height: 28px;
  border: 3px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-top-color: var(--el-color-primary);
  border-radius: 999px;
  animation: lumal-router-view-loading 0.72s linear infinite;
}

.fade-side-enter-active,
.fade-side-leave-active {
  transition:
    opacity var(--lumal-motion-duration-slow) var(--lumal-easing-standard),
    transform var(--lumal-motion-duration-slow) var(--lumal-easing-standard);
}

.fade-side-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-side-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--lumal-motion-duration-base) var(--lumal-easing-standard);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-bottom-enter-active,
.fade-bottom-leave-active {
  transition:
    opacity var(--lumal-motion-duration-base) var(--lumal-easing-standard),
    transform var(--lumal-motion-duration-slow) var(--lumal-easing-standard);
}

.fade-bottom-enter-from {
  opacity: 0;
  transform: translateY(10%);
}

.fade-bottom-leave-to {
  opacity: 0;
  transform: translateY(-10%);
}

.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition:
    opacity var(--lumal-motion-duration-slow) var(--lumal-easing-standard),
    transform var(--lumal-motion-duration-slow) var(--lumal-easing-standard);
}

.zoom-fade-enter-from {
  opacity: 0;
  transform: scale(1.2);
}

.zoom-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

@keyframes lumal-router-view-progress {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

@keyframes lumal-router-view-loading {
  to {
    transform: rotate(360deg);
  }
}
</style>
