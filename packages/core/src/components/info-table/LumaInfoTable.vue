<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { InfoTableItem, InfoTableProps } from './types'
import { computed, useTemplateRef } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<InfoTableProps>(), {
  bordered: true,
  columns: 1,
  emptyText: '-',
  labelWidth: '88px',
})

/***********************模板引用*********************/
const infoTableRef = useTemplateRef<HTMLElement>('infoTableRef')

/***********************展示状态*********************/
const visibleItems = computed(() => props.items.filter(item => !item.hidden))

const tableStyle = computed<CSSProperties>(() => ({
  '--luma-info-table-columns': String(Math.max(1, props.columns)),
}))

const labelStyle = computed<CSSProperties>(() => ({
  width: typeof props.labelWidth === 'number' ? `${props.labelWidth}px` : props.labelWidth,
}))

/***********************内容格式化*********************/
function resolveItemValue(item: InfoTableItem): string {
  if (item.value === undefined || item.value === null || item.value === '') {
    return item.emptyText ?? props.emptyText
  }

  return String(item.value)
}

function resolveItemSpan(item: InfoTableItem): number {
  return Math.max(1, Math.min(item.span ?? 1, props.columns))
}

/***********************公开方法*********************/
defineExpose({
  getInfoTableElement: () => infoTableRef.value,
})
</script>

<template>
  <dl
    ref="infoTableRef"
    class="luma-info-table"
    :class="{ 'luma-info-table--bordered': bordered }"
    :style="tableStyle"
  >
    <div
      v-for="item in visibleItems"
      :key="item.label"
      class="luma-info-table__item"
      :style="{ gridColumn: `span ${resolveItemSpan(item)}` }"
    >
      <dt class="luma-info-table__label" :style="labelStyle">
        {{ item.label }}
      </dt>
      <dd class="luma-info-table__value">
        {{ resolveItemValue(item) }}
      </dd>
    </div>
  </dl>
</template>

<style scoped lang="scss">
.luma-info-table {
  display: grid;
  grid-template-columns: repeat(var(--luma-info-table-columns), minmax(0, 1fr));
  margin: 0;
  overflow: hidden;
  border-radius: 8px;
}

.luma-info-table--bordered {
  border: 1px solid var(--el-border-color-lighter);
}

.luma-info-table__item {
  display: flex;
  min-width: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.luma-info-table__label {
  box-sizing: border-box;
  flex: none;
  margin: 0;
  padding: 10px 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.luma-info-table__value {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  padding: 10px 12px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .luma-info-table {
    grid-template-columns: 1fr;
  }

  .luma-info-table__item {
    grid-column: span 1 !important;
  }
}
</style>
