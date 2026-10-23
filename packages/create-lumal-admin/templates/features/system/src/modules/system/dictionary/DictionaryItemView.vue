<script setup lang="ts">
import type { SchemaFormItem, SchemaTableColumn } from '@lumal/core/components'
import type { DictionaryItem } from './types'
import { LumalPage, LumalSchemaTable } from '@lumal/core/components'
import { LumalIcon } from '@lumal/icons-vue'
import { ElAlert, ElButton, ElColorPicker, ElOption, ElSelect } from 'element-plus'
import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { permissionStore, service } from '../../../app/services/session'
import BaseEntityDialog from '../../../shared/components/BaseEntityDialog.vue'
import { useAsyncData } from '../../../shared/composables/use-async-data'
import { useEntityEditor } from '../../../shared/composables/use-entity-editor'
import { statusOptions } from '../../../shared/status'
import { createDictionaryService, dictionaryItemInput, parseItem } from './api'
import { dictionaryStore } from './cache'

/***********************分类筛选与实时字典缓存*********************/
const route = useRoute()
const typeCode = shallowRef(typeof route.query.typeCode === 'string' ? route.query.typeCode : '')
const api = createDictionaryService(service, () => dictionaryStore.clearDictionary())
const types = useAsyncData(api.types, [])
const state = useAsyncData(() => api.items(typeCode.value), [] as DictionaryItem[])
const can = (action: string) => permissionStore.hasPermission(`system:dict:${action}`)
watch(() => route.query.typeCode, (value) => {
  typeCode.value = typeof value === 'string' ? value : ''
})
watch(typeCode, () => {
  void state.reload()
})
const editor = useEntityEditor<DictionaryItem, ReturnType<typeof dictionaryItemInput>>({
  create: api.createItem,
  update: api.updateItem,
  remove: api.removeItem,
  toInput: dictionaryItemInput,
  reload: state.load,
})
const columns: SchemaTableColumn<DictionaryItem>[] = [
  { field: 'label', label: '显示名称', minWidth: 160 },
  { field: 'value', label: '字典值', minWidth: 150 },
  { field: 'typeCode', label: '分类', minWidth: 150 },
  { field: 'color', label: '颜色', width: 120 },
  { field: 'order', label: '排序', width: 80 },
  { field: 'status', label: '状态', options: statusOptions, width: 100 },
]
const schemas = computed<SchemaFormItem[]>(() => [
  { field: 'typeCode', label: '分类', component: 'select', required: true, options: types.data.value.map(row => ({ label: row.name, value: row.code })) },
  { field: 'label', label: '显示名称', required: true },
  { field: 'value', label: '字典值', required: true },
  { field: 'color', label: '颜色' },
  { field: 'order', label: '排序', component: 'number', defaultValue: 0 },
  { field: 'status', label: '状态', component: 'select', options: statusOptions, defaultValue: 'enabled' },
])
</script>

<template>
  <LumalPage class="lumal-admin-page" title="字典项管理" no-padding>
    <ElAlert v-if="editor.error.value || types.error.value" :title="editor.error.value || types.error.value" type="error" :closable="false">
      <ElButton v-if="types.error.value" link @click="types.reload">
        重试分类加载
      </ElButton>
    </ElAlert>
    <LumalSchemaTable :rows="state.data.value" :columns="columns" :loading="state.loading.value" :error="state.error.value" :action-width="160" @retry="state.reload">
      <template #toolbar>
        <ElSelect v-model="typeCode" clearable aria-label="字典分类" placeholder="全部分类" style="width: 240px">
          <ElOption v-for="type in types.data.value" :key="type.id" :label="type.name" :value="type.code" />
        </ElSelect>
        <ElButton v-if="can('create')" type="primary" :disabled="!!types.error.value || !types.data.value.length" @click="editor.openCreate({ typeCode: typeCode || types.data.value[0]?.code, status: 'enabled', order: 0, color: '' })">
          新增字典项
        </ElButton>
      </template>
      <template #toolbar-tools>
        <ElButton title="重新加载" aria-label="重新加载" @click="state.reload">
          <LumalIcon name="lumal:refresh" />
        </ElButton>
      </template>
      <template #table-color="{ value }">
        <span :style="{ color: String(value || 'inherit') }">{{ value || '-' }}</span>
      </template>
      <template #actions="{ row }">
        <ElButton v-if="can('update')" link @click="editor.openEdit(parseItem(row))">
          编辑
        </ElButton>
        <ElButton v-if="can('delete')" link type="danger" :disabled="editor.saving.value" @click="editor.remove(parseItem(row))">
          删除
        </ElButton>
      </template>
    </LumalSchemaTable>
    <BaseEntityDialog v-model:visible="editor.visible.value" v-model:model="editor.model.value" :title="editor.editing.value ? '编辑字典项' : '新增字典项'" :schemas="schemas" :editing="!!editor.editing.value" :saving="editor.saving.value" :error="editor.error.value" @submit="editor.submit">
      <template #field-color="{ value }">
        <ElColorPicker :model-value="String(value || '')" @update:model-value="editor.model.value = { ...editor.model.value, color: $event || '' }" />
      </template>
    </BaseEntityDialog>
  </LumalPage>
</template>
