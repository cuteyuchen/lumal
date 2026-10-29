<script setup lang="ts">
import { ref } from 'vue'

/***********************普通设计 px 与交互状态*********************/
const selected = ref(0)
</script>

<template>
  <section class="viewport-canvas" data-testid="viewport-canvas">
    <header><h2>节点运行总览</h2><span>运行态势</span></header>
    <div class="viewport-canvas__metrics">
      <article v-for="(value, index) in [128, 362, 98]" :key="value">
        <span>{{ ['在线节点', '运行链路', '健康指数'][index] }}</span><strong>{{ value }}</strong>
      </article>
    </div>
    <div class="viewport-canvas__chart" aria-label="运行趋势">
      <i v-for="value in [38, 65, 42, 80, 59, 92, 72]" :key="value" :style="{ height: `${value}%` }" />
    </div>
    <footer>
      <span data-testid="viewport-font">告警确认</span>
      <button type="button" @click="selected++">
        确认 · {{ selected }}
      </button>
    </footer>
    <div class="viewport-canvas__probe" data-testid="viewport-probe" style="width: 192px; height: 96px" :style="{ marginTop: '24px' }" />
  </section>
</template>

<style scoped>
.viewport-canvas { position: relative; display: flex; box-sizing: border-box; width: 960px; min-height: 540px; flex-direction: column; gap: 24px; padding: 24px; background: #122c31; color: #e9f9f6; font-size: 14px; line-height: 20px; }
header, footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h2 { margin: 0; font-size: 24px; line-height: 32px; }
header span { color: #8dd1c2; }
.viewport-canvas__metrics { display: flex; gap: 24px; }
article { display: grid; flex: 1; gap: 12px; padding: 12px; border-left: 3px solid #8dd1c2; }
strong { font-size: 36px; line-height: 44px; color: #f3d386; }
.viewport-canvas__chart { display: flex; height: 160px; align-items: end; gap: 24px; }
i { flex: 1; background: #66b7a6; }
button { padding: 8px 16px; border: 1px solid #8dd1c2; border-radius: 4px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.viewport-canvas__probe { background: #66b7a6; border: 1px solid #8dd1c2; }
</style>
