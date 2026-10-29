<script setup lang="ts">
import { getViewportConfig, useElementSize, useViewportWidth } from '@lumal/viewport'
import { ref, useTemplateRef } from 'vue'

/***********************窗口宽度与真实容器*********************/
const host = useTemplateRef<HTMLElement>('host')
const { size } = useElementSize({ target: host })
const viewport = useViewportWidth()
const config = getViewportConfig()
const clicks = ref(0)
</script>

<template>
  <section ref="host" class="viewport-lab">
    <output data-testid="viewport-lab-metrics">容器 {{ size.width }} × {{ size.height }} · D {{ config.designWidth }} · W {{ viewport.width.value.toFixed(2) }}</output>
    <div class="viewport-lab__sample" style="width:192px;height:96px" :style="{ marginTop: '24px' }">
      <strong>128</strong><span>在线节点</span>
    </div>
    <button type="button" @click="clicks++">
      确认节点 · {{ clicks }}
    </button>
  </section>
</template>

<style scoped>
.viewport-lab { display: grid; gap: 16px; font-size: 14px; line-height: 20px; }
.viewport-lab__sample { display: grid; place-content: center; background: #173e42; color: #eaf6f8; }
strong { font-size: 24px; line-height: 32px; }
button { justify-self: start; min-height: 44px; padding: 8px 16px; border: 1px solid var(--el-border-color); background: var(--el-bg-color); color: inherit; font: inherit; cursor: pointer; }
</style>
