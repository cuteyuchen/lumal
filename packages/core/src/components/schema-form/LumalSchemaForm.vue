<script setup lang="ts" generic="T extends SchemaFormRecord = Record<string, unknown>">
import type { FormInstance } from 'element-plus'
import type { ComputedRef } from 'vue'
import type { NormalizedSchemaFormItem, SchemaFormAuthority, SchemaFormContext, SchemaFormItem, SchemaFormMode, SchemaFormModel, SchemaFormRecord } from './types'
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
  ElLoading,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElRow,
  ElSelect,
  ElSwitch,
  ElTreeSelect,
  ElUpload,
} from 'element-plus'
import { computed, reactive, shallowRef, useTemplateRef, watch } from 'vue'
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
  actionLayout?: 'inline' | 'newLine' | 'rowEnd'
  actionPosition?: 'center' | 'left' | 'right'
  columns?: number
  compact?: boolean
  disabled?: boolean
  gutter?: number
  labelPosition?: 'left' | 'right' | 'top'
  labelWidth?: number | string
  loading?: boolean
  mode?: SchemaFormMode
  resetText?: string
  schemas: SchemaFormItem<T>[]
  scrollToFirstError?: boolean
  showReset?: boolean
  submitLoading?: boolean
  submitOnEnter?: boolean
  submitText?: string
  showActions?: boolean
}>(), {
  actionLayout: 'rowEnd',
  actionPosition: 'right',
  columns: 1,
  compact: false,
  disabled: false,
  gutter: 16,
  labelPosition: 'right',
  labelWidth: 'auto',
  loading: false,
  mode: 'create',
  resetText: '重置',
  scrollToFirstError: true,
  showReset: false,
  submitLoading: false,
  submitOnEnter: false,
  submitText: '提交',
  showActions: false,
})

const emit = defineEmits<{
  reset: [model: SchemaFormModel]
  submit: [model: SchemaFormModel]
  valuesChange: [model: SchemaFormModel, fields: string[]]
}>()

const model = defineModel<SchemaFormModel<T>>({
  default: () => ({}),
})

/***********************模板引用*********************/
const formRef = useTemplateRef<FormInstance>('formRef')
const vLoading = ElLoading.directive

/***********************模式状态*********************/
const activeMode = shallowRef<SchemaFormMode>(props.mode)

watch(
  () => props.mode,
  (mode) => {
    activeMode.value = mode
  },
)

/***********************字段状态*********************/
const initialModel = shallowRef<SchemaFormModel<T>>({ ...model.value })
const initialSchemas = normalizeSchemaFormItems(props.schemas, {
  canAccess: props.canAccess,
  mode: activeMode.value,
  model: model.value,
  setFieldValue,
})
const formModel = reactive(
  resolveSchemaFormInitialModel(initialSchemas, model.value),
) as SchemaFormModel<T>
const normalizedModel = computed<SchemaFormModel<T>>(() => formModel)
const normalizedSchemaRefs = shallowRef<Array<ComputedRef<NormalizedSchemaFormItem<T> | undefined>>>([])

function rebuildNormalizedSchemaRefs(): void {
  normalizedSchemaRefs.value = props.schemas.map(schema => computed(() =>
    normalizeSchemaFormItems([schema], {
      canAccess: props.canAccess,
      mode: activeMode.value,
      model: formModel,
      setFieldValue,
    })[0],
  ))

  // schemas 可在运行时增加字段；保持粒度优化的同时补入新增字段默认值。
  const defaults = normalizeSchemaFormItems(props.schemas, {
    canAccess: props.canAccess,
    mode: activeMode.value,
    model: formModel,
    setFieldValue,
  })
  const nextModel = resolveSchemaFormInitialModel(defaults, formModel)
  Object.keys(nextModel).forEach((field) => {
    if (!Object.hasOwn(formModel, field)) {
      ;(formModel as Record<string, unknown>)[field] = (nextModel as Record<string, unknown>)[field]
    }
  })
}

watch(() => props.schemas, rebuildNormalizedSchemaRefs, { deep: true, immediate: true })

const normalizedSchemas = computed(() => normalizedSchemaRefs.value
  .map(schema => schema.value)
  .filter((schema): schema is NormalizedSchemaFormItem<T> => Boolean(schema)))

const renderableSchemas = computed(() => normalizedSchemas.value.filter(schema => schema.renderable))

function replaceFormModel(nextModel: SchemaFormModel<T>): void {
  const current = formModel as Record<string, unknown>
  const next = nextModel as Record<string, unknown>

  Object.keys(current).forEach((field) => {
    if (!Object.hasOwn(next, field)) {
      delete current[field]
    }
  })
  Object.assign(current, next)
}

watch(() => model.value, replaceFormModel, { deep: true })

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
  const dictionary = schema.dictionary ?? schema.dictType
  if (dictionary) {
    return dictionaryMap.value[dictionary] ?? []
  }

  return schema.options
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
    .map(item => resolveSchemaOptions(schema).find(option => String(option.value) === String(item))?.label ?? item)
    .filter(item => item !== null && item !== undefined && item !== '')

  return labels.length > 0 ? labels.map(String).join(', ') : '-'
}

/***********************事件处理*********************/
function createFieldContext(field: string, value: unknown): SchemaFormContext<T> {
  return {
    field: field as Extract<keyof T, string>,
    getValues: () => normalizedModel.value,
    mode: activeMode.value,
    model: normalizedModel.value,
    setFieldValue,
    value,
  }
}

function setFieldValue(field: Extract<keyof T, string>, value: unknown): void {
  (formModel as Record<string, unknown>)[field] = value
  const nextModel = {
    ...formModel,
  } as SchemaFormModel<T>
  model.value = nextModel
  normalizedSchemas.value.find(schema => schema.field === field)?.onChange?.(
    value,
    createFieldContext(field, value),
  )
  emit('valuesChange', nextModel, [field])
}

function updateFieldValue(field: string, value: unknown): void {
  setFieldValue(field as Extract<keyof T, string>, value)
}

async function handleSubmit(): Promise<void> {
  if (activeMode.value === 'view' || props.submitLoading) {
    return
  }

  if (!await validate()) {
    return
  }

  emit('submit', normalizedModel.value)
}

function handleEnterSubmit(event: KeyboardEvent): void {
  if (!props.submitOnEnter || event.isComposing || (event.target as HTMLElement)?.tagName === 'TEXTAREA') {
    return
  }
  event.preventDefault()
  void handleSubmit()
}

function handleReset(): void {
  resetFields()
  emit('reset', normalizedModel.value)
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
  const nextModel = {
    ...formModel,
    ...value,
  } as SchemaFormModel<T>
  replaceFormModel(nextModel)
  model.value = nextModel
}

function setMode(mode: SchemaFormMode): void {
  activeMode.value = mode
}

async function validate(): Promise<boolean> {
  try {
    const result = await formRef.value?.validate?.()
    return result !== false
  }
  catch (error) {
    if (props.scrollToFirstError && error && typeof error === 'object') {
      const field = Object.keys(error)[0]
      if (field) {
        formRef.value?.scrollToField?.(field)
      }
    }
    return false
  }
}

function resetFields(): void {
  formRef.value?.resetFields?.()
  const nextModel = resolveSchemaFormInitialModel(normalizedSchemas.value, initialModel.value)
  replaceFormModel(nextModel)
  model.value = nextModel
}

function clearValidate(field?: string | string[]): void {
  formRef.value?.clearValidate?.(field)
}

function scrollToField(field: string): void {
  formRef.value?.scrollToField?.(field)
}

function getFieldComponent(field: string): HTMLElement | undefined {
  const formElement = formRef.value?.$el as HTMLElement | undefined
  return formElement?.querySelector<HTMLElement>(`[data-field="${field}"] input, [data-field="${field}"] textarea, [data-field="${field}"] select, [data-field="${field}"] button`) ?? undefined
}

/***********************公开方法*********************/
defineExpose({
  clearValidate,
  getFieldComponent,
  getFormElement: () => formRef.value?.$el as HTMLFormElement | undefined,
  getFormInstance: () => formRef.value,
  getValues: () => normalizedModel.value,
  resetFields,
  scrollToField,
  setFieldValue,
  setMode,
  setValues,
  validate,
})
</script>

<template>
  <ElForm
    ref="formRef"
    v-loading="props.loading"
    class="lumal-schema-form"
    :class="{ 'is-compact': props.compact }"
    :disabled="props.disabled"
    :label-position="props.labelPosition"
    :label-width="props.labelWidth"
    :model="normalizedModel"
    @keydown.enter="handleEnterSubmit"
    @submit.prevent="handleSubmit"
  >
    <ElRow class="lumal-schema-form__row" :gutter="props.gutter" :data-columns="props.columns">
      <ElCol
        v-for="schema in renderableSchemas"
        :key="schema.field"
        :span="resolveFieldSpan(schema)"
        :class="{ 'is-full-span': resolveFieldSpan(schema) === 24 }"
      >
        <ElFormItem
          class="lumal-schema-form__item"
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
            <span v-if="activeMode === 'view'" class="lumal-schema-form__readonly-value">
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

          <p v-if="schema.description" class="lumal-schema-form__description">
            {{ schema.description }}
          </p>
          <p v-if="schema.help" class="lumal-schema-form__help">
            {{ schema.help }}
          </p>
        </ElFormItem>
      </ElCol>
    </ElRow>

    <div
      v-if="showActions && activeMode !== 'view'"
      class="lumal-schema-form__actions"
      :class="[`is-${actionLayout}`, `is-${actionPosition}`]"
    >
      <ElButton v-if="showReset" native-type="button" :disabled="submitLoading" @click="handleReset">
        {{ resetText }}
      </ElButton>
      <ElButton type="primary" native-type="submit" :loading="submitLoading" :disabled="submitLoading">
        {{ submitText }}
      </ElButton>
    </div>
  </ElForm>
</template>

<style scoped lang="scss">
.lumal-schema-form {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 18px;
}

.lumal-schema-form__row {
  min-width: 0;
  row-gap: 18px;
}

.lumal-schema-form__item {
  width: 100%;
  margin-bottom: 0;
}

.lumal-schema-form__item :deep(.el-form-item__content) {
  min-width: 0;
}

.lumal-schema-form.is-compact .lumal-schema-form__row {
  row-gap: 10px;
}

.lumal-schema-form__description,
.lumal-schema-form__help {
  width: 100%;
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: calc(var(--lumal-font-size-base, 14px) - 2px);
  line-height: 1.5;
}

.lumal-schema-form__help {
  color: var(--el-color-info);
}

.lumal-schema-form__item :deep(.el-input),
.lumal-schema-form__item :deep(.el-input-number),
.lumal-schema-form__item :deep(.el-select),
.lumal-schema-form__item :deep(.el-cascader),
.lumal-schema-form__item :deep(.el-date-editor),
.lumal-schema-form__item :deep(.el-tree-select) {
  width: 100%;
  min-width: 0;
}

.lumal-schema-form__readonly-value {
  min-height: 32px;
  color: var(--el-text-color-regular);
  line-height: 32px;
  overflow-wrap: anywhere;
}

.lumal-schema-form__actions {
  display: flex;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  justify-content: flex-end;
}

.lumal-schema-form__actions.is-left {
  justify-content: flex-start;
}

.lumal-schema-form__actions.is-center {
  justify-content: center;
}

.lumal-schema-form__actions.is-inline {
  padding-top: 0;
  border-top: 0;
}

.lumal-schema-form__actions.is-newLine {
  margin-top: 4px;
}

@media (max-width: 1024px) {
  .lumal-schema-form__row :deep(.el-col:not(.is-full-span)) {
    max-width: 50%;
    flex: 0 0 50%;
  }
}

@media (max-width: 768px) {
  .lumal-schema-form {
    gap: 12px;
  }

  .lumal-schema-form__row {
    row-gap: 10px;
  }

  .lumal-schema-form__row :deep(.el-col.el-col) {
    max-width: 100%;
    flex: 0 0 100%;
  }

  .lumal-schema-form :deep(.el-input__wrapper),
  .lumal-schema-form :deep(.el-select__wrapper),
  .lumal-schema-form :deep(.el-input-number),
  .lumal-schema-form :deep(.el-date-editor) {
    min-height: 32px;
  }

  .lumal-schema-form__actions {
    padding-top: 12px;
    justify-content: stretch;
  }

  .lumal-schema-form__actions :deep(.el-button) {
    min-height: 32px;
    flex: 1 1 auto;
  }
}

@media (max-width: 480px) {
  .lumal-schema-form__item {
    display: block;
  }

  .lumal-schema-form__item :deep(.el-form-item__label) {
    width: 100% !important;
    height: auto;
    justify-content: flex-start;
    padding: 0 0 6px;
    line-height: 20px;
  }

  .lumal-schema-form__item :deep(.el-form-item__content) {
    width: 100%;
    margin-left: 0 !important;
  }
}
</style>
