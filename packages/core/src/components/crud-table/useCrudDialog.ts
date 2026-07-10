import type { ComputedRef } from 'vue'
import type { SchemaFormModel } from '../schema-form'
import type { SchemaTableRow } from '../schema-table'
import type { CrudDataSource, CrudFormMode } from './types'
import { computed, shallowRef } from 'vue'

function serialize(value: unknown): string {
  try {
    return JSON.stringify(value)
  }
  catch {
    return String(value)
  }
}

export function useCrudDialog(options: {
  dataSource: ComputedRef<CrudDataSource | undefined>
  afterSave: () => Promise<void>
}) {
  const visible = shallowRef(false)
  const mode = shallowRef<CrudFormMode>('create')
  const model = shallowRef<SchemaFormModel>({})
  const initialModel = shallowRef<SchemaFormModel>({})
  const editingRow = shallowRef<SchemaTableRow>()
  const saving = shallowRef(false)
  const error = shallowRef('')
  const dirty = computed(() => mode.value !== 'view' && serialize(model.value) !== serialize(initialModel.value))

  function open(nextMode: CrudFormMode, row?: SchemaTableRow): void {
    const nextModel = row ? { ...row } : {}
    mode.value = nextMode
    editingRow.value = row
    model.value = nextModel
    initialModel.value = { ...nextModel }
    error.value = ''
    visible.value = true
  }

  async function submit(nextModel: SchemaFormModel): Promise<boolean> {
    const source = options.dataSource.value
    if (!source) {
      visible.value = false
      return true
    }
    saving.value = true
    error.value = ''
    try {
      if (mode.value === 'edit' && editingRow.value) {
        await source.update?.(editingRow.value, nextModel)
      }
      else {
        await source.create?.(nextModel)
      }
      initialModel.value = { ...nextModel }
      visible.value = false
      await options.afterSave()
      return true
    }
    catch (reason) {
      error.value = reason instanceof Error ? reason.message : String(reason)
      return false
    }
    finally {
      saving.value = false
    }
  }

  return {
    dirty,
    editingRow,
    error,
    mode,
    model,
    open,
    saving,
    submit,
    visible,
  }
}
