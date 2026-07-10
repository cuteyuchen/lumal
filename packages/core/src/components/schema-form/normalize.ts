import type {
  NormalizedSchemaFormItem,
  SchemaFormContext,
  SchemaFormItem,
  SchemaFormMode,
  SchemaFormModel,
  SchemaFormStateResolver,
} from './types'

export interface NormalizeSchemaFormItemsOptions {
  canAccess?: (authority: NonNullable<SchemaFormItem['authority']>) => boolean
  mode?: SchemaFormMode
  model?: SchemaFormModel
}

/***********************字段归一化*********************/
function createSchemaFormItemId(field: string): string {
  const normalizedField = field.replace(/[^\w-]/g, '-')
  return `luma-schema-form-${normalizedField}`
}

function resolveState(value: SchemaFormStateResolver | undefined, context: SchemaFormContext): boolean {
  if (typeof value === 'function') {
    return Boolean(value(context))
  }

  return Boolean(value)
}

function canRenderByAuthority(
  item: SchemaFormItem,
  options: NormalizeSchemaFormItemsOptions,
): boolean {
  if (!item.authority) {
    return true
  }

  return options.canAccess?.(item.authority) !== false
}

export function normalizeSchemaFormItems(
  items: SchemaFormItem[] = [],
  options: NormalizeSchemaFormItemsOptions = {},
): NormalizedSchemaFormItem[] {
  const context: SchemaFormContext = {
    mode: options.mode ?? 'create',
    model: options.model ?? {},
  }

  return items
    .filter(item => item.field.trim())
    .map((item) => {
      const component = item.component ?? (item.dictionary || item.dictType ? 'select' : 'input')
      const hidden = resolveState(item.hidden, context)
      const disabled = resolveState(item.disabled, context)
      const readonly = context.mode === 'view' || resolveState(item.readonly, context)
      const renderable = !hidden && component !== 'hidden' && canRenderByAuthority(item, options)

      return {
        ...item,
        id: createSchemaFormItemId(item.field),
        component,
        componentProps: {
          ...(item.props ?? {}),
          ...(item.componentProps ?? {}),
        },
        disabled,
        options: item.options ?? [],
        readonly,
        renderable,
        rules: item.rules ?? [],
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
