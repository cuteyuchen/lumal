<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@lumal/core/components';
import type { createProfileService } from '../api';
import { LumalSchemaForm } from '@lumal/core/components';
import { ElAlert } from 'element-plus';
import { shallowRef } from 'vue';
import { passwordInput } from '../api';

/***********************真实密码更新接口*********************/
const props = defineProps<{ api: ReturnType<typeof createProfileService> }>();
const model = shallowRef<SchemaFormModel>({});
const saving = shallowRef(false);
const failure = shallowRef('');
const success = shallowRef('');
const schemas: SchemaFormItem[] = [
  {
    field: 'currentPassword',
    label: '当前密码',
    required: true,
    component: 'input',
    componentProps: { type: 'password', showPassword: true, autocomplete: 'current-password' },
  },
  {
    field: 'newPassword',
    label: '新密码',
    required: true,
    component: 'input',
    rules: [{ min: 8, max: 32, message: '密码长度为 8 到 32 位' }],
    componentProps: { type: 'password', showPassword: true, autocomplete: 'new-password' },
  },
  {
    field: 'confirmPassword',
    label: '确认新密码',
    required: true,
    component: 'input',
    componentProps: { type: 'password', showPassword: true, autocomplete: 'new-password' },
  },
];
async function submit(values: SchemaFormModel): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  failure.value = '';
  success.value = '';
  try {
    await props.api.changePassword(passwordInput(values));
    model.value = {};
    success.value = '密码已通过接口更新';
  } catch (reason) {
    failure.value = reason instanceof Error ? reason.message : '密码更新失败';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ElAlert v-if="failure" :title="failure" type="error" role="alert" :closable="false" />
  <ElAlert v-if="success" :title="success" type="success" :closable="false" />
  <LumalSchemaForm
    v-model="model"
    :schemas="schemas"
    :columns="1"
    show-actions
    submit-text="更新密码"
    :submit-loading="saving"
    @submit="submit"
  />
</template>
