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
    return options.schemas.value.slice(0, options.columns.value * options.collapsedRows.value)
  })
  const canCollapse = computed(() => options.collapsible.value
    && options.schemas.value.length > options.columns.value * options.collapsedRows.value)

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
