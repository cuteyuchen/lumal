import type {
  NormalizedSchemaTableColumn,
  SchemaTableColumn,
  SchemaTableContext,
  SchemaTableRecord,
  SchemaTableRow,
  SchemaTableStateResolver,
} from './types'

export interface NormalizeSchemaTableColumnsOptions<T extends SchemaTableRecord = SchemaTableRow> {
  canAccess?: (authority: NonNullable<SchemaTableColumn<T>['authority']>) => boolean
  rows?: SchemaTableContext<T>['rows']
}

function resolveState<T extends SchemaTableRecord>(
  value: SchemaTableStateResolver<T> | undefined,
  context: SchemaTableContext<T>,
): boolean {
  if (typeof value === 'function') {
    return Boolean(value(context))
  }

  return Boolean(value)
}

function canRenderByAuthority<T extends SchemaTableRecord>(
  column: SchemaTableColumn<T>,
  options: NormalizeSchemaTableColumnsOptions<T>,
): boolean {
  if (!column.authority) {
    return true
  }

  return options.canAccess?.(column.authority) !== false
}

/***********************列归一化*********************/
export function normalizeSchemaTableColumns<T extends SchemaTableRecord = SchemaTableRow>(
  columns: SchemaTableColumn<T>[] = [],
  options: NormalizeSchemaTableColumnsOptions<T> = {},
): NormalizedSchemaTableColumn<T>[] {
  const context: SchemaTableContext<T> = {
    rows: options.rows ?? [],
  }

  return columns
    .map(column => ({
      ...column,
      field: column.field.trim() as SchemaTableColumn<T>['field'],
    }))
    .filter(column => column.field)
    .map(column => ({
      ...column,
      align: column.align ?? 'left',
      componentProps: column.componentProps ?? {},
      emptyText: column.emptyText ?? '-',
      renderable: (typeof column.hidden === 'function' || !resolveState(column.hidden, context))
        && canRenderByAuthority(column, options),
    } as NormalizedSchemaTableColumn<T>))
}
