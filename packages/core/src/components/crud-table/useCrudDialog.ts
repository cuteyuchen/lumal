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

function cloneModel(value: SchemaFormModel): SchemaFormModel {
  try {
    return structuredClone(value)
  }
  catch {
    return JSON.parse(JSON.stringify(value)) as SchemaFormModel
  }
}

export function useCrudDialog(options: {
  dataSource: ComputedRef<CrudDataSource | undefined>
  afterSave: () => Promise<void>
}) {
  const visible = shallowRef(false)
  const mode = shallowRef<CrudFormMode>('create')
  const model = shallowRef<SchemaFormModel>({})
  const initialSerialized = shallowRef('{}')
  const editingRow = shallowRef<SchemaTableRow>()
  const saving = shallowRef(false)
  const error = shallowRef('')
  const dirty = computed(() => mode.value !== 'view' && serialize(model.value) !== initialSerialized.value)

  function open(nextMode: CrudFormMode, row?: SchemaTableRow): void {
    const nextModel = row ? cloneModel(row) : {}
    mode.value = nextMode
    editingRow.value = row
    model.value = nextModel
    initialSerialized.value = serialize(nextModel)
    error.value = ''
    visible.value = true
  }

  async function submit(nextModel: SchemaFormModel, validate?: () => Promise<boolean>): Promise<boolean> {
    if (saving.value) {
      return false
    }
    const source = options.dataSource.value
    if (!source) {
      visible.value = false
      return true
    }
    saving.value = true
    error.value = ''
    try {
      if (validate && !await validate()) {
        return false
      }
      if (mode.value === 'edit' && editingRow.value) {
        await source.update?.(editingRow.value, nextModel)
      }
      else {
        await source.create?.(nextModel)
      }
      initialSerialized.value = serialize(nextModel)
      visible.value = false
      saving.value = false
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
