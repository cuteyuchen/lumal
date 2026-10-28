<script setup lang="ts">
import type { ApplicationService, DataRow } from '../../../app/services/contracts';
import { AccessControl, useAccess, useVbenForm, useVbenVxeGrid } from '@lumal/vben-compat/v5';
import { viewportLength } from '@lumal/viewport';
import { ElButton, ElDialog, ElMessageBox } from 'element-plus';
import { nextTick, shallowRef } from 'vue';

/***********************业务服务与权限边界*********************/
const props = defineProps<{ service: Pick<ApplicationService, 'list' | 'save' | 'remove'> }>();
const { hasAccessByCodes } = useAccess();
const visible = shallowRef(false);
const editingId = shallowRef<string>();
const failure = shallowRef('');
function rowId(row: DataRow): string {
  if (typeof row.id !== 'string' && typeof row.id !== 'number') throw new Error('用户缺少 id');
  return String(row.id);
}

/***********************5.7.0 查询分页与列插槽迁移*********************/
const [Grid, gridApi] = useVbenVxeGrid({
  tableTitle: '用户迁移示例',
  formOptions: { schema: [{ component: 'Input', fieldName: 'keyword', label: '关键词' }], submitOnEnter: true },
  gridOptions: {
    columns: [
      { type: 'checkbox', width: 48 },
      { type: 'seq', title: '序号', width: 64 },
      { field: 'username', title: '用户名', sortable: true },
      { field: 'nickname', title: '昵称' },
      { field: 'status', title: '状态' },
      { field: 'id', title: '操作', slots: { default: 'operation' } },
    ],
    rowConfig: { keyField: 'id' },
    pagerConfig: { pageSize: 10 },
    proxyConfig: {
      ajax: {
        query: ({ page, sort }, formValues) =>
          props.service.list('users', {
            page: page.currentPage,
            pageSize: page.pageSize,
            query: { ...formValues, sortField: sort.field, sortOrder: sort.order },
          }),
      },
    },
    toolbarConfig: { custom: true, refresh: true, search: true },
  },
});

/***********************新增编辑弹窗与失败恢复*********************/
const [Form, formApi] = useVbenForm({
  showDefaultActions: false,
  schema: [
    { component: 'Input', fieldName: 'username', label: '用户名', rules: 'required' },
    { component: 'Input', fieldName: 'nickname', label: '昵称', rules: 'required' },
    {
      component: 'Select',
      fieldName: 'roles',
      label: '角色',
      defaultValue: ['guest'],
      componentProps: {
        multiple: true,
        options: [
          { label: '访客', value: 'guest' },
          { label: '管理员', value: 'admin' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      defaultValue: 'enabled',
      componentProps: {
        options: [
          { label: '启用', value: 'enabled' },
          { label: '停用', value: 'disabled' },
        ],
      },
    },
  ],
});
const saving = shallowRef(false);
async function open(row?: DataRow): Promise<void> {
  editingId.value = row ? rowId(row) : undefined;
  failure.value = '';
  visible.value = true;
  await nextTick();
  await formApi.resetForm();
  if (row) await formApi.setValues(row);
}
async function save(): Promise<void> {
  if (saving.value || !(await formApi.validate()).valid) return;
  saving.value = true;
  try {
    await props.service.save('users', await formApi.getValues(), editingId.value);
    visible.value = false;
    await gridApi.query();
  } catch (error) {
    failure.value = error instanceof Error ? error.message : String(error);
  } finally {
    saving.value = false;
  }
}
async function remove(row: DataRow): Promise<void> {
  try {
    await ElMessageBox.confirm(`删除 ${String(row.username)}？`, '删除确认');
  } catch {
    return; // Element Plus 的取消和关闭都表示不执行删除。
  }
  try {
    await props.service.remove('users', rowId(row));
    await gridApi.query();
  } catch (error) {
    failure.value = error instanceof Error ? error.message : String(error);
  }
}
defineExpose({ gridApi });
</script>

<template>
  <section>
    <p v-if="failure" role="alert">
      {{ failure }}
    </p>
    <Grid>
      <template #toolbar-actions>
        <AccessControl type="code" :codes="['system:user:create']">
          <ElButton type="primary" @click="open()"> 新增用户 </ElButton>
        </AccessControl>
      </template>
      <template #operation="{ row }">
        <ElButton v-if="hasAccessByCodes(['system:user:update'])" link @click="open(row)"> 编辑 </ElButton>
        <ElButton v-if="hasAccessByCodes(['system:user:delete'])" link type="danger" @click="remove(row)">
          删除
        </ElButton>
      </template>
    </Grid>
    <ElDialog
      v-model="visible"
      :title="editingId ? '编辑用户' : '新增用户'"
      destroy-on-close
      :width="viewportLength(640)"
    >
      <Form />
      <template #footer>
        <ElButton @click="visible = false"> 取消 </ElButton>
        <ElButton type="primary" :loading="saving" @click="save"> 保存 </ElButton>
      </template>
    </ElDialog>
  </section>
</template>
