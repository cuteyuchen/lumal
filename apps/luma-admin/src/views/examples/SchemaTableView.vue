<script setup lang="ts">
import type { SchemaTablePaginationChangePayload, SchemaTableRow } from '@luma/core/components'
import { LumaInfoTable, LumaPage, LumaSchemaTable } from '@luma/core/components'
import { computed, shallowRef } from 'vue'
import { exampleTableColumns, exampleTableRows } from './example-data'

/***********************表格状态*********************/
const page = shallowRef(1)
const pageSize = shallowRef(10)
const selectedRows = shallowRef<SchemaTableRow[]>([])
const selectedRowKeys = shallowRef<Array<string | number>>([])

const tableStateItems = computed(() => [
  { label: '当前页', value: String(page.value) },
  { label: '每页条数', value: String(pageSize.value) },
  { label: '选中行数', value: String(selectedRows.value.length) },
  { label: '选中主键', value: selectedRowKeys.value.join(', ') || '-' },
  { label: '辅助列', value: 'selection / index' },
])

/***********************事件处理*********************/
function handleSelectionChange(rows: SchemaTableRow[], rowKeys: Array<string | number>): void {
  selectedRows.value = rows
  selectedRowKeys.value = rowKeys
}

function handlePageChange(payload: SchemaTablePaginationChangePayload): void {
  page.value = payload.page
  pageSize.value = payload.pageSize
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Schema Table" description="验证字段插槽、列设置、选择主键、树表、自动布局和字典回显。">
      <div class="luma-admin-example__two-columns">
        <LumaSchemaTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="exampleTableColumns"
          :rows="exampleTableRows"
          row-key="id"
          selection
          show-column-settings
          show-index
          pagination
          :total="36"
          :table-props="{ border: true, stripe: true }"
          @selection-change="handleSelectionChange"
          @page-change="handlePageChange"
        >
          <template #table-name="{ value }">
            <strong>{{ value }}</strong>
          </template>
          <template #actions="{ row }">
            <button class="luma-admin-example__button" type="button">
              {{ row?.status === 'enabled' ? '查看' : '编辑' }}
            </button>
          </template>
        </LumaSchemaTable>

        <LumaInfoTable :items="tableStateItems" label-width="88px" />
      </div>
    </LumaPage>
  </main>
</template>
