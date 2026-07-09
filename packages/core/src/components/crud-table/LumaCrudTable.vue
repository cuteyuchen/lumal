<script setup lang="ts">
import type { PaginationChangePayload } from '../pagination'
import type { SchemaFormModel } from '../schema-form'
import type { CrudTableProps, CrudTableResetPayload, CrudTableSearchPayload } from './types'
import { ElButton } from 'element-plus'
import { computed, useTemplateRef } from 'vue'
import { LumaPage } from '../page'
import { LumaPagination } from '../pagination'
import { LumaSchemaForm, normalizeSchemaFormItems, resolveSchemaFormInitialModel } from '../schema-form'
import { LumaSchemaTable } from '../schema-table'

/***********************属性定义*********************/
const props = withDefaults(defineProps<CrudTableProps>(), {
  rows: () => [],
  querySchemas: () => [],
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  pagination: true,
  loading: false,
  emptyText: '暂无数据',
  searchText: '查询',
  resetText: '重置',
})

const emit = defineEmits<{
  (event: 'search', payload: CrudTableSearchPayload): void
  (event: 'reset', payload: CrudTableResetPayload): void
  (event: 'pageChange', payload: PaginationChangePayload): void
}>()

const queryModel = defineModel<SchemaFormModel>('queryModel', {
  default: () => ({}),
})

const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })

/***********************模板引用*********************/
const crudRef = useTemplateRef<HTMLElement>('crudRef')

/***********************查询状态*********************/
const hasQuery = computed(() => props.querySchemas.length > 0)

const queryDefaultModel = computed(() => {
  const normalizedSchemas = normalizeSchemaFormItems(props.querySchemas)
  return resolveSchemaFormInitialModel(normalizedSchemas)
})

/***********************分页状态*********************/
const showPagination = computed(() => props.pagination && props.total > 0)

/***********************事件处理*********************/
function handleSearchClick(): void {
  emit('search', {
    ...queryModel.value,
  })
}

function handleResetClick(): void {
  const nextModel = {
    ...queryDefaultModel.value,
  }
  queryModel.value = nextModel
  emit('reset', nextModel)
}

function handlePageChange(payload: PaginationChangePayload): void {
  emit('pageChange', payload)
}

/***********************公开方法*********************/
defineExpose({
  getCrudElement: () => crudRef.value,
})
</script>

<template>
  <div ref="crudRef" class="luma-crud-table">
    <LumaPage
      :title="title"
      :description="description"
      :loading="loading"
    >
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>

      <div v-if="hasQuery" class="luma-crud-table__query">
        <LumaSchemaForm v-model="queryModel" :schemas="querySchemas" />
        <div class="luma-crud-table__query-actions">
          <ElButton
            type="primary"
            native-type="button"
            data-action="search"
            @click="handleSearchClick"
          >
            {{ searchText }}
          </ElButton>
          <ElButton
            native-type="button"
            data-action="reset"
            @click="handleResetClick"
          >
            {{ resetText }}
          </ElButton>
        </div>
      </div>

      <div class="luma-crud-table__body">
        <LumaSchemaTable
          :columns="columns"
          :rows="rows"
          :row-key="rowKey"
          :empty-text="emptyText"
        />
      </div>

      <div v-if="$slots.default" class="luma-crud-table__extra">
        <slot />
      </div>

      <div v-if="showPagination" class="luma-crud-table__pagination">
        <LumaPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="pageSizes"
          @change="handlePageChange"
        />
      </div>
    </LumaPage>
  </div>
</template>

<style scoped lang="scss">
.luma-crud-table {
  min-width: 0;
}

.luma-crud-table__query {
  display: grid;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.luma-crud-table__query-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.luma-crud-table__body {
  min-width: 0;
}

.luma-crud-table__extra {
  min-width: 0;
}

.luma-crud-table__pagination {
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
</style>
