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
  setFieldValue?: (field: Extract<keyof T, string>, value: unknown) => void
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

function resolveValue<T extends SchemaFormRecord, R>(
  value: R | ((context: SchemaFormContext<T>) => R) | undefined,
  context: SchemaFormContext<T>,
  fallback: R,
): R {
  if (typeof value === 'function') {
    return (value as (context: SchemaFormContext<T>) => R)(context)
  }

  return value ?? fallback
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
  const model = options.model ?? {} as SchemaFormModel<T>

  return items
    .filter(item => item.field.trim())
    .map((item) => {
      const context: SchemaFormContext<T> = {
        field: item.field,
        getValues: () => model,
        mode: options.mode ?? 'create',
        model,
        setFieldValue: options.setFieldValue ?? (() => undefined),
        value: model[item.field],
      }
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
      const componentProps = resolveValue(item.componentProps, context, {})
      const rawOptions = typeof item.options === 'function' ? item.options(context) : unref(item.options)

      return {
        ...item,
        id: createSchemaFormItemId(item.field),
        component,
        componentProps: {
          ...componentProps,
        } as NormalizedSchemaFormItem<T>['componentProps'],
        description: resolveValue(item.description, context, ''),
        disabled,
        help: resolveValue(item.help, context, ''),
        options: rawOptions ?? [],
        required: resolveState(item.required, context),
        readonly,
        renderable,
        rules: resolveValue(item.rules, context, []),
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
