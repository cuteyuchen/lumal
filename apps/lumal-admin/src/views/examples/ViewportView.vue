<script setup lang="ts">
import type { ViewportMode, ViewportPolicy } from '@lumal/viewport'
import { LumalPage } from '@lumal/core/components'
import { resolveViewportPolicy, useElementSize, useViewportPolicy, useViewportScale } from '@lumal/viewport'
import { ElButton, ElDialog, ElTable, ElTableColumn, ElTooltip } from 'element-plus'
import { computed, ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import ViewportCanvas from './viewport/ViewportCanvas.vue'
import canvasSource from './viewport/ViewportCanvas.vue?raw'

/***********************应用默认、路由策略、容器覆盖*********************/
const route = useRoute()
const defaults = useViewportPolicy()
const routePolicy = computed(() => resolveViewportPolicy(defaults.value, route.meta.viewport as ViewportPolicy | undefined))
const mode = ref<ViewportMode>('contain')
const scope = ref('container')
const designWidth = ref(960)
const designHeight = ref(540)
const minFontSize = ref(12)
const simulation = ref('wide')
const dialogVisible = ref(false)
const policy = computed(() => scope.value === 'global'
  ? defaults.value
  : scope.value === 'route'
    ? routePolicy.value
    : resolveViewportPolicy(routePolicy.value, {
        mode: mode.value,
        designWidth: designWidth.value,
        designHeight: designHeight.value,
        minFontSize: minFontSize.value,
      }))

/***********************只观测实际工作区，不再次施加缩放*********************/
const host = useTemplateRef<HTMLElement>('host')
const { size } = useElementSize({ target: host })
const { scale } = useViewportScale({
  target: host,
  designWidth: () => policy.value.designWidth,
  designHeight: () => policy.value.designHeight,
  mode: () => policy.value.mode === 'width' ? 'width' : 'contain',
})
const displayScale = computed(() => ['contain', 'width'].includes(policy.value.mode) ? scale.value : 1)
const dimensions = computed(() => simulation.value === 'short'
  ? { width: '100%', height: '280px' }
  : simulation.value === 'narrow' ? { width: '480px', height: '420px' } : { width: '100%', height: '540px' })
const rows = computed(() => [
  { name: '实际容器', value: `${size.value.width} × ${size.value.height}` },
  { name: '设计尺寸', value: `${policy.value.designWidth} × ${policy.value.designHeight}` },
  { name: '缩放比例', value: displayScale.value.toFixed(3) },
])
</script>

<template>
  <main class="lumal-admin-example viewport-example">
    <LumalPage title="Viewport">
      <div class="viewport-controls">
        <label>策略来源<select v-model="scope" aria-label="策略来源"><option value="global">全局默认</option><option value="route">路由页面</option><option value="container">容器覆盖</option></select></label>
        <label>适配模式<select v-model="mode" aria-label="适配模式" :disabled="scope !== 'container'"><option value="contain">contain</option><option value="width">width</option><option value="responsive">responsive</option><option value="disabled">disabled</option></select></label>
        <label>模拟尺寸<select v-model="simulation" aria-label="模拟尺寸"><option value="wide">宽屏</option><option value="short">矮屏</option><option value="narrow">窄屏</option></select></label>
        <label>设计宽<input v-model.number="designWidth" aria-label="设计宽" type="number" min="320" max="3840" :disabled="scope !== 'container'"></label>
        <label>设计高<input v-model.number="designHeight" aria-label="设计高" type="number" min="240" max="2160" :disabled="scope !== 'container'"></label>
        <label>最小字号<input v-model.number="minFontSize" aria-label="最小字号" type="number" min="10" max="24" :disabled="scope !== 'container'"></label>
        <ElTooltip content="真实视口中的弹窗" :teleported="false">
          <ElButton @click="dialogVisible = true">
            容器信息
          </ElButton>
        </ElTooltip>
      </div>
      <output data-testid="viewport-metrics">{{ policy.mode }} · {{ size.width }} × {{ size.height }} · scale {{ displayScale.toFixed(3) }}</output>
      <div ref="host" class="viewport-host" :style="dimensions">
        <ViewportCanvas :policy="policy" />
      </div>
      <ElTable :data="rows" aria-label="视口测量">
        <ElTableColumn prop="name" label="测量项" width="140" /><ElTableColumn prop="value" label="当前值" />
      </ElTable>
      <details><summary>Vue 源码</summary><pre><code>{{ canvasSource }}</code></pre></details>
      <a href="https://lumal.cuteyuchen.top/packages/viewport" target="_blank" rel="noopener noreferrer">Viewport 接入指南</a>
    </LumalPage>
    <!-- 弹窗不在 transform 树中，不对 Admin 浮层和字号施加缩放。 -->
    <ElDialog v-model="dialogVisible" title="容器信息" width="min(480px, 90vw)" append-to-body>
      <dl v-for="row in rows" :key="row.name">
        <dt>{{ row.name }}</dt><dd>{{ row.value }}</dd>
      </dl>
    </ElDialog>
  </main>
</template>

<style scoped>
.viewport-controls { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; margin-bottom: 16px; }
label { display: grid; gap: 6px; font-size: var(--lumal-font-size-base, 14px); }
select, input { box-sizing: border-box; height: 32px; max-width: 140px; padding: 4px 8px; border: 1px solid var(--el-border-color); border-radius: 4px; background: var(--el-bg-color); color: var(--el-text-color-primary); font: inherit; }
.viewport-host { max-width: 100%; margin-block: 16px; outline: 1px solid var(--el-border-color); }
output { font-variant-numeric: tabular-nums; }
pre { max-height: 400px; overflow: auto; padding: 16px; background: var(--el-fill-color-light); font-size: calc(var(--lumal-font-size-base, 14px) - 1px); }
details { margin-block: 16px; }
</style>
