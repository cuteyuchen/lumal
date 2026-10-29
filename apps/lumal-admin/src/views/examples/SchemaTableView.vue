<script setup lang="ts">
import type { SchemaTablePaginationChangePayload, SchemaTableRow } from '@lumal/core/components'
import { LumalInfoTable, LumalPage, LumalSchemaTable } from '@lumal/core/components'
import { computed, shallowRef } from 'vue'
import { exampleTableColumns, exampleTableRows } from './example-data'

/***********************表格状态*********************/
const page = shallowRef(1)
const pageSize = shallowRef(10)
const selectedRows = shallowRef<SchemaTableRow[]>([])
const selectedRowKeys = shallowRef<Array<string | number>>([])
const loading = shallowRef(false)
const error = shallowRef<false | string>(false)
const empty = shallowRef(false)

const tableStateItems = computed(() => [
  { label: '当前页', value: String(page.value) },
  { label: '每页条数', value: String(pageSize.value) },
  { label: '选中行数', value: String(selectedRows.value.length) },
  { label: '选中主键', value: selectedRowKeys.value.join(', ') || '-' },
  { label: '辅助列', value: 'selection / index' },
  { label: '当前状态', value: error.value ? '错误' : loading.value ? '加载中' : empty.value ? '空数据' : '正常' },
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

function handleRetry(): void {
  error.value = false
}
</script>

<template>
  <main class="lumal-admin-example">
    <LumalPage title="Schema Table" description="验证字段插槽、列设置、选择主键、树表、自动布局和字典回显。">
      <template #actions>
        <button class="lumal-admin-example__button" type="button" @click="loading = !loading">
          切换 Loading
        </button>
        <button class="lumal-admin-example__button" type="button" @click="empty = !empty">
          切换空数据
        </button>
        <button class="lumal-admin-example__button" type="button" @click="error = '表格数据加载失败'">
          模拟错误
        </button>
      </template>
      <div class="lumal-admin-example__two-columns">
        <LumalSchemaTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="exampleTableColumns"
          :rows="empty ? [] : exampleTableRows"
          :loading="loading"
          :error="error"
          row-key="id"
          selection
          :column-settings="{ enabled: true, reorderable: true, storageKey: 'lumal-example:schema-table-columns' }"
          show-index
          pagination
          :total="36"
          :table-props="{ border: true, stripe: true }"
          @selection-change="handleSelectionChange"
          @page-change="handlePageChange"
          @retry="handleRetry"
        >
          <template #table-name="{ value }">
            <strong>{{ value }}</strong>
          </template>
          <template #actions="{ row }">
            <button class="lumal-admin-example__button" type="button">
              {{ row?.status === 'enabled' ? '查看' : '编辑' }}
            </button>
          </template>
        </LumalSchemaTable>

        <LumalInfoTable :items="tableStateItems" :label-width="88" />
      </div>
    </LumalPage>
  </main>
</template>
