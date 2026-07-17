<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { FullScreenContainerMode } from '../types'
import { computed, ref } from 'vue'
import { useFullScreenScale } from '../composables/useFullScreenScale'

/***********************全屏容器*********************/

const props = withDefaults(defineProps<{
  /** 设计稿宽度，缩放基准 */
  width?: number
  /** 设计稿高度，缩放基准 */
  height?: number
  /** 适配类别：width（宽度等比）/ scale（等比居中）/ vwvh（拉伸铺满） */
  mode?: FullScreenContainerMode
  /** 容器层级 */
  zIndex?: number
}>(), {
  height: undefined,
  mode: 'width',
  width: undefined,
  zIndex: 999,
})

const containerRef = ref<HTMLElement | null>(null)

const designWidth = computed(() => props.width ?? (typeof screen === 'undefined' ? 1920 : screen.width))
const designHeight = computed(() => props.height ?? (typeof screen === 'undefined' ? 1080 : screen.height))

const { result, ready } = useFullScreenScale(containerRef, {
  designHeight: () => designHeight.value,
  designWidth: () => designWidth.value,
})

const stageStyle = computed<CSSProperties>(() => {
  if (props.mode === 'vwvh') {
    return {
      'height': '100vh',
      'width': '100vw',
      '--luma-fsc-x-unit': `${100 / Math.max(1, designWidth.value)}vw`,
      '--luma-fsc-y-unit': `${100 / Math.max(1, designHeight.value)}vh`,
    }
  }

  if (props.mode === 'scale') {
    return {
      height: `${designHeight.value}px`,
      transform: `translate(${result.value.offsetX}px, ${result.value.offsetY}px) scale(${result.value.scale})`,
      transformOrigin: 'top left',
      width: `${designWidth.value}px`,
    }
  }

  // width：DataV 原生按宽度等比缩放（仅受容器宽度约束）
  const widthScale = (result.value.containerWidth || designWidth.value) / Math.max(1, designWidth.value)
  return {
    height: `${designHeight.value}px`,
    transform: `scale(${widthScale})`,
    transformOrigin: 'left top',
    width: `${designWidth.value}px`,
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="luma-full-screen-container"
    :data-mode="mode"
    :style="{ zIndex }"
  >
    <div class="luma-full-screen-container__stage" :style="stageStyle">
      <slot v-if="ready" />
    </div>
  </div>
</template>

<style scoped>
.luma-full-screen-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.luma-full-screen-container__stage {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  will-change: transform;
}

.luma-full-screen-container[data-mode='vwvh'] .luma-full-screen-container__stage {
  will-change: auto;
}
</style>
