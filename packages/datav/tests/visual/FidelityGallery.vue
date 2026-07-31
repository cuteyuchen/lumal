<script setup lang="ts">
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
  LumalFullScreenContainer,
  LumalLoading,
  LumalPercentPond,
  LumalScrollBoard,
  LumalScrollRankingBoard,
  LumalWaterLevelPond,
} from '../../src'

const digitalConfig = {
  animationFrame: 0,
  content: '{nt} 台',
  number: [1286],
}
const percentConfig = { value: 68 }
const waterConfig = { data: [68], shape: 'round' as const }
const activeRingConfig = {
  activeTimeGap: 600000,
  animationFrame: 50,
  color: ['#37a2da', '#32c5e9', '#67e0e3'],
  data: [
    { name: '甲', value: 20 },
    { name: '乙', value: 60 },
    { name: '丙', value: 40 },
  ],
  digitalFlopStyle: { fill: '#fff', fontSize: 25 },
}
const capsuleConfig = {
  colors: ['#37a2da', '#32c5e9', '#67e0e3'],
  data: [
    { name: '甲', value: 20 },
    { name: '乙', value: 60 },
    { name: '丙', value: 40 },
  ],
  showValue: true,
  unit: '件',
}
const conicalConfig = {
  columnColor: 'rgba(0, 194, 255, 0.4)',
  data: [
    { name: '甲', value: 20 },
    { name: '乙', value: 60 },
    { name: '丙', value: 40 },
  ],
  showValue: true,
  textColor: '#fff',
}
const chartsConfig = {
  series: [{
    animationFrame: 50,
    data: [
      { name: '甲', value: 20 },
      { name: '乙', value: 60 },
      { name: '丙', value: 40 },
    ],
    outsideLabel: { show: false },
    type: 'pie',
  }],
}
const flylineConfig = {
  centerPoint: [0.5, 0.5] as const,
  duration: [20, 20] as const,
  halo: { duration: 30, show: true },
  points: [
    { position: [0.12, 0.2] as const, text: '节点甲' },
    { position: [0.82, 0.72] as const, text: '节点乙' },
  ],
  relative: true,
}
const enhancedFlylineConfig = {
  line: { duration: [20, 20] as const },
  lines: [
    { source: '甲', target: '乙' },
    { source: '丙', target: '乙' },
  ],
  points: [
    { coordinate: [0.12, 0.2] as const, name: '甲' },
    { coordinate: [0.82, 0.72] as const, name: '乙' },
    { coordinate: [0.2, 0.8] as const, name: '丙' },
  ],
  relative: true,
  text: { show: true },
}
const scrollBoardConfig = {
  align: ['center', 'left', 'right'] as const,
  data: [
    ['甲区', 20, '正常'],
    ['乙区', 60, '告警'],
    ['丙区', 40, '正常'],
    ['丁区', 30, '正常'],
  ],
  header: ['区域', '数量', '状态'],
  index: true,
  rowNum: 3,
  waitTime: 600000,
}
const scrollRankingConfig = {
  data: [
    { name: '甲区', value: 20 },
    { name: '乙区', value: 60 },
    { name: '丙区', value: 40 },
    { name: '丁区', value: 30 },
  ],
  rowNum: 3,
  unit: '件',
  waitTime: 600000,
}
</script>

<template>
  <main class="fidelity-grid">
    <div v-for="variant in 13" :key="`border-${variant}`" class="fidelity-item" :data-component="`borderBox${variant}`">
      <LumalBorderBox :variant="variant" background="transparent" />
    </div>
    <div
      v-for="variant in 12"
      :key="`decoration-${variant}`"
      class="fidelity-item fidelity-item--decoration"
      :data-component="`decoration${variant}`"
    >
      <LumalDecoration :variant="variant" />
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="loading">
      <LumalLoading>加载中</LumalLoading>
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="digitalFlop">
      <LumalDigitalFlop :config="digitalConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core fidelity-item--pond" data-component="percentPond">
      <LumalPercentPond :config="percentConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core fidelity-item--water" data-component="waterLevelPond">
      <LumalWaterLevelPond :config="waterConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="activeRingChart">
      <LumalActiveRingChart :config="activeRingConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core fidelity-item--compact" data-component="activeRingChartCompact">
      <LumalActiveRingChart :config="activeRingConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="capsuleChart">
      <LumalCapsuleChart :config="capsuleConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core fidelity-item--compact" data-component="capsuleChartCompact">
      <LumalCapsuleChart :config="capsuleConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="conicalColumnChart">
      <LumalConicalColumnChart :config="conicalConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core fidelity-item--compact" data-component="conicalColumnChartCompact">
      <LumalConicalColumnChart :config="conicalConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="fullScreenContainer">
      <LumalFullScreenContainer :width="400" :height="200">
        <div class="fullscreen-sample">
          全屏容器
        </div>
      </LumalFullScreenContainer>
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="charts">
      <LumalCharts :option="chartsConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="flylineChart">
      <LumalFlylineChart :config="flylineConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="flylineChartEnhanced">
      <LumalFlylineChartEnhanced :config="enhancedFlylineConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="scrollBoard">
      <LumalScrollBoard :config="scrollBoardConfig" />
    </div>
    <div class="fidelity-item fidelity-item--core" data-component="scrollRankingBoard">
      <LumalScrollRankingBoard :config="scrollRankingConfig" />
    </div>
  </main>
</template>

<style>
* { box-sizing: border-box; }
html, body { margin: 0; min-width: 1280px; background: #081322; color: #fff; }
body { padding: 20px; font-family: Arial, sans-serif; }
.fidelity-grid { display: grid; grid-template-columns: repeat(2, 400px); gap: 16px; }
.fidelity-item { position: relative; width: 400px; height: 200px; overflow: hidden; background: #081322; }
.fidelity-item--decoration { height: 100px; }
.fidelity-item--decoration > div { width: 100%; height: 100%; }
.fidelity-item[data-component="decoration9"],
.fidelity-item[data-component="decoration12"] { width: 100px; }
.fidelity-item--core > div { width: 100%; height: 100%; }
.fidelity-item--pond { height: 100px; }
.fidelity-item--water { width: 200px; height: 200px; }
.fidelity-item--compact { width: 300px; height: 160px; }
.fidelity-item[data-component="fullScreenContainer"] .lumal-full-screen-container {
  position: absolute !important;
  width: 400px !important;
  height: 200px !important;
  z-index: 0 !important;
}
.fidelity-item[data-component="fullScreenContainer"] .lumal-full-screen-container__stage {
  position: absolute !important;
  width: 400px !important;
  height: 200px !important;
  transform: none !important;
}
.fullscreen-sample { display: grid; width: 100%; height: 100%; border: 1px solid #00baff; place-items: center; }
</style>
