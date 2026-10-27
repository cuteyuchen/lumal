<script setup lang="ts">
import type { ViewportPolicy } from '@lumal/viewport'
import type { CSSProperties } from 'vue'
import { computeViewportFontSize, useViewportPolicy, useViewportScale } from '@lumal/viewport'
import { computed, useTemplateRef } from 'vue'

/***********************实际内容容器与唯一缩放责任*********************/
const props = defineProps<{ policy: ViewportPolicy, fontSize: number }>()
const policy = useViewportPolicy(() => props.policy)
const host = useTemplateRef<HTMLElement>('host')
const scaled = computed(() => policy.value.mode === 'contain' || policy.value.mode === 'width')
const viewportUnits = computed(() => policy.value.mode === 'vw')
// 画布按实际内容容器测量，Header 和侧栏不占用设计画布。
const { size, result, ready } = useViewportScale({
  target: host,
  designWidth: () => policy.value.designWidth,
  designHeight: () => policy.value.designHeight,
  mode: () => policy.value.mode === 'width' ? 'width' : 'contain',
  minScale: () => policy.value.minScale,
  maxScale: () => policy.value.maxScale,
})

/***********************浏览器 vw 与构建转换协作*********************/
// 复用公共窗口测量；宽高共用浏览器宽度比例，不受画布 minScale 或侧栏宽度影响。
const { scale: viewportScale } = useViewportScale({
  designWidth: () => policy.value.designWidth,
  designHeight: () => policy.value.designHeight,
  mode: 'width',
  enabled: viewportUnits,
})
const scale = computed(() => viewportUnits.value ? viewportScale.value : scaled.value ? result.value.scale : 1)
const viewportStyle = computed<CSSProperties>(() => ({
  '--lumal-viewport-unit': viewportUnits.value ? `${100 / policy.value.designWidth}vw` : '1px',
  '--lumal-viewport-scale': scale.value,
}))

/***********************稳定画布与局部字号*********************/
const extentStyle = computed<CSSProperties>(() => scaled.value
  ? {
      width: `${Math.max(size.value.width, result.value.scaledWidth)}px`,
      height: `${Math.max(size.value.height, result.value.scaledHeight)}px`,
    }
  : {})
const stageStyle = computed<CSSProperties>(() => {
  if (!scaled.value)
    return {}
  const scale = result.value.scale
  const font = (value: number) => `${computeViewportFontSize(value, scale, policy.value.minFontSize) / scale}px`
  return {
    'width': `${policy.value.designWidth}px`,
    'height': `${policy.value.designHeight}px`,
    'transform': `translate(${result.value.offsetX}px, ${result.value.offsetY}px) scale(${scale})`,
    'visibility': ready.value ? 'visible' : 'hidden',
    '--lumal-viewport-scale': scale,
    '--lumal-font-size-base': font(props.fontSize),
    '--el-font-size-base': font(props.fontSize),
    '--el-font-size-large': font(props.fontSize + 4),
    '--el-font-size-medium': font(props.fontSize + 2),
    '--el-font-size-small': font(props.fontSize - 1),
    '--el-font-size-extra-small': font(props.fontSize - 2),
  }
})
</script>

<template>
  <div
    ref="host"
    class="admin-workspace-viewport"
    :class="{ 'is-scaled': scaled }"
    :style="viewportStyle"
    :data-viewport-mode="policy.mode"
    :data-scale="scale"
    :data-container-width="size.width"
    :data-container-height="size.height"
    data-testid="admin-workspace-viewport"
  >
    <div class="admin-workspace-viewport__extent" :style="extentStyle">
      <div class="admin-workspace-viewport__stage" :style="stageStyle">
        <!-- 切换模式只改样式，不以 v-if / key 重建 RouterView 与标签缓存。 -->
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-workspace-viewport {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.admin-workspace-viewport__extent,
.admin-workspace-viewport__stage {
  display: contents;
}

.admin-workspace-viewport.is-scaled {
  position: relative;
  display: block;
  flex-basis: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.is-scaled > .admin-workspace-viewport__extent {
  position: relative;
  display: block;
  overflow: hidden;
}

.is-scaled .admin-workspace-viewport__stage {
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: auto;
  transform-origin: top left;
}
</style>
