<script setup lang="ts">
import type { NormalizedSchemaFormItem, SchemaFormItem, SchemaFormModel } from './types'
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
const formRef = useTemplateRef<HTMLFormElement>('formRef')

/***********************字段状态*********************/
const normalizedSchemas = computed(() => normalizeSchemaFormItems(props.schemas))

const renderableSchemas = computed(() => normalizedSchemas.value.filter(schema => schema.renderable))

const normalizedModel = computed(() => resolveSchemaFormInitialModel(normalizedSchemas.value, model.value))

/***********************字段取值*********************/
function getFieldValue(field: string): string {
  const value = normalizedModel.value[field]
  return value == null ? '' : String(value)
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

function handleInputChange(field: string, event: Event): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  updateFieldValue(field, target?.value ?? '')
}

function handleSubmit(): void {
  emit('submit', normalizedModel.value)
}

/***********************公开方法*********************/
defineExpose({
  getFormElement: () => formRef.value,
})
</script>

<template>
  <form ref="formRef" class="luma-schema-form" @submit.prevent="handleSubmit">
    <div
      v-for="schema in renderableSchemas"
      :key="schema.field"
      class="luma-schema-form__item"
      :data-field="schema.field"
    >
      <label class="luma-schema-form__label" :for="schema.id">
        {{ schema.label }}
      </label>

      <div class="luma-schema-form__control">
        <textarea
          v-if="schema.component === 'textarea'"
          :id="schema.id"
          class="luma-schema-form__textarea"
          :name="schema.field"
          :placeholder="schema.placeholder"
          :disabled="isFieldDisabled(schema)"
          :required="schema.required"
          :value="getFieldValue(schema.field)"
          @input="handleInputChange(schema.field, $event)"
        />

        <select
          v-else-if="schema.component === 'select'"
          :id="schema.id"
          class="luma-schema-form__select"
          :name="schema.field"
          :disabled="isFieldDisabled(schema)"
          :required="schema.required"
          :value="getFieldValue(schema.field)"
          @change="handleInputChange(schema.field, $event)"
        >
          <option v-if="schema.placeholder" value="">
            {{ schema.placeholder }}
          </option>
          <option
            v-for="option in schema.options"
            :key="String(option.value)"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </option>
        </select>

        <input
          v-else
          :id="schema.id"
          class="luma-schema-form__input"
          :name="schema.field"
          :type="getInputType(schema)"
          :placeholder="schema.placeholder"
          :disabled="isFieldDisabled(schema)"
          :required="schema.required"
          :value="getFieldValue(schema.field)"
          @input="handleInputChange(schema.field, $event)"
        >
      </div>
    </div>

    <div v-if="showActions" class="luma-schema-form__actions">
      <button class="luma-schema-form__submit" type="submit">
        {{ submitText }}
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss">
.luma-schema-form {
  display: grid;
  gap: 16px;
}

.luma-schema-form__item {
  display: grid;
  grid-template-columns: minmax(88px, max-content) minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.luma-schema-form__label {
  color: #374151;
  font-size: 14px;
  line-height: 1.4;
}

.luma-schema-form__control {
  min-width: 0;
}

.luma-schema-form__input,
.luma-schema-form__select,
.luma-schema-form__textarea {
  width: 100%;
  min-height: 36px;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #111827;
  background: #ffffff;
  font: inherit;
}

.luma-schema-form__input,
.luma-schema-form__select {
  padding: 0 10px;
}

.luma-schema-form__textarea {
  min-height: 72px;
  padding: 8px 10px;
  resize: vertical;
}

.luma-schema-form__actions {
  display: flex;
  justify-content: flex-end;
}

.luma-schema-form__submit {
  min-width: 72px;
  min-height: 36px;
  border: 0;
  border-radius: 6px;
  color: #ffffff;
  background: #1677ff;
  cursor: pointer;
}
</style>
