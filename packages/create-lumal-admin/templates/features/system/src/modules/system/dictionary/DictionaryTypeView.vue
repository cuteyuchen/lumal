<script setup lang="ts">
import type { SchemaFormItem, SchemaTableColumn } from '@lumal/core/components';
import type { DictionaryType } from './types';
import { LumalPage, LumalSchemaTable } from '@lumal/core/components';
import { LumalIcon } from '@lumal/icons-vue';
import { ElAlert, ElButton, ElInput } from 'element-plus';
import { computed, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { permissionStore, service } from '../../../app/services/session';
import BaseEntityDialog from '../../../shared/components/BaseEntityDialog.vue';
import { useAsyncData } from '../../../shared/composables/use-async-data';
import { useEntityEditor } from '../../../shared/composables/use-entity-editor';
import { statusOptions } from '../../../shared/status';
import { createDictionaryService, dictionaryTypeInput, parseType } from './api';
import { dictionaryStore } from './cache';

/***********************字典分类与关联项入口*********************/
const api = createDictionaryService(service, () => dictionaryStore.clearDictionary());
const state = useAsyncData(api.types, [] as DictionaryType[]);
const keyword = shallowRef('');
const router = useRouter();
const can = (action: string) => permissionStore.hasPermission(`system:dict:${action}`);
const displayed = computed(() => state.data.value.filter((row) => `${row.name} ${row.code}`.includes(keyword.value)));
const editor = useEntityEditor<DictionaryType, ReturnType<typeof dictionaryTypeInput>>({
  create: api.createType,
  update: api.updateType,
  remove: api.removeType,
  toInput: dictionaryTypeInput,
  reload: state.load,
  removeMessage: (row) => `删除分类「${row.name}」及其所有字典项？`,
});
const columns: SchemaTableColumn<DictionaryType>[] = [
  { field: 'name', label: '字典名称', minWidth: 160 },
  { field: 'code', label: '编码', minWidth: 150 },
  { field: 'status', label: '状态', options: statusOptions, width: 100 },
  { field: 'description', label: '说明', minWidth: 200 },
];
const schemas: SchemaFormItem[] = [
  { field: 'name', label: '字典名称', required: true },
  {
    field: 'code',
    label: '编码',
    required: true,
    editDisabled: true,
    rules: [{ pattern: /^[a-z][\w-]*$/, message: '使用字母开头的编码' }],
  },
  { field: 'status', label: '状态', component: 'select', options: statusOptions, defaultValue: 'enabled' },
  { field: 'description', label: '说明', component: 'textarea', span: 24 },
];
</script>

<template>
  <LumalPage class="lumal-admin-page" title="字典分类" no-padding>
    <ElAlert v-if="editor.error.value" :title="editor.error.value" type="error" :closable="false" />
    <LumalSchemaTable
      :rows="displayed"
      :columns="columns"
      :loading="state.loading.value"
      :error="state.error.value"
      :action-width="240"
      @retry="state.reload"
    >
      <template #toolbar>
        <ElInput
          v-model="keyword"
          aria-label="搜索字典分类"
          placeholder="搜索名称或编码"
          clearable
          style="max-width: 260px"
        />
        <ElButton v-if="can('create')" type="primary" @click="editor.openCreate({ status: 'enabled' })">
          新增分类
        </ElButton>
      </template>
      <template #toolbar-tools>
        <ElButton title="重新加载" aria-label="重新加载" @click="state.reload">
          <LumalIcon name="lumal:refresh" />
        </ElButton>
      </template>
      <template #actions="{ row }">
        <ElButton link @click="router.push({ path: '/system/dictionaries/items', query: { typeCode: row.code } })">
          字典项
        </ElButton>
        <ElButton v-if="can('update')" link @click="editor.openEdit(parseType(row))"> 编辑 </ElButton>
        <ElButton
          v-if="can('delete')"
          link
          type="danger"
          :disabled="editor.saving.value"
          @click="editor.remove(parseType(row))"
        >
          删除
        </ElButton>
      </template>
    </LumalSchemaTable>
    <BaseEntityDialog
      v-model:visible="editor.visible.value"
      v-model:model="editor.model.value"
      :title="editor.editing.value ? '编辑分类' : '新增分类'"
      :schemas="schemas"
      :editing="!!editor.editing.value"
      :saving="editor.saving.value"
      :error="editor.error.value"
      @submit="editor.submit"
    />
  </LumalPage>
</template>
