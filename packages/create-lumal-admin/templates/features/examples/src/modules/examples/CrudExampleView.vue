<script setup lang="ts">
import type { CrudDataSource, SchemaTableRow } from '@lumal/core/components';
import { LumalCrudTable } from '@lumal/core/components';

/***********************隔离的 CRUD 示例数据*********************/
let rows: SchemaTableRow[] = [{ id: 'example', name: '示例记录', status: 'enabled' }];
const columns = [
  { field: 'name', label: '名称' },
  { field: 'status', label: '状态' },
];
const dataSource: CrudDataSource = {
  fetch: async ({ page, pageSize, query }) => {
    const filtered = rows.filter((row) => String(row.name).includes(String(query.keyword ?? '')));
    return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length };
  },
  create: async (model) => {
    rows = [...rows, { ...model, id: crypto.randomUUID() }];
  },
  update: async (row, model) => {
    rows = rows.map((item) => (item.id === row.id ? { ...model, id: row.id } : item));
  },
  remove: async (row) => {
    rows = rows.filter((item) => item.id !== row.id);
  },
};
</script>

<template>
  <main class="lumal-admin-page">
    <LumalCrudTable
      title="CRUD 示例"
      :data-source="dataSource"
      :table="{ columns, rowKey: 'id', showColumnSettings: true, selection: true }"
      :query="{ schemas: [{ field: 'keyword', label: '关键词', component: 'input' }] }"
      :form-schemas="[
        { field: 'name', label: '名称', component: 'input', required: true },
        {
          field: 'status',
          label: '状态',
          component: 'select',
          options: [
            { label: '启用', value: 'enabled' },
            { label: '停用', value: 'disabled' },
          ],
          defaultValue: 'enabled',
        },
      ]"
      :toolbar="{ export: true, refresh: true }"
    />
  </main>
</template>
