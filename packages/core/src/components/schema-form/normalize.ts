import type {
  NormalizedSchemaFormItem,
  SchemaFormContext,
  SchemaFormItem,
  SchemaFormMode,
  SchemaFormModel,
  SchemaFormRecord,
  SchemaFormStateResolver,
} from './types'
import { unref } from 'vue'

export interface NormalizeSchemaFormItemsOptions<T extends SchemaFormRecord = Record<string, unknown>> {
  canAccess?: (authority: NonNullable<SchemaFormItem<T>['authority']>) => boolean
  mode?: SchemaFormMode
  model?: SchemaFormModel<T>
}

/***********************字段归一化*********************/
function createSchemaFormItemId(field: string): string {
  const normalizedField = field.replace(/[^\w-]/g, '-')
  return `luma-schema-form-${normalizedField}`
}

function resolveState<T extends SchemaFormRecord>(
  value: SchemaFormStateResolver<T> | undefined,
  context: SchemaFormContext<T>,
): boolean {
  if (typeof value === 'function') {
    return Boolean(value(context))
  }

  return Boolean(value)
}

function canRenderByAuthority<T extends SchemaFormRecord>(
  item: SchemaFormItem<T>,
  options: NormalizeSchemaFormItemsOptions<T>,
): boolean {
  if (!item.authority) {
    return true
  }

  return options.canAccess?.(item.authority) !== false
}

export function normalizeSchemaFormItems<T extends SchemaFormRecord = Record<string, unknown>>(
  items: SchemaFormItem<T>[] = [],
  options: NormalizeSchemaFormItemsOptions<T> = {},
): NormalizedSchemaFormItem<T>[] {
  const context: SchemaFormContext<T> = {
    mode: options.mode ?? 'create',
    model: options.model ?? {} as SchemaFormModel<T>,
  }

  return items
    .filter(item => item.field.trim())
    .map((item) => {
      const component = item.component ?? (item.dictionary || item.dictType ? 'select' : 'input')
      const hidden = resolveState(item.hidden, context)
      const disabled = resolveState(item.disabled, context)
      const readonlyByAuthority = item.readonlyAuthority
        ? options.canAccess?.(item.readonlyAuthority) === false
        : false
      const readonly = context.mode === 'view'
        || readonlyByAuthority
        || resolveState(item.readonly, context)
      const renderable = !hidden && component !== 'hidden' && canRenderByAuthority(item, options)

      return {
        ...item,
        id: createSchemaFormItemId(item.field),
        component,
        componentProps: {
          ...(item.props ?? {}),
          ...(item.componentProps ?? {}),
        } as NormalizedSchemaFormItem<T>['componentProps'],
        disabled,
        options: unref(item.options) ?? [],
        readonly,
        renderable,
        rules: item.rules ?? [],
      }
    })
}

/***********************模型归一化*********************/
export function resolveSchemaFormInitialModel<T extends SchemaFormRecord = Record<string, unknown>>(
  schemas: NormalizedSchemaFormItem<T>[],
  model: SchemaFormModel<T> = {} as SchemaFormModel<T>,
): SchemaFormModel<T> {
  return schemas.reduce<SchemaFormModel<T>>((result, schema) => {
    if (!(schema.field in result) && schema.defaultValue !== undefined) {
      (result as Record<string, unknown>)[schema.field] = schema.defaultValue
    }

    return result
  }, { ...model })
}
