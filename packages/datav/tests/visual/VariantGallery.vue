<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import {
  LumalActiveRingChart,
  LumalBorderBox,
  LumalCapsuleChart,
  LumalCharts,
  LumalConicalColumnChart,
  LumalDecoration,
  LumalDigitalFlop,
  LumalFlylineChart,
  LumalFlylineChartEnhanced,
  LumalLoading,
  LumalPercentPond,
  LumalScrollBoard,
  LumalScrollRankingBoard,
  LumalWaterLevelPond,
} from '../../src'

/***********************画廊展示状态*********************/
const dark = shallowRef(true)
const activeKey = shallowRef<string | number>('online')
const activeRingConfig = computed(() => ({
  digitalFlopStyle: { fill: dark.value ? '#fff' : '#102a43' },
}))

/***********************固定演示数据*********************/
const items = [
  { key: 'online', label: '在线设备', value: 86, color: '#35c8ff' },
  { key: 'warning', label: '告警设备', value: 23, color: '#ffb45c' },
  { key: 'offline', label: '离线设备', value: 12, color: '#796cff' },
]
const rows = Array.from({ length: 8 }, (_, index) => ({ id: index, name: `区域 ${index + 1}`, value: 98 - index * 4 }))
// Canvas 的 JavaScript 动画不会被截图的 CSS 动画选项冻结；运行态动效另有独立测试。
const chartsOption = { animation: false, series: [{ type: 'pie' as const, data: items.map(item => ({ name: item.label, value: item.value })), outsideLabel: { show: false } }] }
const flylineConfig = {
  centerPoint: [0.5, 0.5] as const,
  duration: [20, 20] as const,
  points: [{ position: [0.12, 0.2] as const, text: '节点甲' }, { position: [0.82, 0.72] as const, text: '节点乙' }],
  relative: true,
}
const enhancedFlylineConfig = {
  line: { duration: [20, 20] as const },
  lines: [{ source: '甲', target: '乙' }, { source: '丙', target: '乙' }],
  points: [
    { coordinate: [0.12, 0.2] as const, name: '甲' },
    { coordinate: [0.82, 0.72] as const, name: '乙' },
    { coordinate: [0.2, 0.8] as const, name: '丙' },
  ],
  relative: true,
}
</script>

<template>
  <main class="gallery" :class="[{ 'is-light': !dark }]">
    <header>
      <div><strong>@lumal/datav</strong><span>Variant Gallery</span></div>
      <button type="button" @click="dark = !dark">
        切换{{ dark ? '浅色' : '深色' }}
      </button>
    </header>

    <section>
      <h1>13 Border Boxes</h1>
      <div class="border-grid">
        <LumalBorderBox v-for="variant in 13" :key="variant" :variant="variant as 1">
          <div class="sample">
            Border {{ variant }}
          </div>
        </LumalBorderBox>
      </div>
    </section>

    <section>
      <h1>12 Decorations</h1>
      <div class="decoration-grid">
        <LumalDecoration v-for="variant in 12" :key="variant" :variant="variant as 1">
          <span>Decoration {{ variant }}</span>
        </LumalDecoration>
      </div>
    </section>

    <section>
      <h1>Core Components</h1>
      <div class="component-grid">
        <article><h2>Digital Flop</h2><LumalDigitalFlop :value="12860" suffix=" 台" :duration="0" /></article>
        <article><h2>Loading</h2><LumalLoading label="加载实时数据" /></article>
        <article><h2>Percent Pond</h2><LumalPercentPond :value="92.6" /></article>
        <article class="water">
          <h2>Water Level</h2><LumalWaterLevelPond :value="68" />
        </article>
        <article class="wide">
          <h2>Active Ring</h2><LumalActiveRingChart v-model:active-key="activeKey" :items="items" :config="activeRingConfig" :autoplay="false" />
        </article>
        <article class="wide">
          <h2>Capsule Chart</h2><LumalCapsuleChart :items="items" sort="desc" unit="台" />
        </article>
        <article class="wide conical">
          <h2>Conical Column</h2><LumalConicalColumnChart :items="items" unit="台" />
        </article>
        <article class="wide conical">
          <h2>Charts</h2><LumalCharts :option="chartsOption" />
        </article>
        <article class="wide conical">
          <h2>Flyline Chart</h2><LumalFlylineChart :config="flylineConfig" />
        </article>
        <article class="wide conical">
          <h2>Flyline Chart Enhanced</h2><LumalFlylineChartEnhanced :config="enhancedFlylineConfig" />
        </article>
        <article class="wide list">
          <h2>Scroll Board</h2><LumalScrollBoard :rows="rows" row-key="id" :visible-rows="3" :autoplay="false">
            <template #default="{ row, index }">
              <span class="custom-row"><b>{{ index + 1 }}</b>{{ row.name }}<strong>{{ row.value }}%</strong></span>
            </template>
          </LumalScrollBoard>
        </article>
        <article class="wide list">
          <h2>Ranking Board</h2><LumalScrollRankingBoard :items="rows.map(row => ({ key: row.id, label: row.name, value: row.value }))" :visible-rows="3" :interval="0" unit="%" />
        </article>
      </div>
    </section>
  </main>
</template>

<style>
html, body, #app { min-width: 100%; min-height: 100%; margin: 0; }
body { background: #061226; font-family: Inter, "Microsoft YaHei", sans-serif; }
.gallery { min-height: 100vh; padding: 28px; color: var(--lumal-datav-text); background: radial-gradient(circle at 50% 0, #12365d, #061226 48%); }
.gallery.is-light { --lumal-datav-background: rgb(255 255 255 / 82%); --lumal-datav-surface: rgb(230 244 252 / 90%); --lumal-datav-surface-muted: rgb(210 233 246 / 70%); --lumal-datav-text: #102a43; --lumal-datav-text-muted: #526d82; --lumal-datav-border: rgb(34 133 186 / 34%); background: #eaf5fb; }
.gallery.is-light .active-ring-name { color: var(--lumal-datav-text); }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
header div { display: flex; gap: 12px; align-items: baseline; } header strong { font-size: 24px; } header span { color: var(--lumal-datav-text-muted); }
header button { padding: 8px 14px; color: inherit; background: var(--lumal-datav-surface); border: 1px solid var(--lumal-datav-border); border-radius: 8px; cursor: pointer; }
h1 { margin: 28px 0 14px; font-size: 17px; } h2 { margin: 0 0 14px; color: var(--lumal-datav-text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; }
.border-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.border-grid > * { height: 112px; } .sample { display: grid; height: 100%; place-items: center; color: var(--lumal-datav-text-muted); }
.decoration-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.decoration-grid > * { height: 44px; } .decoration-grid span { display: grid; height: 100%; place-items: center; font-size: 11px; }
.component-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
article { min-height: 100px; padding: 16px; background: var(--lumal-datav-background); border: 1px solid var(--lumal-datav-border); border-radius: 10px; }
article .lumal-digital-flop { font-size: 30px; } article.water { height: 180px; } article.water .lumal-water-level-pond { width: 120px; height: 120px; margin: auto; }
/* 标题与图表分别占据独立网格行，避免 100% 图表高度反过来撑大 auto/min-height 卡片。 */
article.wide { display: grid; grid-template-rows: auto minmax(0, 1fr); grid-column: span 2; height: 220px; } article.conical { height: 250px; } article.list { height: 220px; }
.custom-row { display: grid; width: 100%; grid-template-columns: 28px 1fr auto; gap: 8px; align-items: center; padding: 8px 10px; } .custom-row b { color: var(--lumal-datav-primary); }
@media (max-width: 1100px) { .border-grid, .component-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .decoration-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
