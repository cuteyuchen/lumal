import type { DictionaryLabelValue, DictionaryOption } from '../../dictionary'
import type { NormalizedSchemaTableColumn, SchemaTableRow } from './types'
import { getDictionaryLabel } from '../../dictionary'

export interface SchemaTableDictionaryTag {
  color?: string
  key: string
  label: string
}

export interface SchemaTableCellDisplay {
  tags: SchemaTableDictionaryTag[]
  text: string
}

function isDictionaryLabelValue(value: unknown): value is DictionaryLabelValue {
  if (value === undefined || value === null) {
    return true
  }

  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return true
  }

  return Array.isArray(value)
    && value.every(item =>
      typeof item === 'boolean' || typeof item === 'number' || typeof item === 'string',
    )
}

function resolveDictionaryTags(
  options: readonly DictionaryOption[],
  value: DictionaryLabelValue,
): SchemaTableDictionaryTag[] {
  const values = Array.isArray(value) ? value : [value]
  const tags = values.map((currentValue, index) => {
    const option = options.find(item => String(item.value) === String(currentValue))

    return {
      ...(option?.color ? { color: option.color } : {}),
      key: `${String(currentValue)}-${index}`,
      label: option?.label ?? String(currentValue),
    }
  })

  return tags.some(item => item.color) ? tags : []
}

export function resolveSchemaTableCellDisplay(
  row: SchemaTableRow,
  column: NormalizedSchemaTableColumn,
  index: number,
  options: readonly DictionaryOption[] = [],
): SchemaTableCellDisplay {
  const rawValue = row[column.field]
  const formattedValue = column.formatter?.(rawValue, row, index) ?? rawValue

  if (
    formattedValue === undefined
    || formattedValue === null
    || formattedValue === ''
    || (Array.isArray(formattedValue) && formattedValue.length === 0)
  ) {
    return { tags: [], text: column.emptyText }
  }

  if (column.formatter) {
    return { tags: [], text: String(formattedValue) }
  }

  if (options.length > 0 && isDictionaryLabelValue(formattedValue)) {
    return {
      tags: resolveDictionaryTags(options, formattedValue),
      text: getDictionaryLabel(options, formattedValue),
    }
  }

  return {
    tags: [],
    text: Array.isArray(formattedValue)
      ? formattedValue.map(item => String(item)).join(', ')
      : String(formattedValue),
  }
}
