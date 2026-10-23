<script setup lang="ts">
import type { CrudDataSource, SchemaFormItem, SchemaTableColumn } from '@lumal/core/components';
import type { Role } from './types';
import { LumalCrudTable, LumalPage } from '@lumal/core/components';
import { ElAlert, ElButton } from 'element-plus';
import { shallowRef, useTemplateRef } from 'vue';
import { permissionStore, service } from '../../../app/services/session';
import { statusOptions } from '../../../shared/status';
import { createRoleService, parseRole, roleInput } from './api';
import RoleAuthorizationDialog from './components/RoleAuthorizationDialog.vue';

/***********************角色资料与授权分离*********************/
const api = createRoleService(service);
const table = useTemplateRef<InstanceType<typeof LumalCrudTable>>('table');
const authorizing = shallowRef<Role>();
const authorizationVisible = shallowRef(false);
const failure = shallowRef('');
const can = (action: string) => permissionStore.hasPermission(`system:role:${action}`);
const dataSource: CrudDataSource = {
  fetch: (input) => api.list(input),
  create: (model) => api.create(roleInput(model)),
  update: (row, model) => api.update(parseRole(row).id, roleInput(model)),
  remove: (row) => api.remove(parseRole(row).id),
};
const columns: SchemaTableColumn[] = [
  { field: 'name', label: '角色名称', minWidth: 160 },
  { field: 'code', label: '角色编码', minWidth: 140 },
  { field: 'status', label: '状态', options: statusOptions, width: 100 },
  { field: 'description', label: '说明', minWidth: 200 },
];
const schemas: SchemaFormItem[] = [
  { field: 'name', label: '角色名称', required: true },
  {
    field: 'code',
    label: '角色编码',
    required: true,
    editDisabled: true,
    rules: [{ pattern: /^[a-z][\w-]*$/, message: '使用小写字母开头的编码' }],
  },
  {
    field: 'status',
    label: '状态',
    component: 'select',
    options: statusOptions,
    defaultValue: 'enabled',
    disabled: ({ model }) => model.builtIn === true,
  },
  { field: 'description', label: '说明', component: 'textarea', span: 24 },
];
const querySchemas: SchemaFormItem[] = [
  { field: 'keyword', label: '关键词' },
  { field: 'status', label: '状态', component: 'select', options: statusOptions },
];
function authorize(role: Role): void {
  authorizing.value = role;
  authorizationVisible.value = true;
}
</script>

<template>
  <LumalPage class="lumal-admin-page" title="角色管理" no-padding>
    <ElAlert v-if="failure" :title="failure" type="error" :closable="false" />
    <LumalCrudTable
      ref="table"
      :data-source="dataSource"
      :form-schemas="schemas"
      :table="{ columns, rowKey: 'id', actionWidth: 260 }"
      :query="{ schemas: querySchemas, columns: 2, collapsible: true }"
      :toolbar="{ create: can('create'), batchDelete: false }"
      :actions="{ view: false, edit: false, remove: false }"
      @operation-error="failure = $event instanceof Error ? $event.message : String($event)"
    >
      <template #row-actions="{ row }">
        <ElButton link @click="table?.openView(row)"> 查看 </ElButton>
        <ElButton v-if="can('update')" link @click="table?.openEdit(row)"> 编辑 </ElButton>
        <ElButton v-if="can('authorize')" link @click="authorize(parseRole(row))"> 授权 </ElButton>
        <ElButton
          v-if="can('delete')"
          link
          type="danger"
          :disabled="row.builtIn === true"
          @click="table?.removeRow(row)"
        >
          删除
        </ElButton>
      </template>
    </LumalCrudTable>
    <RoleAuthorizationDialog v-if="authorizing" v-model="authorizationVisible" :role="authorizing" />
  </LumalPage>
</template>
