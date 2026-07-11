import type { ComputedRef, Ref } from 'vue'
import type { SchemaFormItem, SchemaFormModel } from '../schema-form'
import { computed, shallowRef } from 'vue'
import { normalizeSchemaFormItems, resolveSchemaFormInitialModel } from '../schema-form'

export function useCrudQuery(options: {
  schemas: ComputedRef<SchemaFormItem[]>
  model: Ref<SchemaFormModel>
  columns: ComputedRef<number>
  collapsible: ComputedRef<boolean>
  defaultCollapsed: ComputedRef<boolean>
  collapsedRows: ComputedRef<number>
}) {
  const collapsed = shallowRef(options.defaultCollapsed.value)
  const defaultModel = computed(() => resolveSchemaFormInitialModel(
    normalizeSchemaFormItems(options.schemas.value),
  ))
  const visibleSchemas = computed(() => {
    if (!options.collapsible.value || !collapsed.value) {
      return options.schemas.value
    }
    const defaultSpan = 24 / options.columns.value
    const capacity = options.columns.value * options.collapsedRows.value
    let used = 0
    return options.schemas.value.filter((schema) => {
      const units = Math.max(1, Math.ceil((schema.span ?? defaultSpan) / defaultSpan))
      if (used + units > capacity) {
        return false
      }
      used += units
      return true
    })
  })
  const canCollapse = computed(() => options.collapsible.value
    && visibleSchemas.value.length < options.schemas.value.length)

  function reset(): SchemaFormModel {
    const nextModel = { ...defaultModel.value }
    options.model.value = nextModel
    return nextModel
  }

  function toggle(): void {
    collapsed.value = !collapsed.value
  }

  return {
    canCollapse,
    collapsed,
    defaultModel,
    reset,
    toggle,
    visibleSchemas,
  }
}
