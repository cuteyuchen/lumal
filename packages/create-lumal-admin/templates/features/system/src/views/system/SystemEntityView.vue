<script setup lang="ts">
import type { CrudDataSource, SchemaFormItem, SchemaFormOption, SchemaTableRow } from '@lumal/core/components'
import { LumalCrudTable } from '@lumal/core/components'
import { ElAlert } from 'element-plus'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { entities } from '../../business/system/entities'
import { permissionStore, service } from '../../services/session'

/***********************业务模块配置*********************/
const route = useRoute()
// RouterView 按路径缓存实例；离开页面后不能读取新路由并切换本实例的数据源。
const entity = entities.find(item => `/system/${item.resource}` === route.path)
if (!entity)
  throw new Error('未注册的系统模块')
const tableRef = useTemplateRef<InstanceType<typeof LumalCrudTable>>('tableRef')
const can = (action: string) => permissionStore.hasPermission(`${entity.permission}:${action}`)
const table = computed(() => ({ columns: entity.columns, showColumnSettings: true, rowKey: 'id', selection: true }))
const actions = computed(() => ({ view: true, edit: can('update'), remove: entity.remove !== false && can('delete') }))
const toolbar = computed(() => ({ create: entity.create !== false && can('create'), batchDelete: false, refresh: true, export: true }))
const querySchemas = computed(() => [
  { field: 'keyword', label: '关键词', component: 'input' as const },
  ...(entity.resource === 'dictionaries/items' ? [{ field: 'typeCode', label: '字典编码', component: 'input' as const }] : []),
])
const operationError = shallowRef('')
function handleOperationError(error: unknown): void {
  operationError.value = error instanceof Error ? error.message : String(error)
}

/***********************业务引用数据*********************/
const roleOptions = shallowRef<SchemaFormOption[]>()
const schemas = computed<SchemaFormItem[]>(() => entity.schemas.map(schema =>
  schema.field === 'roles' && roleOptions.value ? { ...schema, options: roleOptions.value } : schema))
watch(() => entity.resource, async (resource, _previous, onCleanup) => {
  let active = true
  onCleanup(() => {
    active = false
  })
  if (resource !== 'users' || !permissionStore.hasPermission('system:role:list'))
    return
  try {
    const result = await service.list('roles', { page: 1, pageSize: 1000, query: {} })
    if (active)
      roleOptions.value = result.items.filter(row => row.status !== 'disabled').map(row => ({ label: String(row.name ?? row.code), value: String(row.code) }))
  }
  catch (error) {
    // 引用数据失败应进入应用错误边界，不能把加载失败伪装成空角色。
    if (active)
      throw error
  }
}, { immediate: true })

/***********************真实应用数据源*********************/
function id(row: SchemaTableRow): string {
  if (typeof row.id !== 'string' && typeof row.id !== 'number')
    throw new Error('业务记录缺少主键 id')
  return String(row.id)
}
const dataSource: CrudDataSource = {
  fetch: input => service.list(entity.resource, input),
  create: model => service.save(entity.resource, model),
  update: (row, model) => service.save(entity.resource, model, id(row)),
  remove: row => service.remove(entity.resource, id(row)),
}
defineExpose({ reload: () => tableRef.value?.reload() })
</script>

<template>
  <main class="lumal-admin-page">
    <ElAlert v-if="operationError" :title="operationError" type="error" role="alert" closable @close="operationError = ''" />
    <LumalCrudTable
      ref="tableRef"
      :key="entity.resource"
      :title="entity.title"
      :table="table"
      :form-schemas="schemas"
      :data-source="dataSource"
      :query="{ schemas: querySchemas, columns: 3 }"
      :actions="actions"
      :toolbar="toolbar"
      :editor="{ type: 'dialog', columns: 2 }"
      @operation-error="handleOperationError"
    />
  </main>
</template>
