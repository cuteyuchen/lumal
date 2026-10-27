<script setup lang="ts">
import type { ViewportMode } from '@lumal/viewport'
import { LumalViewport, useViewportScale } from '@lumal/viewport'
import { computed } from 'vue'
import { cooperativePolicy, design } from '../../viewport.config'

/***********************共享设计尺寸与动态数值的显式适配*********************/
const props = withDefaults(defineProps<{ mode?: ViewportMode, designSize?: number }>(), {
  mode: 'vw',
  designSize: 192,
})
const policy = computed(() => ({ ...cooperativePolicy, mode: props.mode }))
const { scale } = useViewportScale({
  designWidth: design.designWidth,
  designHeight: design.designHeight,
  mode: 'width',
  enabled: () => props.mode === 'vw',
})
const dynamicWidth = computed(() => `${props.designSize * (props.mode === 'vw' ? scale.value : 1)}px`)
const businessLabel = '192px'
const active = true
</script>

<template>
  <LumalViewport class="cooperative-host" :policy="policy">
    <section class="cooperative-panel">
      <div class="cooperative-static" style="width: 192px; height: 96px; font-size: 14px; line-height: 20px; min-width: 320px" />
      <div class="cooperative-object" :style="{ width: '192px', top: '24px', height: dynamicWidth }" />
      <div class="cooperative-array" :style="[{ height: '96px' }, active && { left: '48px' }, { padding: '24px' }]" />
      <!-- lumal-viewport-ignore -->
      <div class="cooperative-ignored" style="width: 192px; height: 96px" />
      <!-- lumal-viewport-ignore -->
      <div class="cooperative-map" :style="{ width: '192px', height: '96px' }" />
      <div class="cooperative-business w-[192px]" aria-label="192px">
        {{ businessLabel }}
      </div>
      <LumalViewport class="cooperative-nested-responsive" :policy="{ mode: 'responsive' }">
        <div class="cooperative-nested-content" style="width: 192px; height: 96px" />
      </LumalViewport>
      <LumalViewport class="cooperative-nested-disabled" :policy="false">
        <div class="cooperative-disabled-content" style="width: 192px; height: 96px" />
      </LumalViewport>
    </section>
  </LumalViewport>
</template>

<style scoped lang="scss">
$panel-width: 384px;
.cooperative-panel {
  width: $panel-width;
  height: 192px;
  padding: 24px;
  margin: 12px;
  font-size: 14px;
  line-height: 20px;
  min-width: 320px;
  min-height: 40px;
  border: 2px solid red;
}
.cooperative-map {
  /*! lumal-viewport-ignore-next */
  width: 192px;
}
.cooperative-normal[data-width='192px'] {
  width: 192px;
}
.cooperative-variable {
  width: calc(192px * var(--lumal-viewport-scale));
  height: clamp(40px, 10vw, 192px);
}
.cooperative-ignored-size {
  /*! lumal-viewport-ignore-next */
  width: 192px;
  height: 96px;
  /*! lumal-viewport-ignore */
  padding: 24px;
}
.cooperative-atomic.w-\[192px\] {
  width: 192px;
}
</style>
