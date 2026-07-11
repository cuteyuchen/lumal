<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { LumaChart } from '@luma/charts'
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import { ElButton, ElRadioButton, ElRadioGroup, ElSlider } from 'element-plus'
import { computed, shallowRef } from 'vue'
import { chartRows } from './example-data'

const chartType = shallowRef<'bar' | 'line'>('bar')
const scale = shallowRef(100)
const empty = shallowRef(false)
const selected = shallowRef('尚未选择数据点')
const rows = computed(() => empty.value ? [] : chartRows.map(row => ({ ...row, value: Math.round(row.value * scale.value / 100) })))
const options = computed<EChartsOption>(() => ({
  grid: { bottom: 32, left: 48, right: 16, top: 24 },
  series: [{ data: rows.value.map(row => ({ itemStyle: { color: row.color }, value: row.value })), smooth: true, type: chartType.value }],
  tooltip: { trigger: 'axis' },
  xAxis: { data: rows.value.map(row => row.label), type: 'category' },
  yAxis: { type: 'value' },
}))
const stateItems = computed(() => [{ label: '图表类型', value: chartType.value }, { label: '数据比例', value: `${scale.value}%` }, { label: '数据点', value: rows.value.length }, { label: '交互反馈', value: selected.value }])
function handleClick(params: { name?: string, value?: unknown }): void {
  selected.value = `${params.name ?? '-'}：${String(params.value ?? '-')}`
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="基础图表" description="切换类型、调整数据并验证空状态与图表事件。">
      <div class="chart-controls">
        <ElRadioGroup v-model="chartType">
          <ElRadioButton value="bar">
            柱状图
          </ElRadioButton><ElRadioButton value="line">
            折线图
          </ElRadioButton>
        </ElRadioGroup><span>数据比例</span><ElSlider v-model="scale" :min="20" :max="150" class="chart-slider" /><ElButton @click="empty = !empty">
          {{ empty ? '恢复数据' : '模拟空数据' }}
        </ElButton>
      </div>
      <div v-if="rows.length" class="chart-canvas">
        <LumaChart :options="options" height="340px" @click="handleClick" />
      </div><div v-else class="chart-empty">
        暂无图表数据，点击“恢复数据”继续体验。
      </div>
      <LumaInfoTable :items="stateItems" :columns="2" label-width="88px" />
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.chart-controls{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:20px}.chart-slider{width:220px}.chart-canvas{height:340px}.chart-empty{display:grid;height:340px;place-items:center;color:var(--el-text-color-secondary);border:1px dashed var(--el-border-color);margin-bottom:16px}
</style>
