<script setup lang="ts">
import type { ViewportMode } from '@lumal/viewport'
import { LumalViewport, useViewportPolicy, useViewportScale } from '@lumal/viewport'
import { computed, ref, useTemplateRef } from 'vue'

/***********************独立容器实验，不参与主驾驶舱缩放*********************/
const mode = ref<ViewportMode>('contain')
const designWidth = ref(960)
const designHeight = ref(540)
const simulation = ref('wide')
const clicks = ref(0)
const host = useTemplateRef<HTMLElement>('host')
const policy = useViewportPolicy(() => ({ mode: mode.value, designWidth: designWidth.value, designHeight: designHeight.value }))
// 此 composable 只观测和计算，没有第二次 transform；DOM 缩放由 LumalViewport 独占。
const { size, scale } = useViewportScale({
  target: host,
  designWidth,
  designHeight,
  mode: () => mode.value === 'width' ? 'width' : 'contain',
})
const displayScale = computed(() => ['contain', 'width'].includes(mode.value) ? scale.value : 1)
const dimensions = computed(() => simulation.value === 'portrait'
  ? { width: '480px', height: '420px' }
  : simulation.value === 'short' ? { width: '960px', height: '260px' } : { width: '960px', height: '540px' })
</script>

<template>
  <section class="viewport-lab">
    <div class="viewport-lab__controls">
      <label>适配策略
        <select v-model="mode" aria-label="实验适配策略">
          <option value="contain">contain</option><option value="width">width</option><option value="responsive">responsive</option>
        </select>
      </label>
      <label>容器
        <select v-model="simulation" aria-label="模拟容器">
          <option value="wide">960 × 540</option><option value="short">960 × 260</option><option value="portrait">480 × 420</option>
        </select>
      </label>
      <label>设计宽度 <input v-model.number="designWidth" aria-label="实验设计宽度" type="number" min="320" max="3840"></label>
      <label>设计高度 <input v-model.number="designHeight" aria-label="实验设计高度" type="number" min="240" max="2160"></label>
    </div>
    <output data-testid="viewport-lab-metrics">容器 {{ size.width }} × {{ size.height }} · 设计 {{ policy.designWidth }} × {{ policy.designHeight }} · 比例 {{ displayScale.toFixed(3) }}</output>
    <div class="viewport-lab__scroll">
      <div ref="host" class="viewport-lab__host" :style="dimensions">
        <LumalViewport :policy="policy">
          <div class="viewport-lab__canvas">
            <header>运行总览 <span>LOCAL VIEWPORT</span></header>
            <div class="viewport-lab__metrics">
              <article><span>在线节点</span><strong>128</strong></article>
              <article><span>运行指数</span><strong>98.6</strong></article>
              <article><span>有效链路</span><strong>362</strong></article>
            </div>
            <div class="viewport-lab__bars" aria-label="趋势图">
              <i v-for="height in [36, 62, 48, 85, 64, 96, 78]" :key="height" :style="{ height: `${height}%` }" />
            </div>
            <button type="button" @click="clicks++">
              确认节点 · {{ clicks }}
            </button>
          </div>
        </LumalViewport>
      </div>
    </div>
  </section>
</template>

<style scoped>
.viewport-lab { display: grid; gap: 16px; color: var(--el-text-color-primary); }
.viewport-lab__controls { display: flex; flex-wrap: wrap; gap: 16px; }
label { display: grid; gap: 6px; font-size: 14px; }
select, input, button { padding: 8px; border: 1px solid var(--el-border-color); border-radius: 4px; background: var(--el-bg-color); color: inherit; font: inherit; }
input { width: 120px; }
.viewport-lab__scroll { overflow: auto; }
.viewport-lab__host { max-width: 100%; outline: 1px solid var(--el-border-color); }
.viewport-lab__canvas { box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; height: 100%; padding: 24px; background: #12232a; color: #eaf6f8; font-size: 18px; }
header { display: flex; justify-content: space-between; gap: 16px; font-size: 24px; }
header span { color: #82d5b1; font-size: 14px; }
.viewport-lab__metrics { display: flex; flex-wrap: wrap; gap: 16px; }
article { display: grid; gap: 10px; flex: 1; padding: 12px; border-left: 3px solid #82d5b1; }
strong { font-size: 32px; color: #f1cc78; }
.viewport-lab__bars { display: flex; flex: 1; align-items: end; justify-content: space-around; gap: 12px; min-height: 40px; }
i { flex: 1; max-width: 70px; background: #69bca5; }
button { align-self: start; cursor: pointer; }
@media (max-width: 600px) { header span { display: none; } }
</style>
