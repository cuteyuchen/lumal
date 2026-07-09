import type { NormalizedSchemaFormItem, SchemaFormItem, SchemaFormModel } from './types'

/***********************字段归一化*********************/
function createSchemaFormItemId(field: string): string {
  const normalizedField = field.replace(/[^\w-]/g, '-')
  return `luma-schema-form-${normalizedField}`
}

export function normalizeSchemaFormItems(items: SchemaFormItem[] = []): NormalizedSchemaFormItem[] {
  return items
    .filter(item => item.field.trim())
    .map((item) => {
      const component = item.component ?? (item.dictionary || item.dictType ? 'select' : 'input')
      const renderable = !item.hidden && component !== 'hidden'

      return {
        ...item,
        id: createSchemaFormItemId(item.field),
        component,
        options: item.options ?? [],
        renderable,
      }
    })
}

/***********************模型归一化*********************/
export function resolveSchemaFormInitialModel(
  schemas: NormalizedSchemaFormItem[],
  model: SchemaFormModel = {},
): SchemaFormModel {
  return schemas.reduce<SchemaFormModel>((result, schema) => {
    if (!(schema.field in result) && schema.defaultValue !== undefined) {
      result[schema.field] = schema.defaultValue
    }

    return result
  }, { ...model })
}
