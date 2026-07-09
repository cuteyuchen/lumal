<script setup lang="ts">
import type { PaginationChangePayload } from './types'
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
const paginationRef = useTemplateRef<HTMLElement>('paginationRef')

/***********************分页状态*********************/
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / pageSize.value)))

const isPreviousDisabled = computed(() => props.disabled || page.value <= 1)

const isNextDisabled = computed(() => props.disabled || page.value >= totalPages.value)

const summaryText = computed(() => `共 ${props.total} 条 / ${totalPages.value} 页`)

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

function updatePageSize(event: Event): void {
  if (props.disabled) {
    return
  }

  const target = event.target as HTMLSelectElement | null
  const nextPageSize = Number(target?.value ?? pageSize.value)
  pageSize.value = nextPageSize
  page.value = 1
  emitChange(1, nextPageSize)
}

/***********************公开方法*********************/
defineExpose({
  getPaginationElement: () => paginationRef.value,
})
</script>

<template>
  <nav ref="paginationRef" class="luma-pagination" aria-label="分页">
    <span class="luma-pagination__summary">
      {{ summaryText }}
    </span>

    <div class="luma-pagination__controls">
      <button
        class="luma-pagination__button"
        type="button"
        data-action="previous"
        :disabled="isPreviousDisabled"
        @click="updatePage(page - 1)"
      >
        上一页
      </button>

      <span class="luma-pagination__current">
        {{ page }} / {{ totalPages }}
      </span>

      <button
        class="luma-pagination__button"
        type="button"
        data-action="next"
        :disabled="isNextDisabled"
        @click="updatePage(page + 1)"
      >
        下一页
      </button>

      <select
        class="luma-pagination__size"
        name="pageSize"
        :disabled="disabled"
        :value="pageSize"
        @change="updatePageSize"
      >
        <option v-for="size in pageSizes" :key="size" :value="size">
          {{ size }} 条/页
        </option>
      </select>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.luma-pagination {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  color: #374151;
  font-size: 14px;
}

.luma-pagination__summary {
  flex: none;
}

.luma-pagination__controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.luma-pagination__button,
.luma-pagination__size {
  min-height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #111827;
  background: #ffffff;
  font: inherit;
}

.luma-pagination__button {
  padding: 0 10px;
  cursor: pointer;
}

.luma-pagination__button:disabled,
.luma-pagination__size:disabled {
  color: #9ca3af;
  cursor: not-allowed;
  background: #f9fafb;
}

.luma-pagination__current {
  min-width: 52px;
  text-align: center;
}

.luma-pagination__size {
  padding: 0 8px;
}
</style>
