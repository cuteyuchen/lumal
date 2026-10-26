<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@lumal/core/components';
import { LumalPage, LumalSchemaForm } from '@lumal/core/components';
import { ElAlert, ElButton, ElColorPicker, ElMessage, ElMessageBox } from 'element-plus';
import { shallowRef, watch } from 'vue';
import { permissionStore, service } from '../../../app/services/session';
import { useAsyncData } from '../../../shared/composables/use-async-data';
import { configInput, createConfigService } from './api';

/***********************配置加载与独立表单*********************/
const api = createConfigService(service);
const state = useAsyncData(api.get, null);
const model = shallowRef<SchemaFormModel>({});
const saving = shallowRef(false);
const failure = shallowRef('');
const canSave = () => permissionStore.hasPermission('system:config:update');
watch(state.data, (value) => {
  if (value) model.value = { ...value };
});
const schemas: SchemaFormItem[] = [
  { field: 'appName', label: '应用名称', required: true, rules: [{ max: 64, message: '应用名称最多 64 个字符' }] },
  { field: 'colorPrimary', label: '主题色', required: true },
  {
    field: 'layout',
    label: '导航布局',
    component: 'select',
    required: true,
    options: [
      { label: '侧边导航', value: 'sidebar-nav' },
      { label: '顶部导航', value: 'top-nav' },
      { label: '混合导航', value: 'mixed-nav' },
    ],
  },
  { field: 'tabbarEnable', label: '标签栏', component: 'switch' },
  { field: 'transitionEnable', label: '页面动画', component: 'switch' },
];

/***********************保存、重置与失败恢复*********************/
async function persist(values: SchemaFormModel, restore = false): Promise<void> {
  if (saving.value || state.loading.value || !canSave()) return;
  saving.value = true;
  failure.value = '';
  try {
    const next = restore ? await api.restore() : await api.save(configInput(values));
    model.value = { ...next };
    ElMessage.success(restore ? '已恢复默认配置' : '配置已保存');
  } catch (reason) {
    failure.value = reason instanceof Error ? reason.message : '配置保存失败';
  } finally {
    saving.value = false;
  }
}
async function restore(): Promise<void> {
  try {
    await ElMessageBox.confirm('恢复系统默认配置？', '恢复默认', { type: 'warning' });
  } catch {
    return;
  }
  await persist({}, true);
}
async function reload(): Promise<void> {
  if (saving.value || state.loading.value) return;
  failure.value = '';
  await state.reload();
}
</script>

<template>
  <LumalPage class="lumal-admin-page" title="系统配置">
    <ElAlert v-if="state.error.value || failure" :title="state.error.value || failure" type="error" :closable="false">
      <ElButton link :loading="state.loading.value" :disabled="saving" @click="reload"> 重新加载 </ElButton>
    </ElAlert>
    <div v-if="state.data.value" class="config-form">
      <LumalSchemaForm
        v-model="model"
        :schemas="schemas"
        :columns="2"
        :mode="canSave() ? 'edit' : 'view'"
        :show-actions="canSave()"
        :disabled="saving || state.loading.value"
        :submit-disabled="state.loading.value"
        :submit-loading="saving"
        submit-text="保存配置"
        @submit="persist"
      >
        <template #field-colorPrimary="{ value }">
          <ElColorPicker
            :model-value="String(value || '')"
            :disabled="!canSave() || saving || state.loading.value"
            @update:model-value="model = { ...model, colorPrimary: $event }"
          />
        </template>
      </LumalSchemaForm>
      <ElButton :disabled="saving" :loading="state.loading.value" @click="reload"> 重读配置 </ElButton>
      <ElButton v-if="canSave()" :disabled="saving" @click="restore"> 恢复默认配置 </ElButton>
    </div>
  </LumalPage>
</template>

<style scoped>
.config-form {
  max-width: 900px;
}
</style>
