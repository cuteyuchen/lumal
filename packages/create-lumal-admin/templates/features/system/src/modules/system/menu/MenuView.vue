<script setup lang="ts">
import type { SchemaTableColumn } from '@lumal/core/components';
import type { Menu } from './types';
import { LumalPage, LumalSchemaTable } from '@lumal/core/components';
import { LumalIcon } from '@lumal/icons-vue';
import { ElAlert, ElButton, ElInput, ElMessage } from 'element-plus';
import { computed, shallowRef } from 'vue';
import { application, permissionStore, service } from '../../../app/services/session';
import { useAsyncData } from '../../../shared/composables/use-async-data';
import { useEntityEditor } from '../../../shared/composables/use-entity-editor';
import { flattenTree } from '../../../shared/tree';
import { createMenuService, menuInput, parseMenu } from './api';
import MenuEditorDialog from './components/MenuEditorDialog.vue';

/***********************菜单树与独立刷新*********************/
const api = createMenuService(service);
const state = useAsyncData(api.list, [] as Menu[]);
const keyword = shallowRef('');
const refreshing = shallowRef(false);
const refreshError = shallowRef('');
const can = (action: string) => permissionStore.hasPermission(`system:menu:${action}`);
const records = computed(() => flattenTree(state.data.value));
function filterTree(items: Menu[]): Menu[] {
  return items.flatMap((item) => {
    const children = filterTree(item.children ?? []);
    return !keyword.value || item.title.includes(keyword.value) || children.length ? [{ ...item, children }] : [];
  });
}
const displayed = computed(() => filterTree(state.data.value));
const columns: SchemaTableColumn<Menu>[] = [
  { field: 'title', label: '标题', minWidth: 210 },
  {
    field: 'type',
    label: '类型',
    width: 100,
    formatter: (value) =>
      ({ directory: '目录', menu: '菜单', button: '按钮', external: '外链', embedded: '内嵌' })[String(value)] ?? value,
  },
  { field: 'path', label: '路径', minWidth: 170 },
  { field: 'component', label: '组件', minWidth: 170 },
  { field: 'order', label: '排序', width: 80 },
  { field: 'hidden', label: '显示', width: 80, formatter: (value) => (value ? '隐藏' : '显示') },
];
const editor = useEntityEditor<Menu, ReturnType<typeof menuInput>>({
  create: api.create,
  update: api.update,
  remove: api.remove,
  toInput: menuInput,
  reload: state.load,
});
async function refreshMenus(): Promise<void> {
  refreshing.value = true;
  refreshError.value = '';
  try {
    await application.refreshAccess();
    ElMessage.success('导航与权限已重新加载');
  } catch (reason) {
    refreshError.value = reason instanceof Error ? reason.message : '导航刷新失败';
  } finally {
    refreshing.value = false;
  }
}
function create(parent?: Menu): void {
  editor.openCreate({
    parentId: parent?.id ?? '',
    type: parent?.type === 'menu' ? 'button' : 'menu',
    hidden: false,
    order: 0,
    permissions: [],
  });
}
</script>

<template>
  <LumalPage class="lumal-admin-page" title="菜单管理" no-padding>
    <ElAlert
      v-if="editor.error.value || refreshError"
      :title="editor.error.value || refreshError"
      type="error"
      :closable="false"
    />
    <LumalSchemaTable
      :rows="displayed"
      :columns="columns"
      :loading="state.loading.value"
      :error="state.error.value"
      default-expand-all
      :action-width="240"
      @retry="state.reload"
    >
      <template #toolbar>
        <ElInput
          v-model="keyword"
          placeholder="搜索菜单标题"
          aria-label="搜索菜单"
          clearable
          style="max-width: 260px"
        />
        <ElButton v-if="can('create')" type="primary" @click="create()"> 新增节点 </ElButton>
      </template>
      <template #toolbar-tools>
        <ElButton :loading="refreshing" @click="refreshMenus"> 刷新导航 </ElButton>
        <ElButton title="重新加载" aria-label="重新加载" @click="state.reload">
          <LumalIcon name="lumal:refresh" />
        </ElButton>
      </template>
      <template #actions="{ row }">
        <ElButton v-if="can('create') && ['directory', 'menu'].includes(row.type)" link @click="create(parseMenu(row))">
          新增子节点
        </ElButton>
        <ElButton v-if="can('update')" link @click="editor.openEdit(parseMenu(row))"> 编辑 </ElButton>
        <ElButton
          v-if="can('delete')"
          link
          type="danger"
          :disabled="editor.saving.value"
          @click="editor.remove(parseMenu(row))"
        >
          删除
        </ElButton>
      </template>
    </LumalSchemaTable>
    <MenuEditorDialog
      v-model:visible="editor.visible.value"
      v-model:model="editor.model.value"
      :records="records"
      :editing-id="editor.editing.value?.id"
      :saving="editor.saving.value"
      :error="editor.error.value"
      @submit="editor.submit"
    />
  </LumalPage>
</template>
