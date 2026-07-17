<script setup lang="ts">
import type { CockpitCenterContext, CockpitLayoutConfig, CockpitViewportMode } from '../types'
import { computed, ref } from 'vue'
import { useCanvasScale } from '../composables/useCanvasScale'
import LumaCockpitRegion from './LumaCockpitRegion.vue'

/***********************基准画布*********************/

const props = defineProps<{
  title: string
  baseWidth: number
  baseHeight: number
  layout: CockpitLayoutConfig
  centerContext: CockpitCenterContext
  viewportMode: CockpitViewportMode
}>()

const containerRef = ref<HTMLElement | null>(null)
const { result } = useCanvasScale(containerRef, {
  baseWidth: () => props.baseWidth,
  baseHeight: () => props.baseHeight,
})
const stageStyle = computed(() => {
  // vwvh：用视口单位铺满，子元素按设计像素单位布局
  if (props.viewportMode === 'vwvh') {
    return {
      'width': '100vw',
      'height': '100vh',
      '--luma-cockpit-x-unit': `${100 / props.baseWidth}vw`,
      '--luma-cockpit-y-unit': `${100 / props.baseHeight}vh`,
    }
  }
  // external：不自缩放，铺满父容器，缩放由外层容器（LumaFullScreenContainer）承担
  if (props.viewportMode === 'external') {
    return {
      'width': `${props.baseWidth}px`,
      'height': `${props.baseHeight}px`,
      '--luma-cockpit-x-unit': '1px',
      '--luma-cockpit-y-unit': '1px',
    }
  }
  // scale：内部按等比缩放并居中
  return {
    'width': `${props.baseWidth}px`,
    'height': `${props.baseHeight}px`,
    'transform': `translate(${result.value.offsetX}px, ${result.value.offsetY}px) scale(${result.value.scale})`,
    'transformOrigin': 'top left',
    '--luma-cockpit-x-unit': '1px',
    '--luma-cockpit-y-unit': '1px',
  }
})
</script>

<template>
  <div ref="containerRef" class="luma-cockpit-canvas" :data-scale="result.scale.toFixed(3)" :data-viewport-mode="viewportMode">
    <div class="luma-cockpit-canvas__stage" :style="stageStyle">
      <header class="luma-cockpit-canvas__header">
        <div class="luma-cockpit-canvas__header-prefix">
          <slot name="header-prefix" />
        </div>
        <div class="luma-cockpit-canvas__title">
          <slot name="header-title" :title="title">
            <h1>{{ title }}</h1>
          </slot>
        </div>
        <div class="luma-cockpit-canvas__header-actions">
          <slot name="header-actions" />
        </div>
      </header>

      <div class="luma-cockpit-canvas__body">
        <main class="luma-cockpit-canvas__center">
          <slot name="center" :context="centerContext" :layout="layout">
            <div class="luma-cockpit-center__empty" role="status">
              由应用提供中央内容
            </div>
          </slot>
        </main>
        <LumaCockpitRegion class="luma-cockpit-canvas__left" side="left" :layout-id="layout.id" :region="layout.left" />
        <LumaCockpitRegion class="luma-cockpit-canvas__right" side="right" :layout-id="layout.id" :region="layout.right" />
      </div>
    </div>
  </div>
</template>
