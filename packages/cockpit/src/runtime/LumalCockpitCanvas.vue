<script setup lang="ts">
import type { CockpitCenterContext, CockpitLayoutConfig, CockpitViewportMode } from '../types'
import { computed, useTemplateRef } from 'vue'
import { useCanvasScale } from '../composables/useCanvasScale'
import LumalCockpitRegion from './LumalCockpitRegion.vue'

/***********************基准画布*********************/

const props = defineProps<{
  title: string
  baseWidth: number
  baseHeight: number
  layout: CockpitLayoutConfig
  centerContext: CockpitCenterContext
  viewportMode: CockpitViewportMode
}>()

const containerRef = useTemplateRef<HTMLElement>('containerRef')
const { result } = useCanvasScale(containerRef, {
  baseWidth: () => props.baseWidth,
  baseHeight: () => props.baseHeight,
  enabled: () => props.viewportMode === 'scale',
})
const stageStyle = computed(() => {
  // vwvh：用视口单位铺满，子元素按设计像素单位布局
  if (props.viewportMode === 'vwvh') {
    return {
      'width': '100vw',
      'height': '100vh',
      '--lumal-cockpit-x-unit': `${100 / props.baseWidth}vw`,
      '--lumal-cockpit-y-unit': `${100 / props.baseHeight}vh`,
    }
  }
  // external：不自缩放，铺满父容器，缩放由外层容器（LumalFullScreenContainer）承担
  if (props.viewportMode === 'external') {
    return {
      'width': `${props.baseWidth}px`,
      'height': `${props.baseHeight}px`,
      '--lumal-cockpit-x-unit': '1px',
      '--lumal-cockpit-y-unit': '1px',
    }
  }
  // scale：内部按等比缩放并居中
  return {
    'width': `${props.baseWidth}px`,
    'height': `${props.baseHeight}px`,
    'transform': `translate(${result.value.offsetX}px, ${result.value.offsetY}px) scale(${result.value.scale})`,
    'transformOrigin': 'top left',
    '--lumal-cockpit-x-unit': '1px',
    '--lumal-cockpit-y-unit': '1px',
  }
})
</script>

<template>
  <div ref="containerRef" class="lumal-cockpit-canvas" :data-scale="result.scale.toFixed(3)" :data-viewport-mode="viewportMode">
    <div class="lumal-cockpit-canvas__stage" :style="stageStyle">
      <header class="lumal-cockpit-canvas__header">
        <div class="lumal-cockpit-canvas__header-prefix">
          <slot name="header-prefix" />
        </div>
        <div class="lumal-cockpit-canvas__title">
          <slot name="header-title" :title="title">
            <h1>{{ title }}</h1>
          </slot>
        </div>
        <div class="lumal-cockpit-canvas__header-actions">
          <slot name="header-actions" />
        </div>
      </header>

      <div class="lumal-cockpit-canvas__body">
        <main class="lumal-cockpit-canvas__center">
          <slot name="center" :context="centerContext" :layout="layout">
            <div class="lumal-cockpit-center__empty" role="status">
              由应用提供中央内容
            </div>
          </slot>
        </main>
        <div class="lumal-cockpit-canvas__left">
          <slot name="left" :layout="layout" :region="layout.left" side="left">
            <LumalCockpitRegion side="left" :layout-id="layout.id" :region="layout.left" />
          </slot>
        </div>
        <div class="lumal-cockpit-canvas__right">
          <slot name="right" :layout="layout" :region="layout.right" side="right">
            <LumalCockpitRegion side="right" :layout-id="layout.id" :region="layout.right" />
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
