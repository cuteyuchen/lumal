import type { SchemaFormMode, SchemaFormModel } from '@lumal/core/components'
import { ElMessage, ElMessageBox } from 'element-plus'
import { shallowRef } from 'vue'

interface ConfirmRemoveOptions {
  message: string
  title?: string
}

interface MutationContext<TRecord, TInput> {
  input?: TInput
  mode?: SchemaFormMode
  record: TRecord
}

export interface UseSchemaEntityCrudOptions<TRecord extends object, TInput> {
  create: (input: TInput) => Promise<unknown>
  update: (record: TRecord, input: TInput) => Promise<unknown>
  remove: (record: TRecord) => Promise<unknown>
  reload: () => Promise<void>
  toInput: (model: SchemaFormModel) => TInput
  confirmRemove: (record: TRecord) => ConfirmRemoveOptions
  saveSuccess: string
  saveError: string
  removeSuccess: string
  removeError: string
  afterSave?: (context: MutationContext<TRecord | undefined, TInput>) => unknown | Promise<unknown>
  afterRemove?: (context: MutationContext<TRecord, TInput>) => unknown | Promise<unknown>
}

function cloneModel(value: object): SchemaFormModel {
  try {
    return structuredClone(value) as SchemaFormModel
  }
  catch {
    return JSON.parse(JSON.stringify(value)) as SchemaFormModel
  }
}

export function useSchemaEntityCrud<TRecord extends object, TInput>(
  options: UseSchemaEntityCrudOptions<TRecord, TInput>,
) {
  const visible = shallowRef(false)
  const mode = shallowRef<SchemaFormMode>('create')
  const editingRecord = shallowRef<TRecord>()
  const model = shallowRef<SchemaFormModel>({})
  const saving = shallowRef(false)
  const error = shallowRef('')
  const removingRecords = new WeakSet<TRecord>()

  function openCreate(initialModel: SchemaFormModel = {}): void {
    mode.value = 'create'
    editingRecord.value = undefined
    model.value = cloneModel(initialModel)
    error.value = ''
    visible.value = true
  }

  function openEdit(record: TRecord, initialModel: SchemaFormModel = record as SchemaFormModel): void {
    mode.value = 'edit'
    editingRecord.value = record
    model.value = cloneModel(initialModel)
    error.value = ''
    visible.value = true
  }

  async function submit(nextModel: SchemaFormModel): Promise<void> {
    if (saving.value)
      return

    const currentMode = mode.value
    const record = editingRecord.value
    const input = options.toInput(nextModel)
    saving.value = true
    error.value = ''

    try {
      if (currentMode === 'edit' && record)
        await options.update(record, input)
      else
        await options.create(input)

      visible.value = false
      await options.reload()
      await options.afterSave?.({ input, mode: currentMode, record })
      ElMessage.success(options.saveSuccess)
    }
    catch (reason) {
      error.value = reason instanceof Error ? reason.message : options.saveError
    }
    finally {
      saving.value = false
    }
  }

  async function remove(record: TRecord): Promise<void> {
    if (removingRecords.has(record))
      return

    const confirmation = options.confirmRemove(record)
    try {
      await ElMessageBox.confirm(confirmation.message, confirmation.title ?? '删除确认', {
        cancelButtonText: '取消',
        confirmButtonText: '删除',
        type: 'warning',
      })
    }
    catch {
      return
    }

    removingRecords.add(record)
    try {
      await options.remove(record)
      await options.reload()
      await options.afterRemove?.({ record })
      ElMessage.success(options.removeSuccess)
    }
    catch (reason) {
      ElMessage.error(reason instanceof Error ? reason.message : options.removeError)
    }
    finally {
      removingRecords.delete(record)
    }
  }

  return {
    editingRecord,
    error,
    mode,
    model,
    openCreate,
    openEdit,
    remove,
    saving,
    submit,
    visible,
  }
}
