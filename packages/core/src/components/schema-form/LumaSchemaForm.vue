<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { NormalizedSchemaFormItem, SchemaFormItem, SchemaFormModel } from './types'
import { ElButton, ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus'
import { computed, useTemplateRef } from 'vue'
import { normalizeSchemaFormItems, resolveSchemaFormInitialModel } from './normalize'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  schemas: SchemaFormItem[]
  submitText?: string
  showActions?: boolean
}>(), {
  submitText: '提交',
  showActions: false,
})

const emit = defineEmits<{
  submit: [model: SchemaFormModel]
}>()

const model = defineModel<SchemaFormModel>({
  default: () => ({}),
})

/***********************模板引用*********************/
const formRef = useTemplateRef<FormInstance>('formRef')

/***********************字段状态*********************/
const normalizedSchemas = computed(() => normalizeSchemaFormItems(props.schemas))

const renderableSchemas = computed(() => normalizedSchemas.value.filter(schema => schema.renderable))

const normalizedModel = computed(() => resolveSchemaFormInitialModel(normalizedSchemas.value, model.value))

/***********************字段取值*********************/
function getInputValue(field: string): string | number {
  const value = normalizedModel.value[field]

  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return value == null ? '' : String(value)
}

function getSelectValue(field: string): boolean | number | string {
  const value = normalizedModel.value[field]

  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return ''
}

function getInputType(schema: NormalizedSchemaFormItem): string {
  return String(schema.props?.type ?? 'text')
}

function isFieldDisabled(schema: NormalizedSchemaFormItem): boolean {
  return Boolean(schema.props?.disabled)
}

/***********************事件处理*********************/
function updateFieldValue(field: string, value: unknown): void {
  model.value = {
    ...normalizedModel.value,
    [field]: value,
  }
}

function handleSubmit(): void {
  emit('submit', normalizedModel.value)
}

/***********************公开方法*********************/
defineExpose({
  getFormElement: () => formRef.value?.$el as HTMLFormElement | undefined,
  getFormInstance: () => formRef.value,
})
</script>

<template>
  <ElForm
    ref="formRef"
    class="luma-schema-form"
    :model="normalizedModel"
    @submit.prevent="handleSubmit"
  >
    <ElFormItem
      v-for="schema in renderableSchemas"
      :key="schema.field"
      class="luma-schema-form__item"
      :label="schema.label"
      :prop="schema.field"
      :required="schema.required"
      :data-field="schema.field"
    >
      <ElInput
        v-if="schema.component === 'textarea'"
        :id="schema.id"
        :model-value="getInputValue(schema.field)"
        :name="schema.field"
        :placeholder="schema.placeholder"
        :disabled="isFieldDisabled(schema)"
        :required="schema.required"
        type="textarea"
        @update:model-value="updateFieldValue(schema.field, $event)"
      />

      <ElSelect
        v-else-if="schema.component === 'select'"
        :id="schema.id"
        :model-value="getSelectValue(schema.field)"
        :name="schema.field"
        :placeholder="schema.placeholder"
        :disabled="isFieldDisabled(schema)"
        :required="schema.required"
        @update:model-value="updateFieldValue(schema.field, $event)"
      >
        <ElOption
          v-for="option in schema.options"
          :key="String(option.value)"
          :label="option.label"
          :value="option.value"
          :disabled="option.disabled"
        />
      </ElSelect>

      <ElInput
        v-else
        :id="schema.id"
        :model-value="getInputValue(schema.field)"
        :name="schema.field"
        :type="getInputType(schema)"
        :placeholder="schema.placeholder"
        :disabled="isFieldDisabled(schema)"
        :required="schema.required"
        @update:model-value="updateFieldValue(schema.field, $event)"
      />
    </ElFormItem>

    <div v-if="showActions" class="luma-schema-form__actions">
      <ElButton type="primary" native-type="submit">
        {{ submitText }}
      </ElButton>
    </div>
  </ElForm>
</template>

<style scoped lang="scss">
.luma-schema-form {
  display: grid;
  gap: 16px;
}

.luma-schema-form__item {
  margin-bottom: 0;
}

.luma-schema-form__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
