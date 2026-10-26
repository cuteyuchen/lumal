<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@lumal/core/components';
import type { Menu } from '../types';
import { LumalIconPicker } from '@lumal/icons-vue';
import { computed } from 'vue';
import { viewComponents } from '../../../../app/router/views';
import BaseEntityDialog from '../../../../shared/components/BaseEntityDialog.vue';
import { excludedDescendants } from '../../../../shared/tree';

/***********************节点类型约束与父级选择*********************/
const props = defineProps<{ records: Menu[]; editingId?: string; saving: boolean; error: string }>();
defineEmits<{ submit: [model: SchemaFormModel] }>();
const visible = defineModel<boolean>('visible', { required: true });
const model = defineModel<SchemaFormModel>('model', { required: true });
const schemas = computed<SchemaFormItem[]>(() => {
  const excluded = excludedDescendants(props.records, props.editingId);
  const parents = props.records.filter(
    (item) =>
      !excluded.has(item.id) &&
      (model.value.type === 'button' ? ['menu', 'directory'].includes(item.type) : item.type === 'directory'),
  );
  return [
    {
      field: 'type',
      label: '节点类型',
      component: 'select',
      required: true,
      defaultValue: 'menu',
      options: [
        { label: '目录', value: 'directory' },
        { label: '菜单', value: 'menu' },
        { label: '按钮', value: 'button' },
        { label: '外链', value: 'external' },
        { label: '内嵌页面', value: 'embedded' },
      ],
    },
    {
      field: 'parentId',
      label: '父节点',
      component: 'select',
      options: [{ label: '无', value: '' }, ...parents.map((item) => ({ label: item.title, value: item.id }))],
    },
    { field: 'title', label: '标题', required: true },
    { field: 'name', label: '路由名', required: true, hidden: ({ model }) => model.type === 'button' },
    { field: 'path', label: '路径', required: true, hidden: ({ model }) => model.type === 'button' },
    {
      field: 'component',
      label: '页面组件',
      component: 'select',
      required: true,
      options: Object.keys(viewComponents)
        .filter((key) => key !== 'app/iframe')
        .map((key) => ({ label: key, value: key })),
      hidden: ({ model }) => model.type !== 'menu',
    },
    {
      field: 'externalLink',
      label: 'HTTP(S) 地址',
      required: true,
      hidden: ({ model }) => !['external', 'embedded'].includes(String(model.type)),
    },
    {
      field: 'permissions',
      label: '权限标识',
      component: 'input',
      placeholder: '多个权限以英文逗号分隔',
      required: ({ model }) => model.type === 'button',
    },
    { field: 'icon', label: '图标', hidden: ({ model }) => model.type === 'button' },
    { field: 'order', label: '排序', component: 'number', defaultValue: 0 },
    {
      field: 'hidden',
      label: '隐藏',
      component: 'switch',
      defaultValue: false,
      hidden: ({ model }) => model.type === 'button',
    },
  ];
});
const formModel = computed<SchemaFormModel>({
  get: () => ({
    ...model.value,
    permissions: Array.isArray(model.value.permissions) ? model.value.permissions.join(',') : model.value.permissions,
  }),
  set: (value) => {
    model.value = value;
  },
});
</script>

<template>
  <BaseEntityDialog
    v-model:visible="visible"
    v-model:model="formModel"
    :title="editingId ? '编辑节点' : '新增节点'"
    :schemas="schemas"
    :editing="!!editingId"
    :saving="saving"
    :error="error"
    @submit="$emit('submit', $event)"
  >
    <template #field-icon="{ value }">
      <LumalIconPicker :model-value="String(value ?? '')" @update:model-value="model = { ...model, icon: $event }" />
    </template>
  </BaseEntityDialog>
</template>
