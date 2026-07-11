import type { SchemaFormItem } from '../schema-form'
import type { CrudTableColumn } from './types'

export function deriveCrudFormSchemas(
  columns: readonly CrudTableColumn[] = [],
  formSchemas: readonly SchemaFormItem[] = [],
): SchemaFormItem[] {
  if (formSchemas.length > 0) {
    return [...formSchemas]
  }

  return columns
    .filter(column => column.showInForm !== false && column.field !== 'action')
    .map(column => ({
      append: column.append,
      component: column.component ?? (column.dictionary || column.dictType ? 'select' : 'input'),
      componentProps: column.formComponentProps,
      defaultValue: column.defaultValue,
      dictionary: column.dictionary,
      dictType: column.dictType,
      editDisabled: column.editDisabled,
      field: column.field,
      label: column.label,
      options: column.options,
      placeholder: column.placeholder,
      prefix: column.prefix,
      prepend: column.prepend,
      required: column.required,
      rules: column.rules,
      span: column.span,
      suffix: column.suffix,
    } as SchemaFormItem))
}
