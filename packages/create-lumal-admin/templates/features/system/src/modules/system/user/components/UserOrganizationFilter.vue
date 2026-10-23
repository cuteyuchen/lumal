<script setup lang="ts">
import type { Option } from '../../../../shared/api';
import { ElInput, ElTree } from 'element-plus';
import { shallowRef, useTemplateRef, watch } from 'vue';

/***********************机构筛选契约*********************/
defineProps<{ options: Option[] }>();
const value = defineModel<string>({ required: true });
const keyword = shallowRef('');
const tree = useTemplateRef<InstanceType<typeof ElTree>>('tree');
watch(keyword, (text) => tree.value?.filter(text));
function filter(text: string, data: Record<string, unknown>): boolean {
  return !text || String(data.label).includes(text);
}
</script>

<template>
  <details class="user-organizations" open>
    <summary>机构筛选</summary>
    <ElInput v-model="keyword" aria-label="搜索机构" placeholder="搜索机构" clearable />
    <ElTree
      ref="tree"
      :data="[{ label: '全部机构', value: '', children: options }]"
      node-key="value"
      default-expand-all
      highlight-current
      :current-node-key="value"
      :expand-on-click-node="false"
      :filter-node-method="filter"
      :props="{ label: 'label' }"
      @node-click="(node: Option) => (value = node.value)"
    />
  </details>
</template>

<style scoped>
.user-organizations {
  min-width: 0;
  border-right: 1px solid var(--el-border-color-light);
  padding-right: 16px;
}
.user-organizations summary {
  font-weight: 600;
  margin-bottom: 12px;
  cursor: pointer;
}
.user-organizations :deep(.el-tree) {
  margin-top: 12px;
  max-height: 60dvh;
  overflow: auto;
}
@media (max-width: 768px) {
  .user-organizations {
    border: 0;
    padding: 0;
  }
  .user-organizations :deep(.el-tree) {
    max-height: 160px;
  }
}
</style>
