<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@lumal/core/components';
import type { Option } from '../../../../shared/api';
import type { User } from '../types';
import { LumalSchemaForm } from '@lumal/core/components';
import { ElAlert, ElDialog, ElMessage } from 'element-plus';
import { computed, shallowRef, watch } from 'vue';
import { service } from '../../../../app/services/session';
import { stringArray } from '../../../../shared/api';
import { createUserService } from '../api';

/***********************角色分配契约*********************/
const props = defineProps<{ users: User[]; options: Option[]; batch: boolean }>();
const emit = defineEmits<{ saved: [] }>();
const visible = defineModel<boolean>({ required: true });
const api = createUserService(service);
const model = shallowRef<SchemaFormModel>({});
const saving = shallowRef(false);
const error = shallowRef('');
watch(visible, (open) => {
  if (open) {
    model.value = { roles: props.batch ? [] : (props.users[0]?.roles ?? []), mode: 'append' };
    error.value = '';
  }
});
const schemas = computed<SchemaFormItem[]>(() => [
  ...(props.batch
    ? [
        {
          field: 'mode',
          label: '分配方式',
          component: 'radio' as const,
          options: [
            { label: '追加', value: 'append' },
            { label: '替换', value: 'replace' },
          ],
        },
      ]
    : []),
  {
    field: 'roles',
    label: '角色',
    component: 'select',
    componentProps: { multiple: true },
    options: props.options,
    required: true,
  },
]);

/***********************授权请求与失败恢复*********************/
async function save(values: SchemaFormModel): Promise<void> {
  if (saving.value || !props.users.length) return;
  saving.value = true;
  error.value = '';
  try {
    const roles = stringArray(values.roles);
    if (props.batch)
      await api.batchRoles(
        props.users.map((user) => user.id),
        roles,
        values.mode === 'replace' ? 'replace' : 'append',
      );
    else await api.assignRoles(props.users[0]!.id, roles);
    visible.value = false;
    emit('saved');
    ElMessage.success('角色分配已保存');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '角色分配失败';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="batch ? '批量分配角色' : '分配角色'"
    width="min(520px, 94vw)"
    append-to-body
    :close-on-click-modal="!saving"
  >
    <ElAlert v-if="error" :title="error" type="error" :closable="false" role="alert" />
    <LumalSchemaForm
      v-model="model"
      :schemas="schemas"
      :submit-loading="saving"
      show-actions
      submit-text="保存角色"
      @submit="save"
    />
  </ElDialog>
</template>
