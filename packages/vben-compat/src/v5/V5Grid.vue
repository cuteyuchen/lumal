<script setup lang="ts">
import type { GridController, NativeTable } from './grid'
import { LumalPagination, LumalSchemaTable } from '@lumal/core/components'
import { LumalIcon } from '@lumal/icons-vue'
import { useViewportWidth } from '@lumal/viewport'
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

/***********************表格渲染与生命周期*********************/
const props = defineProps<{ controller: GridController, tableTitle?: string }>()
const viewport = useViewportWidth()
const tableRef = useTemplateRef<NativeTable>('tableRef')
const state = computed(() => props.controller.state.value)
const grid = computed(() => state.value.gridOptions ?? {})
const pager = computed(() => grid.value.pagerConfig === false ? undefined : grid.value.pagerConfig)
const slots = computed(() => (grid.value.columns ?? []).filter(column => column.field && column.slots?.default))
const Form = props.controller.Form
onMounted(() => {
  if (tableRef.value)
    props.controller.mount(tableRef.value)
})
onBeforeUnmount(() => props.controller.unmount())
</script>

<template>
  <section class="lumal-v5-grid">
    <Form v-if="state.formOptions" v-show="state.showSearchForm" class="lumal-v5-grid__form" />
    <div v-if="controller.failure.value" class="lumal-v5-grid__error" role="alert">
      <span>{{ controller.failure.value instanceof Error ? controller.failure.value.message : String(controller.failure.value) }}</span>
      <button type="button" @click="controller.retry">
        重试
      </button>
    </div>
    <LumalSchemaTable
      ref="tableRef"
      :rows="controller.rows.value"
      :columns="controller.columns.value"
      :row-key="grid.rowConfig?.keyField ?? 'id'"
      :loading="controller.loading.value || grid.loading"
      :selection="grid.columns?.some(column => column.type === 'checkbox')"
      :show-column-settings="grid.toolbarConfig?.custom"
      :table-props="{ border: grid.border, stripe: grid.stripe, height: grid.height === 'auto' ? undefined : typeof grid.height === 'number' ? viewport.pixels(grid.height) : grid.height }"
      @sort-change="controller.changeSort"
      @selection-change="controller.select"
    >
      <template #toolbar-title>
        {{ tableTitle ?? state.tableTitle }}
      </template>
      <template #toolbar>
        <slot name="toolbar-actions" />
      </template>
      <template #toolbar-tools>
        <slot name="toolbar-tools" />
        <button v-if="grid.toolbarConfig?.search && state.formOptions" type="button" title="切换查询" aria-label="切换查询" @click="controller.api.toggleSearchForm()">
          <LumalIcon name="lumal:filter" />
        </button>
        <button v-if="grid.toolbarConfig?.refresh !== false" type="button" title="刷新" aria-label="刷新" @click="controller.retry">
          <LumalIcon name="lumal:refresh" />
        </button>
      </template>
      <template v-for="column in slots" :key="column.field" #[`table-${column.field}`]="scope">
        <slot :name="column.slots!.default!" :row="scope.row" :row-index="scope.index" :column="column" />
      </template>
    </LumalSchemaTable>
    <LumalPagination
      v-if="grid.pagerConfig !== false && pager?.enabled !== false"
      :page="controller.page.value"
      :page-size="controller.pageSize.value"
      :page-sizes="pager?.pageSizes"
      :total="controller.total.value"
      @change="controller.changePage"
    />
  </section>
</template>

<style scoped>
.lumal-v5-grid {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
}
.lumal-v5-grid__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--el-color-danger);
}
.lumal-v5-grid button {
  min-width: 32px;
  min-height: 32px;
  padding: 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  cursor: pointer;
}
.lumal-v5-grid__form {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color);
}
</style>
