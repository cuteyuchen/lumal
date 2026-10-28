<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { getViewportConfig, viewportLength } from '@lumal/viewport'
import { computed } from 'vue'

/***********************内容尺寸与滚动边界*********************/
const props = withDefaults(defineProps<{
  /** 内容宽度（设计 px），不覆盖项目设计基准。 */
  width?: number
  /** 内容高度（设计 px），始终按项目设计宽度转换。 */
  height?: number
  overflow?: 'auto' | 'hidden'
  embedded?: boolean
  zIndex?: number
}>(), {
  width: undefined,
  height: undefined,
  overflow: 'auto',
  embedded: false,
  zIndex: 999,
})
const stageStyle = computed<CSSProperties>(() => ({
  width: viewportLength(props.width ?? getViewportConfig().designWidth),
  height: props.height === undefined ? undefined : viewportLength(props.height),
  minHeight: props.height === undefined ? '100%' : undefined,
}))
</script>

<template>
  <div class="lumal-full-screen-container" :class="{ 'is-embedded': embedded }" :style="{ zIndex, overflow }">
    <div class="lumal-full-screen-container__stage" :style="stageStyle">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lumal-full-screen-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: auto;
}

.lumal-full-screen-container__stage {
  position: relative;
}

.lumal-full-screen-container.is-embedded {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
