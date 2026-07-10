<script setup lang="ts">
import type { PageLayoutProps } from './types'
import { ElButton } from 'element-plus'
import { computed, useSlots, useTemplateRef } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<PageLayoutProps>(), {
  contentScrollable: true,
  fill: false,
  queryCollapsed: false,
  resetText: '重置',
  searchText: '查询',
  surface: true,
})

const emit = defineEmits<{
  reset: []
  search: []
}>()

/***********************模板引用*********************/
const pageLayoutRef = useTemplateRef<HTMLElement>('pageLayoutRef')

/***********************插槽状态*********************/
const slots = useSlots()

const hasQuery = computed(() => Boolean(slots.query || slots.form))
const hasToolbar = computed(() => Boolean(slots.toolbar))
const hasPagination = computed(() => Boolean(slots.pagination))

/***********************事件处理*********************/
function handleSearchClick(): void {
  emit('search')
}

function handleResetClick(): void {
  emit('reset')
}

/***********************公开方法*********************/
defineExpose({
  getPageLayoutElement: () => pageLayoutRef.value,
})
</script>

<template>
  <section
    ref="pageLayoutRef"
    class="luma-page-layout"
    :class="{
      'is-content-scrollable': contentScrollable,
      'is-fill': fill,
      'is-surface': surface,
    }"
  >
    <div v-if="hasQuery" class="luma-page-layout__query">
      <div v-show="!props.queryCollapsed" class="luma-page-layout__query-body">
        <slot name="query">
          <slot name="form" />
        </slot>
      </div>

      <div class="luma-page-layout__query-actions">
        <ElButton
          type="primary"
          native-type="button"
          data-action="search"
          @click="handleSearchClick"
        >
          {{ props.searchText }}
        </ElButton>
        <ElButton
          native-type="button"
          data-action="reset"
          @click="handleResetClick"
        >
          {{ props.resetText }}
        </ElButton>
      </div>
    </div>

    <div v-if="hasToolbar" class="luma-page-layout__toolbar">
      <slot name="toolbar" />
    </div>

    <div class="luma-page-layout__content">
      <slot />
    </div>

    <div v-if="hasPagination" class="luma-page-layout__pagination">
      <slot name="pagination" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.luma-page-layout {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.luma-page-layout.is-fill {
  height: 100%;
  min-height: 0;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
}

.luma-page-layout__query,
.luma-page-layout__toolbar,
.luma-page-layout__content,
.luma-page-layout__pagination {
  min-width: 0;
}

.luma-page-layout.is-surface .luma-page-layout__query {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
}

.luma-page-layout__query-body {
  min-width: 0;
}

.luma-page-layout__query-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.luma-page-layout.is-surface .luma-page-layout__toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
}

.luma-page-layout__content {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.luma-page-layout.is-content-scrollable .luma-page-layout__content {
  overflow: auto;
}

.luma-page-layout.is-surface .luma-page-layout__content {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
}

.luma-page-layout__pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
}

.luma-page-layout.is-surface .luma-page-layout__pagination {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
}

@media (max-width: 760px) {
  .luma-page-layout {
    gap: 12px;
  }

  .luma-page-layout__query,
  .luma-page-layout__toolbar,
  .luma-page-layout__pagination {
    padding: 12px;
  }

  .luma-page-layout__query-actions,
  .luma-page-layout__pagination {
    justify-content: flex-start;
  }

  .luma-page-layout__query-actions :deep(.el-button) {
    min-height: 44px;
    padding-inline: 16px;
  }
}
</style>
