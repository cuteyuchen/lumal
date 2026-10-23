<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@lumal/core/components';
import { LumalSchemaForm } from '@lumal/core/components';
import { ElAlert, ElDialog } from 'element-plus';

/***********************编辑弹窗契约*********************/
defineProps<{ title: string; schemas: SchemaFormItem[]; editing?: boolean; saving?: boolean; error?: string }>();
defineEmits<{ submit: [model: SchemaFormModel] }>();
const visible = defineModel<boolean>('visible', { required: true });
const model = defineModel<SchemaFormModel>('model', { required: true });
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="title"
    width="min(760px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
  >
    <ElAlert v-if="error" :title="error" type="error" :closable="false" role="alert" />
    <LumalSchemaForm
      v-model="model"
      :mode="editing ? 'edit' : 'create'"
      :schemas="schemas"
      :columns="2"
      :submit-loading="saving"
      show-actions
      submit-text="保存"
      @submit="$emit('submit', $event)"
    >
      <template v-for="(_, name) in $slots" #[name]="scope">
        <slot :name="name" v-bind="scope || {}" />
      </template>
    </LumalSchemaForm>
  </ElDialog>
</template>
