<script setup lang="ts">
import { LumalPage } from '@lumal/core/components'
import { getViewportConfig, useElementSize, useViewportWidth, viewportLength } from '@lumal/viewport'
import { ElButton, ElDialog, ElTable, ElTableColumn, ElTooltip } from 'element-plus'
import { computed, ref, useTemplateRef } from 'vue'
import ViewportCanvas from './viewport/ViewportCanvas.vue'
import canvasSource from './viewport/ViewportCanvas.vue?raw'

/***********************窗口适配与容器测量分离*********************/
const host = useTemplateRef<HTMLElement>('host')
const { size } = useElementSize({ target: host })
const viewport = useViewportWidth()
const config = getViewportConfig()
const simulation = ref('wide')
const dialogVisible = ref(false)
const dimensions = computed(() => ({
  width: simulation.value === 'narrow' ? viewportLength(480) : '100%',
  height: viewportLength(simulation.value === 'short' ? 280 : 640),
}))
const rows = computed(() => [
  { name: '浏览器基准宽度', value: viewport.width.value.toFixed(2) },
  { name: '实际容器', value: `${size.value.width} × ${size.value.height}` },
  { name: '项目设计宽度', value: config.designWidth },
  { name: '192px 实际尺寸', value: viewport.pixels(192).toFixed(2) },
])
</script>

<template>
  <main class="lumal-admin-example viewport-example">
    <LumalPage title="Viewport">
      <div class="viewport-controls">
        <label>容器
          <select v-model="simulation" aria-label="模拟尺寸">
            <option value="wide">宽屏</option><option value="short">矮屏</option><option value="narrow">窄屏</option>
          </select>
        </label>
        <ElTooltip content="容器信息">
          <ElButton @click="dialogVisible = true">
            容器信息
          </ElButton>
        </ElTooltip>
      </div>
      <output data-testid="viewport-metrics">{{ size.width }} × {{ size.height }} · {{ viewport.ratio.value.toFixed(3) }}</output>
      <div ref="host" class="viewport-host" :style="dimensions">
        <ViewportCanvas />
      </div>
      <ElTable :data="rows" aria-label="视口测量">
        <ElTableColumn prop="name" label="测量项" :width="viewport.pixels(180)" /><ElTableColumn prop="value" label="当前值" />
      </ElTable>
      <details><summary>Vue 源码</summary><pre><code>{{ canvasSource }}</code></pre></details>
    </LumalPage>
    <ElDialog v-model="dialogVisible" title="容器信息" :width="viewportLength(480)" append-to-body>
      <dl v-for="row in rows" :key="row.name">
        <dt>{{ row.name }}</dt><dd>{{ row.value }}</dd>
      </dl>
    </ElDialog>
  </main>
</template>

<style scoped>
.viewport-controls { display: flex; align-items: end; gap: 12px; margin-bottom: 16px; }
label { display: grid; gap: 6px; }
select { height: 32px; padding: 4px 8px; border: 1px solid var(--el-border-color); border-radius: 4px; background: var(--el-bg-color); color: var(--el-text-color-primary); font: inherit; }
.viewport-host { max-width: 100%; margin-block: 16px; outline: 1px solid var(--el-border-color); overflow: auto; }
output { font-variant-numeric: tabular-nums; }
pre { max-height: 400px; overflow: auto; padding: 16px; background: var(--el-fill-color-light); font-size: 13px; }
details { margin-block: 16px; }
</style>
