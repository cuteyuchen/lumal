<script setup lang="ts">
import type { ViewportPolicy } from '@lumal/viewport'
import { computeViewportFontSize, LumalViewport, useViewportPolicy } from '@lumal/viewport'
import { ref } from 'vue'

/***********************普通 Vue 消费者，只由 LumalViewport 缩放*********************/
const props = defineProps<{ policy?: ViewportPolicy | false }>()
const viewportPolicy = useViewportPolicy(() => props.policy)
const selected = ref(0)
</script>

<template>
  <LumalViewport v-slot="{ scale, size }" :policy="policy">
    <section class="viewport-canvas">
      <header><h2>节点运行总览</h2><span>{{ size.width }} × {{ size.height }}</span></header>
      <div class="viewport-canvas__metrics">
        <article v-for="(value, index) in [128, 362, 98]" :key="value">
          <span>{{ ['在线节点', '运行链路', '健康指数'][index] }}</span><strong>{{ value }}</strong>
        </article>
      </div>
      <div class="viewport-canvas__chart" aria-label="运行趋势">
        <i v-for="value in [38, 65, 42, 80, 59, 92, 72]" :key="value" :style="{ height: `${value}%` }" />
      </div>
      <footer :style="{ fontSize: `${computeViewportFontSize(16, scale, viewportPolicy.minFontSize) / scale}px` }">
        <span data-testid="viewport-font">告警确认</span>
        <button type="button" @click="selected++">
          确认 · {{ selected }}
        </button>
      </footer>
    </section>
  </LumalViewport>
</template>

<style scoped>
.viewport-canvas { display: flex; box-sizing: border-box; height: 100%; flex-direction: column; gap: 24px; padding: 24px; background: #122c31; color: #e9f9f6; }
header, footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
h2 { margin: 0; font-size: calc(var(--lumal-font-size-base, 14px) + 10px); }
header span { color: #8dd1c2; }
.viewport-canvas__metrics { display: flex; flex-wrap: wrap; gap: 24px; }
article { display: grid; flex: 1; gap: 12px; padding: 12px; border-left: 3px solid #8dd1c2; }
strong { font-size: calc(var(--lumal-font-size-base, 14px) + 22px); color: #f3d386; }
.viewport-canvas__chart { display: flex; flex: 1; align-items: end; gap: 24px; min-height: 30px; }
i { flex: 1; height: 60%; background: #66b7a6; }
button { padding: 8px 16px; border: 1px solid #8dd1c2; border-radius: 4px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
</style>
