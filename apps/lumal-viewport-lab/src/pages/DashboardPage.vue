<script setup lang="ts">
import { useViewportWidth, viewportLength } from '@lumal/viewport'
import { ElButton, ElDialog, ElOption, ElSelect, ElTable, ElTableColumn, ElTooltip } from 'element-plus'
import { shallowRef } from 'vue'
import MapSurface from '../components/MapSurface.vue'
import TrendSurface from '../components/TrendSurface.vue'

/***********************独立浮层与数字设计尺寸*********************/
const viewport = useViewportWidth()
const dialog = shallowRef(false)
const tableReady = shallowRef(false)
const selected = shallowRef('all')
const rows = Array.from({ length: 24 }, (_, index) => ({ id: index + 1, name: `示例 ${index + 1}`, value: 10 + index }))
</script>

<template>
  <section class="workspace" data-testid="workspace">
    <MapSurface />
    <div class="overlay-grid">
      <section class="lab-panel tools" data-testid="tools">
        <ElSelect v-model="selected" aria-label="选择分组" style="width: 140px">
          <ElOption label="全部" value="all" /><ElOption label="分组 A" value="a" />
        </ElSelect>
        <ElTooltip content="统计详情" placement="bottom">
          <ElButton @click="dialog = true">
            统计详情
          </ElButton>
        </ElTooltip>
      </section>
      <section class="lab-panel risk" data-testid="risk">
        <h2>区域概览</h2><p v-for="row in rows" :key="row.id">
          {{ row.name }}: {{ row.value }}
        </p>
      </section>
      <section class="lab-panel statistics" data-testid="statistics">
        <h2>统计摘要</h2><p v-for="row in rows" :key="row.id">
          {{ row.name }}: {{ row.value }}
        </p>
      </section>
      <section class="lab-panel legend" data-testid="legend">
        <h2>图例</h2><p>低 / 中 / 高</p>
      </section>
      <section class="lab-panel trend" data-testid="trend">
        <TrendSurface />
      </section>
    </div>
    <ElDialog
      v-model="dialog" title="统计详情" :width="viewportLength(640)" append-to-body destroy-on-close
      @opened="tableReady = true" @closed="tableReady = false"
    >
      <!-- 固定局部滚动区并在入场结束后测量，不以表格内容反推弹窗高度。 -->
      <ElTable v-if="tableReady" :data="rows" :height="viewport.pixels(240)">
        <ElTableColumn prop="name" label="名称" :min-width="viewport.pixels(140)" /><ElTableColumn prop="value" label="值" :min-width="viewport.pixels(100)" />
      </ElTable>
    </ElDialog>
  </section>
</template>

<style scoped>
.workspace { position: relative; width: 100%; height: 900px; min-width: 0; flex: none; }
.overlay-grid { position: absolute; inset: 12px; display: grid; grid-template-columns: minmax(0, 22%) minmax(0, 1fr) minmax(0, 22%); grid-template-rows: 56px minmax(0, 1fr) minmax(80px, 24%); gap: 12px; pointer-events: none; }
.overlay-grid > * { pointer-events: auto; font-size: 14px; line-height: 20px; }
.tools { grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; overflow: visible; }
.risk { grid-area: 2 / 1; }
.statistics { grid-area: 2 / 3; }
.legend { grid-area: 3 / 1; }
.trend { grid-area: 3 / 2 / 4 / 4; padding: 4px; }
</style>
