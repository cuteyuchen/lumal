import type { SchemaFormComponentType, SchemaFormItem, SchemaFormOption } from '@luma/core/components'
import type { VbenFormComponentProps, VbenFormSchema } from '../types'

/***********************组件类型适配*********************/
function adaptVbenFormComponent(component: string | undefined): SchemaFormComponentType {
  const normalizedComponent = component?.toLowerCase() ?? 'input'

  if (normalizedComponent.includes('textarea')) {
    return 'textarea'
  }

  if (normalizedComponent.includes('select')) {
    return 'select'
  }

  if (normalizedComponent.includes('hidden')) {
    return 'hidden'
  }

  return 'input'
}

/***********************属性适配*********************/
function adaptVbenComponentProps(componentProps: VbenFormComponentProps = {}): Record<string, unknown> {
  const {
    options: _options,
    placeholder: _placeholder,
    ...props
  } = componentProps

  return props
}

function adaptVbenOptions(componentProps: VbenFormComponentProps = {}): SchemaFormOption[] | undefined {
  return componentProps.options?.map(option => ({
    disabled: option.disabled,
    label: option.label,
    value: option.value,
  }))
}

/***********************显示和校验适配*********************/
function isVbenSchemaHidden(schema: VbenFormSchema): boolean {
  return Boolean(schema.hidden || schema.show === false || schema.ifShow === false)
}

function isVbenSchemaRequired(schema: VbenFormSchema): boolean | undefined {
  return schema.required ?? (schema.rules?.some(rule => rule.required) || undefined)
}

/***********************Schema 适配*********************/
export function adaptVbenFormSchema(schema: VbenFormSchema): SchemaFormItem {
  const field = schema.fieldName ?? schema.field ?? ''
  const componentProps = schema.componentProps ?? {}

  return {
    component: adaptVbenFormComponent(schema.component),
    defaultValue: schema.defaultValue,
    field,
    hidden: isVbenSchemaHidden(schema) || undefined,
    label: schema.label,
    options: adaptVbenOptions(componentProps),
    placeholder: componentProps.placeholder,
    props: adaptVbenComponentProps(componentProps),
    required: isVbenSchemaRequired(schema),
  }
}

export function adaptVbenFormSchemas(schemas: VbenFormSchema[] = []): SchemaFormItem[] {
  return schemas.map(schema => adaptVbenFormSchema(schema))
}
