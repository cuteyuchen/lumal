<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { LumalChartPanel } from '@lumal/charts'
import { LumalPage } from '@lumal/core/components'
import { ElButton, ElMessage, ElOption, ElSelect, ElTable, ElTableColumn } from 'element-plus'
import { computed, shallowRef } from 'vue'
import { chartRows } from './example-data'
// ECharts 按需注册（副作用），随图表 chunk 一起加载，避免进入首包
import '../../echarts'

/***********************面板状态*********************/
const loading = shallowRef(false)
const error = shallowRef<string | false>(false)
const range = shallowRef('7d')
const view = shallowRef<'chart' | 'table'>('chart')
const visibleRows = computed(() => range.value === '3d' ? chartRows.slice(-3) : chartRows)

const options = computed<EChartsOption>(() => ({
  grid: { bottom: 32, left: 48, right: 16, top: 24 },
  series: [
    {
      areaStyle: {},
      data: visibleRows.value.map(row => row.value),
      smooth: true,
      type: 'line',
    },
  ],
  tooltip: { trigger: 'axis' },
  xAxis: {
    boundaryGap: false,
    data: visibleRows.value.map(row => row.label),
    type: 'category',
  },
  yAxis: { type: 'value' },
}))

/***********************事件处理*********************/
function refresh(): void {
  loading.value = true
  error.value = false
  window.setTimeout(() => {
    loading.value = false
  }, 600)
}

function simulateError(): void {
  error.value = '演示数据源暂时不可用'
}

function handleExport(mode: 'chart' | 'table'): void {
  ElMessage.success(`已准备${mode === 'chart' ? '图表' : '表格'}导出数据`)
}
</script>

<template>
  <main class="lumal-admin-example">
    <LumalPage title="Chart Panel" description="演示查询、加载、错误恢复、图表/表格切换、导出和无障碍摘要。">
      <LumalChartPanel
        v-model:view="view"
        title="模块完成度趋势"
        :options="options"
        :loading="loading"
        :error="error"
        :no-data="visibleRows.length === 0"
        :summary="`当前展示 ${visibleRows.length} 个阶段的模块完成度趋势。`"
        show-view-toggle
        show-export
        height="320px"
        @retry="refresh"
        @export="handleExport"
      >
        <template #query>
          <div class="lumal-admin-chart-query">
            <span>统计周期</span>
            <ElSelect v-model="range" aria-label="统计周期" style="width: 160px">
              <ElOption label="最近 3 个阶段" value="3d" />
              <ElOption label="全部阶段" value="7d" />
            </ElSelect>
          </div>
        </template>
        <template #actions>
          <ElButton :loading="loading" @click="refresh">
            刷新
          </ElButton>
          <ElButton type="danger" plain @click="simulateError">
            模拟失败
          </ElButton>
        </template>
        <template #table>
          <ElTable :data="visibleRows" height="100%">
            <ElTableColumn prop="label" label="阶段" min-width="140" />
            <ElTableColumn prop="value" label="完成度" min-width="120" />
          </ElTable>
        </template>
      </LumalChartPanel>
    </LumalPage>
  </main>
</template>

<style scoped>
.lumal-admin-chart-query {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
