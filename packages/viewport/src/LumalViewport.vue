<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { ViewportPolicy } from './policy'
import type { ElementSize } from './useElementSize'
import { computed, useTemplateRef, watch } from 'vue'
import { useViewportPolicy } from './policy'
import { useViewportScale } from './useViewportScale'

/***********************策略与实际容器*********************/
const props = defineProps<{ policy?: ViewportPolicy | false }>()
const emit = defineEmits<{ resize: [size: ElementSize] }>()
const policy = useViewportPolicy(() => props.policy)
const container = useTemplateRef<HTMLElement>('container')
const scaled = computed(() => policy.value.mode === 'contain' || policy.value.mode === 'width')
const viewportUnits = computed(() => policy.value.mode === 'vw')
const { result, ready, size, measure } = useViewportScale({
  target: container,
  designWidth: () => policy.value.designWidth,
  designHeight: () => policy.value.designHeight,
  mode: () => policy.value.mode === 'width' ? 'width' : 'contain',
  minScale: () => policy.value.minScale,
  maxScale: () => policy.value.maxScale,
  enabled: () => policy.value.mode !== 'disabled',
})
watch(size, value => emit('resize', value))

/***********************浏览器 vw 与显式动态尺寸*********************/
// vw 的横纵尺寸都以浏览器宽度为基准，不以局部容器宽高或 contain 比例代替。
const { result: viewportResult } = useViewportScale({
  designWidth: () => policy.value.designWidth,
  designHeight: () => policy.value.designHeight,
  mode: 'width',
  enabled: viewportUnits,
})

/***********************局部样式与滚动边界*********************/
const scale = computed(() => viewportUnits.value ? viewportResult.value.scale : scaled.value ? result.value.scale : 1)
const viewportUnit = computed(() => `${100 / policy.value.designWidth}vw`)
const variables = computed<CSSProperties>(() => policy.value.mode === 'disabled'
  ? {
      '--lumal-viewport-unit': '1px',
      '--lumal-viewport-scale': 1,
      '--lumal-viewport-x-unit': '1px',
      '--lumal-viewport-y-unit': '1px',
      '--lumal-viewport-min-font-size': '0px',
    }
  : {
      // 构建期 runtime 输出只在 vw 模式使用 vw；画布模式恢复设计 px 后只缩放一次。
      '--lumal-viewport-unit': viewportUnits.value ? viewportUnit.value : '1px',
      '--lumal-viewport-scale': scale.value,
      '--lumal-viewport-x-unit': viewportUnits.value ? viewportUnit.value : `${size.value.width / policy.value.designWidth}px`,
      '--lumal-viewport-y-unit': viewportUnits.value ? viewportUnit.value : `${size.value.height / policy.value.designHeight}px`,
      '--lumal-viewport-min-font-size': `${policy.value.minFontSize / (scaled.value ? scale.value : 1)}px`,
    })
// 外层只暴露缩放后的占位尺寸，避免绝对定位的设计画布制造无意义的横向滚动。
const extentStyle = computed<CSSProperties>(() => scaled.value
  ? { width: `${Math.max(size.value.width, result.value.scaledWidth)}px`, height: `${Math.max(size.value.height, result.value.scaledHeight)}px`, position: 'relative', overflow: 'hidden' }
  : { width: '100%', height: '100%', minWidth: 0, minHeight: 0 })
const stageStyle = computed<CSSProperties>(() => scaled.value
  ? {
      position: 'absolute',
      width: `${policy.value.designWidth}px`,
      height: `${policy.value.designHeight}px`,
      transformOrigin: 'top left',
      transform: `translate(${result.value.offsetX}px, ${result.value.offsetY}px) scale(${result.value.scale})`,
    }
  : { width: '100%', height: '100%', minWidth: 0, minHeight: 0 })
// size/resize 始终描述实际容器；vw 的 result 则与浏览器宽度和 slot.scale 一致。
const activeResult = computed(() => viewportUnits.value ? viewportResult.value : result.value)
defineExpose({ measure, size, result: activeResult })
</script>

<template>
  <div ref="container" :data-viewport-mode="policy.mode" :style="variables" style="position: relative; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: auto;">
    <div :style="extentStyle">
      <div :style="stageStyle">
        <slot v-if="!scaled || ready" :scale="scale" :size="size" />
      </div>
    </div>
  </div>
</template>
