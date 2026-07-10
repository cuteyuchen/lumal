<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { NormalizedSchemaFormItem, SchemaFormAuthority, SchemaFormItem, SchemaFormMode, SchemaFormModel } from './types'
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElRow,
  ElSelect,
  ElSwitch,
  ElTreeSelect,
  ElUpload,
} from 'element-plus'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { useDictionaryMap } from '../../dictionary'
import { normalizeSchemaFormItems, resolveSchemaFormInitialModel } from './normalize'

type SchemaDatePickerType = 'date' | 'daterange' | 'datetime'
type SchemaDatePickerValue = Date | Date[] | number | number[] | string | string[] | undefined
type SchemaTreeSelectValue
  = | Array<boolean | number | Record<string, unknown> | string>
    | boolean
    | number
    | Record<string, unknown>
    | string
    | undefined

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  canAccess?: (authority: SchemaFormAuthority) => boolean
  columns?: number
  disabled?: boolean
  labelPosition?: 'left' | 'right' | 'top'
  labelWidth?: number | string
  mode?: SchemaFormMode
  schemas: SchemaFormItem[]
  submitText?: string
  showActions?: boolean
}>(), {
  columns: 1,
  disabled: false,
  labelPosition: 'right',
  mode: 'create',
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

/***********************模式状态*********************/
const activeMode = shallowRef<SchemaFormMode>(props.mode)

watch(
  () => props.mode,
  (mode) => {
    activeMode.value = mode
  },
)

/***********************字段状态*********************/
const normalizedSchemas = computed(() => normalizeSchemaFormItems(props.schemas, {
  canAccess: props.canAccess,
  mode: activeMode.value,
  model: model.value,
}))

const renderableSchemas = computed(() => normalizedSchemas.value.filter(schema => schema.renderable))

const normalizedModel = computed(() => resolveSchemaFormInitialModel(normalizedSchemas.value, model.value))

const { dictionaryMap } = useDictionaryMap(() =>
  normalizedSchemas.value.map(schema => schema.dictionary ?? schema.dictType),
)

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

function getNumberValue(field: string): number | undefined {
  const value = normalizedModel.value[field]

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    return Number(value)
  }

  return undefined
}

function getBooleanValue(field: string): boolean {
  return Boolean(normalizedModel.value[field])
}

function getCheckboxValue(field: string): Array<number | string> {
  const value = normalizedModel.value[field]

  return Array.isArray(value)
    ? value.filter((item): item is number | string =>
        typeof item === 'number' || typeof item === 'string',
      )
    : []
}

function getDatePickerValue(field: string): SchemaDatePickerValue {
  const value = normalizedModel.value[field]

  if (value instanceof Date || typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (Array.isArray(value) && value.every(item =>
    item instanceof Date || typeof item === 'number' || typeof item === 'string',
  )) {
    return value as Date[] | number[] | string[]
  }

  return undefined
}

function getDatePickerType(schema: NormalizedSchemaFormItem): SchemaDatePickerType {
  if (schema.component === 'datetime') {
    return 'datetime'
  }

  if (schema.component === 'daterange') {
    return 'daterange'
  }

  return 'date'
}

function getTreeSelectValue(field: string): SchemaTreeSelectValue {
  const value = normalizedModel.value[field]

  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object') {
    return value as Record<string, unknown>
  }

  return undefined
}

function getInputType(schema: NormalizedSchemaFormItem): string {
  return String(schema.componentProps.type ?? 'text')
}

function isFieldDisabled(schema: NormalizedSchemaFormItem): boolean {
  return props.disabled || schema.disabled || schema.readonly || Boolean(schema.componentProps.disabled)
}

function resolveFieldSpan(schema: NormalizedSchemaFormItem): number {
  if (typeof schema.span === 'number') {
    return Math.min(24, Math.max(1, schema.span))
  }

  return Math.floor(24 / Math.max(1, props.columns))
}

function resolveSchemaOptions(schema: NormalizedSchemaFormItem) {
  if (schema.options.length > 0) {
    return schema.options
  }

  const dictionary = schema.dictionary ?? schema.dictType

  return dictionary ? dictionaryMap.value[dictionary] ?? [] : []
}

/***********************事件处理*********************/
function updateFieldValue(field: string, value: unknown): void {
  model.value = {
    ...normalizedModel.value,
    [field]: value,
  }
}

function handleSubmit(): void {
  if (activeMode.value === 'view') {
    return
  }

  emit('submit', normalizedModel.value)
}

function resolveFieldSlotName(schema: NormalizedSchemaFormItem): string {
  return `field-${schema.field}`
}

function resolvePrefixSlotName(schema: NormalizedSchemaFormItem): string {
  return `prefix-${schema.field}`
}

function resolveSuffixSlotName(schema: NormalizedSchemaFormItem): string {
  return `suffix-${schema.field}`
}

function setValues(value: SchemaFormModel): void {
  model.value = {
    ...normalizedModel.value,
    ...value,
  }
}

function setMode(mode: SchemaFormMode): void {
  activeMode.value = mode
}

async function validate(): Promise<boolean> {
  const result = await formRef.value?.validate?.()
  return result !== false
}

function resetFields(): void {
  formRef.value?.resetFields?.()
}

/***********************公开方法*********************/
defineExpose({
  getFormElement: () => formRef.value?.$el as HTMLFormElement | undefined,
  getFormInstance: () => formRef.value,
  getValues: () => normalizedModel.value,
  resetFields,
  setMode,
  setValues,
  validate,
})
</script>

<template>
  <ElForm
    ref="formRef"
    class="luma-schema-form"
    :disabled="props.disabled"
    :label-position="props.labelPosition"
    :label-width="props.labelWidth"
    :model="normalizedModel"
    @submit.prevent="handleSubmit"
  >
    <ElRow class="luma-schema-form__row" :gutter="16" :data-columns="props.columns">
      <ElCol
        v-for="schema in renderableSchemas"
        :key="schema.field"
        :span="resolveFieldSpan(schema)"
      >
        <ElFormItem
          class="luma-schema-form__item"
          :label="schema.label"
          :prop="schema.field"
          :required="schema.required"
          :rules="schema.rules"
          :data-field="schema.field"
        >
          <slot
            :name="resolvePrefixSlotName(schema)"
            :model="normalizedModel"
            :schema="schema"
            :value="normalizedModel[schema.field]"
          />

          <slot
            :name="resolveFieldSlotName(schema)"
            :model="normalizedModel"
            :schema="schema"
            :value="normalizedModel[schema.field]"
          >
            <ElInput
              v-if="schema.component === 'textarea'"
              v-bind="schema.componentProps"
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
              v-bind="schema.componentProps"
              :id="schema.id"
              :model-value="getSelectValue(schema.field)"
              :name="schema.field"
              :placeholder="schema.placeholder"
              :disabled="isFieldDisabled(schema)"
              :required="schema.required"
              @update:model-value="updateFieldValue(schema.field, $event)"
            >
              <ElOption
                v-for="option in resolveSchemaOptions(schema)"
                :key="String(option.value)"
                :label="option.label"
                :value="option.value"
                :disabled="option.disabled"
              />
            </ElSelect>

            <ElInputNumber
              v-else-if="schema.component === 'number'"
              v-bind="schema.componentProps"
              :id="schema.id"
              :model-value="getNumberValue(schema.field)"
              :name="schema.field"
              :placeholder="schema.placeholder"
              :disabled="isFieldDisabled(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            />

            <ElSwitch
              v-else-if="schema.component === 'switch'"
              v-bind="schema.componentProps"
              :model-value="getBooleanValue(schema.field)"
              :name="schema.field"
              :disabled="isFieldDisabled(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            />

            <ElDatePicker
              v-else-if="schema.component === 'date' || schema.component === 'datetime' || schema.component === 'daterange'"
              v-bind="schema.componentProps"
              :id="schema.id"
              :model-value="getDatePickerValue(schema.field)"
              :name="schema.field"
              :placeholder="schema.placeholder"
              :disabled="isFieldDisabled(schema)"
              :type="getDatePickerType(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            />

            <ElRadioGroup
              v-else-if="schema.component === 'radio'"
              v-bind="schema.componentProps"
              :model-value="getSelectValue(schema.field)"
              :name="schema.field"
              :disabled="isFieldDisabled(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            >
              <ElRadio
                v-for="option in resolveSchemaOptions(schema)"
                :key="String(option.value)"
                :value="option.value"
                :disabled="option.disabled"
              >
                {{ option.label }}
              </ElRadio>
            </ElRadioGroup>

            <ElCheckboxGroup
              v-else-if="schema.component === 'checkbox'"
              v-bind="schema.componentProps"
              :model-value="getCheckboxValue(schema.field)"
              :name="schema.field"
              :disabled="isFieldDisabled(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            >
              <ElCheckbox
                v-for="option in resolveSchemaOptions(schema)"
                :key="String(option.value)"
                :value="option.value"
                :disabled="option.disabled"
              >
                {{ option.label }}
              </ElCheckbox>
            </ElCheckboxGroup>

            <ElTreeSelect
              v-else-if="schema.component === 'tree-select'"
              v-bind="schema.componentProps"
              :id="schema.id"
              :model-value="getTreeSelectValue(schema.field)"
              :name="schema.field"
              :placeholder="schema.placeholder"
              :disabled="isFieldDisabled(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            />

            <ElUpload
              v-else-if="schema.component === 'upload'"
              v-bind="schema.componentProps"
              :disabled="isFieldDisabled(schema)"
            >
              <ElButton type="primary">
                上传
              </ElButton>
            </ElUpload>

            <ElInput
              v-else
              v-bind="schema.componentProps"
              :id="schema.id"
              :model-value="getInputValue(schema.field)"
              :name="schema.field"
              :type="getInputType(schema)"
              :placeholder="schema.placeholder"
              :disabled="isFieldDisabled(schema)"
              :required="schema.required"
              @update:model-value="updateFieldValue(schema.field, $event)"
            />
          </slot>

          <slot
            :name="resolveSuffixSlotName(schema)"
            :model="normalizedModel"
            :schema="schema"
            :value="normalizedModel[schema.field]"
          />
        </ElFormItem>
      </ElCol>
    </ElRow>

    <div v-if="showActions && activeMode !== 'view'" class="luma-schema-form__actions">
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

.luma-schema-form__row {
  min-width: 0;
}

.luma-schema-form__item {
  margin-bottom: 0;
}

.luma-schema-form__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
