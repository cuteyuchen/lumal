<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue'
import { RouterView } from 'vue-router'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  viewKey?: number | string
  transition?: boolean
  transitionName?: string
  progress?: boolean
  loading?: boolean
  cache?: boolean
  cacheMax?: number
}>(), {
  cache: false,
  cacheMax: 0,
  loading: false,
  progress: false,
  transition: false,
  transitionName: 'fade-side',
  viewKey: 'default',
})

/***********************模板引用*********************/
const routerViewRef = useTemplateRef<HTMLElement>('routerViewRef')

/***********************视图状态*********************/
const progressVisible = shallowRef(false)
const loadingVisible = shallowRef(false)
const loadedViewKeys = new Set<number | string>([props.viewKey])
const resolvedCacheMax = computed(() => props.cacheMax > 0 ? props.cacheMax : undefined)
const resolvedTransitionName = computed(() => props.transition ? props.transitionName : undefined)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

/***********************切换反馈*********************/
function clearFeedbackTimer(): void {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
    feedbackTimer = undefined
  }
}

function isLoadedViewKey(viewKey: number | string): boolean {
  return props.cache && loadedViewKeys.has(viewKey)
}

function finishRouteFeedback(viewKey: number | string): void {
  progressVisible.value = false
  loadingVisible.value = false
  loadedViewKeys.add(viewKey)
  feedbackTimer = undefined
}

function startRouteFeedback(viewKey: number | string): void {
  clearFeedbackTimer()
  progressVisible.value = props.progress && !isLoadedViewKey(viewKey)
  loadingVisible.value = props.loading && !isLoadedViewKey(viewKey)

  if (!progressVisible.value && !loadingVisible.value) {
    loadedViewKeys.add(viewKey)
    return
  }

  feedbackTimer = setTimeout(finishRouteFeedback, 520, viewKey)
}

watch(
  () => props.viewKey,
  (viewKey, oldViewKey) => {
    if (oldViewKey === undefined) {
      return
    }

    startRouteFeedback(viewKey)
  },
)

onBeforeUnmount(() => {
  clearFeedbackTimer()
})

/***********************公开方法*********************/
defineExpose({
  getRouterViewElement: () => routerViewRef.value,
})
</script>

<template>
  <div ref="routerViewRef" class="luma-router-view">
    <div v-if="progressVisible" class="luma-router-view__progress" aria-hidden="true">
      <span class="luma-router-view__progress-bar" />
    </div>

    <RouterView v-slot="{ Component }">
      <Transition
        v-if="resolvedTransitionName"
        appear
        mode="out-in"
        :name="resolvedTransitionName"
      >
        <KeepAlive v-if="cache" :max="resolvedCacheMax">
          <component :is="Component" :key="viewKey" />
        </KeepAlive>
        <component :is="Component" v-else :key="viewKey" />
      </Transition>

      <KeepAlive v-else-if="cache" :max="resolvedCacheMax">
        <component :is="Component" :key="viewKey" />
      </KeepAlive>

      <component :is="Component" v-else :key="viewKey" />
    </RouterView>

    <div v-if="loadingVisible" class="luma-router-view__loading" aria-hidden="true">
      <span class="luma-router-view__loading-dot" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.luma-router-view {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.luma-router-view :deep(> *) {
  flex: 1 1 auto;
  min-height: 0;
}

.luma-router-view__progress {
  position: fixed;
  z-index: 3000;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  overflow: hidden;
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.luma-router-view__progress-bar {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--el-color-primary);
  transform-origin: left center;
  animation: luma-router-view-progress 0.32s ease-out both;
}

.luma-router-view__loading {
  position: absolute;
  z-index: 19;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--el-bg-color-page) 72%, transparent);
  pointer-events: none;
}

.luma-router-view__loading-dot {
  width: 28px;
  height: 28px;
  border: 3px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-top-color: var(--el-color-primary);
  border-radius: 999px;
  animation: luma-router-view-loading 0.72s linear infinite;
}

.fade-side-enter-active,
.fade-side-leave-active {
  transition:
    opacity var(--luma-motion-duration-slow) var(--luma-easing-standard),
    transform var(--luma-motion-duration-slow) var(--luma-easing-standard);
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
  transition: opacity var(--luma-motion-duration-base) var(--luma-easing-standard);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-bottom-enter-active,
.fade-bottom-leave-active {
  transition:
    opacity var(--luma-motion-duration-base) var(--luma-easing-standard),
    transform var(--luma-motion-duration-slow) var(--luma-easing-standard);
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
    opacity var(--luma-motion-duration-slow) var(--luma-easing-standard),
    transform var(--luma-motion-duration-slow) var(--luma-easing-standard);
}

.zoom-fade-enter-from {
  opacity: 0;
  transform: scale(1.2);
}

.zoom-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

@keyframes luma-router-view-progress {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

@keyframes luma-router-view-loading {
  to {
    transform: rotate(360deg);
  }
}
</style>
