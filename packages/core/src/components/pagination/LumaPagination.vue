<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { PaginationChangePayload } from './types'
import { ElPagination } from 'element-plus'
import { computed, useTemplateRef } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  total: number
  pageSizes?: number[]
  disabled?: boolean
}>(), {
  pageSizes: () => [10, 20, 50, 100],
  disabled: false,
})

const emit = defineEmits<{
  change: [payload: PaginationChangePayload]
}>()

const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })

/***********************模板引用*********************/
const paginationRef = useTemplateRef<ComponentPublicInstance>('paginationRef')

/***********************分页状态*********************/
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / pageSize.value)))

/***********************事件处理*********************/
function emitChange(nextPage: number, nextPageSize: number): void {
  emit('change', {
    page: nextPage,
    pageSize: nextPageSize,
  })
}

function updatePage(nextPage: number): void {
  if (props.disabled) {
    return
  }

  const normalizedPage = Math.min(Math.max(nextPage, 1), totalPages.value)
  page.value = normalizedPage
  emitChange(normalizedPage, pageSize.value)
}

function updatePageSize(nextPageSize: number): void {
  if (props.disabled) {
    return
  }

  pageSize.value = nextPageSize
  page.value = 1
  emitChange(1, nextPageSize)
}

/***********************公开方法*********************/
defineExpose({
  getPaginationElement: () => paginationRef.value?.$el as HTMLElement | undefined,
  getPaginationInstance: () => paginationRef.value,
})
</script>

<template>
  <ElPagination
    ref="paginationRef"
    class="luma-pagination"
    background
    layout="total, sizes, prev, pager, next, jumper"
    :current-page="page"
    :page-size="pageSize"
    :page-sizes="pageSizes"
    :total="total"
    :disabled="disabled"
    @current-change="updatePage"
    @size-change="updatePageSize"
  />
</template>

<style scoped lang="scss">
.luma-pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
