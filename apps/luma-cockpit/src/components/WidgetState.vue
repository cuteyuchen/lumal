<script setup lang="ts">
import { LumaLoading } from '@luma/datav'
import { computed } from 'vue'

/***********************模块状态占位（加载/错误/空）*********************/
// 统一各业务模块的加载、错误、空数据展示，复用 @luma/datav 的 LumaLoading。

const props = withDefaults(defineProps<{
  loading?: boolean
  error?: string
  empty?: boolean
  emptyText?: string
}>(), {
  loading: false,
  error: '',
  empty: false,
  emptyText: '暂无数据',
})

// 归一化状态：错误优先，其次加载，再次空
const status = computed<'loading' | 'error' | 'success'>(() => {
  if (props.error)
    return 'error'
  if (props.loading)
    return 'loading'
  return 'success'
})

const label = computed(() => {
  if (props.error)
    return props.error
  if (props.loading)
    return '加载中'
  return props.emptyText
})

// 是否需要展示占位（加载/错误/空任一成立）
const visible = computed(() => props.loading || Boolean(props.error) || props.empty)
</script>

<template>
  <div v-if="visible" class="widget-state">
    <LumaLoading :status="status" :label="label" :size="36" />
  </div>
</template>

<style scoped>
.widget-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
  color: var(--luma-cockpit-text-secondary);
}
</style>
