<script setup lang="ts" generic="T extends SchemaFormRecord = Record<string, unknown>">
import type { FormInstance } from 'element-plus'
import type { NormalizedSchemaFormItem, SchemaFormAuthority, SchemaFormItem, SchemaFormMode, SchemaFormModel, SchemaFormRecord } from './types'
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
type SchemaDatePickerIdentifier = string | [string, string]
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
  schemas: SchemaFormItem<T>[]
  submitLoading?: boolean
  submitText?: string
  showActions?: boolean
}>(), {
  columns: 1,
  disabled: false,
  labelPosition: 'right',
  mode: 'create',
  submitLoading: false,
  submitText: '提交',
  showActions: false,
})

const emit = defineEmits<{
  submit: [model: SchemaFormModel]
}>()

const model = defineModel<SchemaFormModel<T>>({
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

const normalizedModel = computed<SchemaFormModel<T>>(() =>
  resolveSchemaFormInitialModel(normalizedSchemas.value, model.value),
)

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

function getSelectValue(field: string): Array<boolean | number | string> | boolean | number | string {
  const value = normalizedModel.value[field]

  if (Array.isArray(value)) {
    return value.filter((item): item is boolean | number | string =>
      typeof item === 'boolean' || typeof item === 'number' || typeof item === 'string')
  }

  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return ''
}

function getScalarSelectValue(field: string): boolean | number | string {
  const value = getSelectValue(field)
  return Array.isArray(value) ? value[0] ?? '' : value
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

function getDatePickerType(schema: NormalizedSchemaFormItem<T>): SchemaDatePickerType {
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

function getInputType(schema: NormalizedSchemaFormItem<T>): string {
  return String((schema.componentProps as Record<string, unknown>).type ?? 'text')
}

function getDatePickerId(schema: NormalizedSchemaFormItem<T>): SchemaDatePickerIdentifier {
  return schema.component === 'daterange'
    ? [`${schema.id}-start`, `${schema.id}-end`]
    : schema.id
}

function getDatePickerName(schema: NormalizedSchemaFormItem<T>): SchemaDatePickerIdentifier {
  return schema.component === 'daterange'
    ? [`${schema.field}-start`, `${schema.field}-end`]
    : schema.field
}

function isFieldDisabled(schema: NormalizedSchemaFormItem<T>): boolean {
  return props.disabled
    || schema.disabled
    || schema.readonly
    || (activeMode.value === 'edit' && Boolean(schema.editDisabled))
    || Boolean(schema.componentProps.disabled)
}

function resolveFieldSpan(schema: NormalizedSchemaFormItem<T>): number {
  if (typeof schema.span === 'number') {
    return Math.min(24, Math.max(1, schema.span))
  }

  return Math.floor(24 / Math.max(1, props.columns))
}

function resolveSchemaOptions(schema: NormalizedSchemaFormItem<T>) {
  if (schema.options.length > 0) {
    return schema.options
  }

  const dictionary = schema.dictionary ?? schema.dictType

  return dictionary ? dictionaryMap.value[dictionary] ?? [] : []
}

function resolveComponentProps(schema: NormalizedSchemaFormItem<T>): Record<string, unknown> {
  return schema.componentProps as Record<string, unknown>
}

function resolveViewValue(schema: NormalizedSchemaFormItem<T>): string {
  const value = normalizedModel.value[schema.field]

  if (schema.formatter) {
    return schema.formatter(value, normalizedModel.value)
  }

  const labels = (Array.isArray(value) ? value : [value])
    .map(item => resolveSchemaOptions(schema).find(option => Object.is(option.value, item))?.label ?? item)
    .filter(item => item !== null && item !== undefined && item !== '')

  return labels.length > 0 ? labels.map(String).join(', ') : '-'
}

/***********************事件处理*********************/
function updateFieldValue(field: string, value: unknown): void {
  model.value = {
    ...normalizedModel.value,
    [field]: value,
  } as SchemaFormModel<T>
}

function handleSubmit(): void {
  if (activeMode.value === 'view') {
    return
  }

  emit('submit', normalizedModel.value)
}

function resolveFieldSlotName(schema: NormalizedSchemaFormItem<T>): string {
  return `field-${schema.field}`
}

function resolvePrefixSlotName(schema: NormalizedSchemaFormItem<T>): string {
  return `prefix-${schema.field}`
}

function resolveSuffixSlotName(schema: NormalizedSchemaFormItem<T>): string {
  return `suffix-${schema.field}`
}

function setValues(value: SchemaFormModel): void {
  model.value = {
    ...normalizedModel.value,
    ...value,
  } as SchemaFormModel<T>
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
        :class="{ 'is-full-span': resolveFieldSpan(schema) === 24 }"
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
            <span v-if="activeMode === 'view'" class="luma-schema-form__readonly-value">
              {{ resolveViewValue(schema) }}
            </span>

            <ElInput
              v-else-if="schema.component === 'textarea'"
              v-bind="resolveComponentProps(schema)"
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
              v-bind="resolveComponentProps(schema)"
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
              v-bind="resolveComponentProps(schema)"
              :id="schema.id"
              :model-value="getNumberValue(schema.field)"
              :name="schema.field"
              :placeholder="schema.placeholder"
              :disabled="isFieldDisabled(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            >
              <template v-if="schema.prefix" #prefix>
                {{ schema.prefix }}
              </template>
              <template v-if="schema.suffix" #suffix>
                {{ schema.suffix }}
              </template>
            </ElInputNumber>

            <ElSwitch
              v-else-if="schema.component === 'switch'"
              v-bind="resolveComponentProps(schema)"
              :model-value="getBooleanValue(schema.field)"
              :name="schema.field"
              :disabled="isFieldDisabled(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            />

            <ElDatePicker
              v-else-if="schema.component === 'date' || schema.component === 'datetime' || schema.component === 'daterange'"
              v-bind="resolveComponentProps(schema)"
              :id="getDatePickerId(schema)"
              :model-value="getDatePickerValue(schema.field)"
              :name="getDatePickerName(schema)"
              :placeholder="schema.placeholder"
              :disabled="isFieldDisabled(schema)"
              :type="getDatePickerType(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            />

            <ElRadioGroup
              v-else-if="schema.component === 'radio'"
              v-bind="resolveComponentProps(schema)"
              :model-value="getScalarSelectValue(schema.field)"
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
              v-bind="resolveComponentProps(schema)"
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
              v-bind="resolveComponentProps(schema)"
              :id="schema.id"
              :model-value="getTreeSelectValue(schema.field)"
              :name="schema.field"
              :placeholder="schema.placeholder"
              :disabled="isFieldDisabled(schema)"
              @update:model-value="updateFieldValue(schema.field, $event)"
            />

            <ElUpload
              v-else-if="schema.component === 'upload'"
              v-bind="resolveComponentProps(schema)"
              :disabled="isFieldDisabled(schema)"
            >
              <ElButton type="primary">
                上传
              </ElButton>
            </ElUpload>

            <ElInput
              v-else
              v-bind="resolveComponentProps(schema)"
              :id="schema.id"
              :model-value="getInputValue(schema.field)"
              :name="schema.field"
              :type="getInputType(schema)"
              :placeholder="schema.placeholder"
              :disabled="isFieldDisabled(schema)"
              :required="schema.required"
              @update:model-value="updateFieldValue(schema.field, $event)"
            >
              <template v-if="schema.prepend" #prepend>
                {{ schema.prepend }}
              </template>
              <template v-if="schema.append" #append>
                {{ schema.append }}
              </template>
              <template v-if="schema.prefix" #prefix>
                {{ schema.prefix }}
              </template>
              <template v-if="schema.suffix" #suffix>
                {{ schema.suffix }}
              </template>
            </ElInput>
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
      <ElButton type="primary" native-type="submit" :loading="submitLoading" :disabled="submitLoading">
        {{ submitText }}
      </ElButton>
    </div>
  </ElForm>
</template>

<style scoped lang="scss">
.luma-schema-form {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 18px;
}

.luma-schema-form__row {
  min-width: 0;
  row-gap: 18px;
}

.luma-schema-form__item {
  width: 100%;
  margin-bottom: 0;
}

.luma-schema-form__item :deep(.el-form-item__content) {
  min-width: 0;
}

.luma-schema-form__item :deep(.el-input),
.luma-schema-form__item :deep(.el-input-number),
.luma-schema-form__item :deep(.el-select),
.luma-schema-form__item :deep(.el-cascader),
.luma-schema-form__item :deep(.el-date-editor),
.luma-schema-form__item :deep(.el-tree-select) {
  width: 100%;
  min-width: 0;
}

.luma-schema-form__readonly-value {
  min-height: 32px;
  color: var(--el-text-color-regular);
  line-height: 32px;
  overflow-wrap: anywhere;
}

.luma-schema-form__actions {
  display: flex;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  justify-content: flex-end;
}

@media (max-width: 1024px) {
  .luma-schema-form__row :deep(.el-col:not(.is-full-span)) {
    max-width: 50%;
    flex: 0 0 50%;
  }
}

@media (max-width: 768px) {
  .luma-schema-form__row :deep(.el-col.el-col) {
    max-width: 100%;
    flex: 0 0 100%;
  }

  .luma-schema-form :deep(.el-input__wrapper),
  .luma-schema-form :deep(.el-select__wrapper),
  .luma-schema-form :deep(.el-input-number),
  .luma-schema-form :deep(.el-date-editor) {
    min-height: 44px;
  }

  .luma-schema-form__actions {
    justify-content: stretch;
  }

  .luma-schema-form__actions :deep(.el-button) {
    min-height: 44px;
    flex: 1 1 auto;
  }
}
</style>
