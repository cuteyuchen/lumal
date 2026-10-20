<script setup lang="ts">
import { AccessControl, useVbenForm, useVbenVxeGrid } from '@lumal/vben-compat/v5'
import { ElButton, ElDialog } from 'element-plus'
import { nextTick, shallowRef } from 'vue'

interface User { id: string, name: string, role: string }

/***********************Vben 5.7.0 查询分页和列插槽*********************/
let users: User[] = Array.from({ length: 24 }, (_, index) => ({ id: String(index + 1), name: `用户 ${index + 1}`, role: 'guest' }))
const failNext = shallowRef(false)
const [Grid, gridApi] = useVbenVxeGrid<User>({
  tableTitle: '用户管理',
  formOptions: { schema: [{ fieldName: 'keyword', component: 'Input', label: '姓名' }] },
  gridOptions: {
    rowConfig: { keyField: 'id' },
    pagerConfig: { pageSize: 10, pageSizes: [10, 20] },
    columns: [
      { type: 'checkbox', width: 48 },
      { type: 'seq', title: '序号', width: 64 },
      { field: 'name', title: '姓名', sortable: true },
      { field: 'role', title: '角色' },
      { field: 'id', title: '操作', slots: { default: 'operation' } },
    ],
    toolbarConfig: { custom: true, refresh: true, search: true },
    proxyConfig: {
      ajax: {
        async query({ page, sort }, values) {
          if (failNext.value) {
            failNext.value = false
            throw new Error('本次查询失败，请重试')
          }
          const filtered = users.filter(user => user.name.includes(String(values.keyword ?? '')))
          if (sort.field === 'name')
            filtered.sort((left, right) => left.name.localeCompare(right.name) * (sort.order === 'desc' ? -1 : 1))
          return { items: filtered.slice((page.currentPage - 1) * page.pageSize, page.currentPage * page.pageSize), total: filtered.length }
        },
      },
    },
  },
})

/***********************弹窗编辑与单飞保存*********************/
const visible = shallowRef(false)
const saving = shallowRef(false)
const editingId = shallowRef<string>()
const failure = shallowRef('')
const [Form, formApi] = useVbenForm<{ name: string, role: string }>({
  showDefaultActions: false,
  schema: [
    { fieldName: 'name', component: 'Input', label: '姓名', rules: 'required' },
    { fieldName: 'role', component: 'Select', label: '角色', defaultValue: 'guest', componentProps: { options: [{ label: '管理员', value: 'admin' }, { label: '访客', value: 'guest' }] } },
  ],
})
async function open(row?: User) {
  editingId.value = row?.id
  failure.value = ''
  visible.value = true
  await nextTick()
  await formApi.resetForm()
  if (row)
    await formApi.setValues(row)
}
async function save() {
  if (saving.value || !(await formApi.validate()).valid)
    return
  saving.value = true
  try {
    const values = await formApi.getValues()
    const user = { id: editingId.value ?? crypto.randomUUID(), name: String(values.name), role: String(values.role) }
    users = editingId.value ? users.map(row => row.id === user.id ? user : row) : [user, ...users]
    visible.value = false
    await gridApi.reload()
  }
  catch (error) {
    failure.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    saving.value = false
  }
}
async function remove(row: User) {
  users = users.filter(user => user.id !== row.id)
  await gridApi.query()
}
</script>

<template>
  <section class="compat-workspace__section">
    <p v-if="failure" role="alert">
      {{ failure }}
    </p>
    <Grid>
      <template #toolbar-tools>
        <AccessControl type="code" :codes="['user:write']">
          <ElButton type="primary" @click="open()">
            新增用户
          </ElButton>
        </AccessControl>
        <ElButton @click="failNext = true; gridApi.query().catch(() => {})">
          测试失败恢复
        </ElButton>
      </template>
      <template #operation="{ row }">
        <AccessControl type="code" :codes="['user:write']">
          <ElButton link @click="open(row)">
            编辑
          </ElButton>
          <ElButton link type="danger" @click="remove(row)">
            删除
          </ElButton>
        </AccessControl>
      </template>
    </Grid>
    <ElDialog v-model="visible" title="用户" destroy-on-close width="min(640px, 92vw)">
      <Form />
      <template #footer>
        <ElButton @click="visible = false">
          取消
        </ElButton>
        <ElButton type="primary" :loading="saving" @click="save">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </section>
</template>
