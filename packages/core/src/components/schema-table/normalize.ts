import type {
  NormalizedSchemaTableColumn,
  SchemaTableColumn,
  SchemaTableContext,
  SchemaTableStateResolver,
} from './types'

export interface NormalizeSchemaTableColumnsOptions {
  canAccess?: (authority: NonNullable<SchemaTableColumn['authority']>) => boolean
  rows?: SchemaTableContext['rows']
}

function resolveState(value: SchemaTableStateResolver | undefined, context: SchemaTableContext): boolean {
  if (typeof value === 'function') {
    return Boolean(value(context))
  }

  return Boolean(value)
}

function canRenderByAuthority(
  column: SchemaTableColumn,
  options: NormalizeSchemaTableColumnsOptions,
): boolean {
  if (!column.authority) {
    return true
  }

  return options.canAccess?.(column.authority) !== false
}

/***********************列归一化*********************/
export function normalizeSchemaTableColumns(
  columns: SchemaTableColumn[] = [],
  options: NormalizeSchemaTableColumnsOptions = {},
): NormalizedSchemaTableColumn[] {
  const context: SchemaTableContext = {
    rows: options.rows ?? [],
  }

  return columns
    .map(column => ({
      ...column,
      field: column.field.trim(),
    }))
    .filter(column => column.field)
    .map(column => ({
      ...column,
      align: column.align ?? 'left',
      componentProps: column.componentProps ?? {},
      emptyText: column.emptyText ?? '-',
      renderable: !resolveState(column.hidden, context) && canRenderByAuthority(column, options),
    }))
}
