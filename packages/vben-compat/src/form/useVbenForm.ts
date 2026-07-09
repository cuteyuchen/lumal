import type { SchemaFormItem, SchemaFormModel } from '@luma/core/components'
import type { UseVbenFormInput, UseVbenFormOptions, UseVbenFormReturn } from '../types'
import { computed, reactive, shallowRef, toRef, watch } from 'vue'
import { adaptVbenFormSchemas } from './adapter'

/***********************模型工具*********************/
function createInitialModel(schemas: SchemaFormItem[], options: UseVbenFormOptions): SchemaFormModel {
  const model: SchemaFormModel = {
    ...(options.model ?? {}),
  }

  for (const schema of schemas) {
    if (!(schema.field in model) && schema.defaultValue !== undefined) {
      model[schema.field] = schema.defaultValue
    }
  }

  return model
}

function replaceModel(target: SchemaFormModel, source: SchemaFormModel): void {
  for (const key of Object.keys(target)) {
    delete target[key]
  }

  Object.assign(target, source)
}

/***********************表单组合函数*********************/
export function useVbenForm(options: UseVbenFormInput = {}): UseVbenFormReturn {
  const optionsRef = toRef(options)
  const formInstance = shallowRef<unknown>()
  const model = reactive<SchemaFormModel>({})

  const lumaSchemas = computed(() => adaptVbenFormSchemas(optionsRef.value.schemas))

  function getFieldsValue(): SchemaFormModel {
    return {
      ...model,
    }
  }

  function setFieldsValue(values: SchemaFormModel): void {
    Object.assign(model, values)
  }

  function handleUpdateModel(nextModel: SchemaFormModel): void {
    replaceModel(model, nextModel)
  }

  function resetFields(): void {
    replaceModel(model, createInitialModel(lumaSchemas.value, optionsRef.value))
  }

  function handleSubmit(nextModel: SchemaFormModel = getFieldsValue()): void {
    optionsRef.value.submit?.(nextModel)
  }

  function register(instance?: unknown): void {
    formInstance.value = instance
  }

  watch(
    lumaSchemas,
    (schemas) => {
      const initialModel = createInitialModel(schemas, optionsRef.value)

      for (const [field, value] of Object.entries(initialModel)) {
        if (!(field in model)) {
          model[field] = value
        }
      }
    },
    { immediate: true },
  )

  const schemaFormProps = computed(() => ({
    'modelValue': getFieldsValue(),
    'onSubmit': handleSubmit,
    'onUpdate:modelValue': handleUpdateModel,
    'schemas': lumaSchemas.value,
    'showActions': optionsRef.value.showActions,
    'submitText': optionsRef.value.submitText,
  }))

  return [
    register,
    {
      getFieldsValue,
      getFormInstance: () => formInstance.value,
      getLumaSchemas: () => lumaSchemas.value,
      handleSubmit,
      handleUpdateModel,
      resetFields,
      schemaFormProps,
      setFieldsValue,
    },
  ]
}
