<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'

const props = withDefaults(defineProps<{
  width?: number
  height?: number
  zIndex?: number
}>(), {
  height: undefined,
  width: undefined,
  zIndex: 999,
})

const ready = shallowRef(false)
const viewportWidth = shallowRef(0)
let observer: ResizeObserver | undefined
let frame: number | undefined

const designWidth = computed(() => props.width ?? (typeof screen === 'undefined' ? 1920 : screen.width))
const designHeight = computed(() => props.height ?? (typeof screen === 'undefined' ? 1080 : screen.height))
const rootStyle = computed<CSSProperties>(() => ({
  height: `${designHeight.value}px`,
  transform: `scale(${viewportWidth.value / Math.max(1, designWidth.value)})`,
  width: `${designWidth.value}px`,
  zIndex: props.zIndex,
}))

function measure(): void {
  if (frame !== undefined) {
    if (typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(frame)
    else
      clearTimeout(frame)
  }
  const commit = (): void => {
    frame = undefined
    viewportWidth.value = document.body.clientWidth || window.innerWidth || designWidth.value
    ready.value = true
  }
  frame = typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(commit)
    : setTimeout(commit, 16) as unknown as number
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(document.body)
  }
  else {
    window.addEventListener('resize', measure)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', measure)
  if (frame !== undefined) {
    if (typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(frame)
    else
      clearTimeout(frame)
  }
})
</script>

<template>
  <div class="luma-full-screen-container" :style="rootStyle">
    <slot v-if="ready" />
  </div>
</template>

<style scoped>
.luma-full-screen-container {
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  transform-origin: left top;
}
</style>
