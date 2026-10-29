<script setup lang="ts">
import type { CockpitCenterContext, CockpitLayoutConfig } from '../types'
import { viewportLength } from '@lumal/viewport'
import { computed } from 'vue'
import LumalCockpitRegion from './LumalCockpitRegion.vue'

/***********************基准画布*********************/

const props = defineProps<{
  title: string
  baseWidth: number
  baseHeight: number
  layout: CockpitLayoutConfig
  centerContext: CockpitCenterContext
}>()

// baseHeight 只是内容高度，不参与比例计算；嵌入窄容器也不改成容器缩放。
const stageStyle = computed(() => ({
  width: viewportLength(props.baseWidth),
  height: viewportLength(props.baseHeight),
}))
</script>

<template>
  <div class="lumal-cockpit-canvas">
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
