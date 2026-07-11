<script setup lang="ts">
import type { PaginationChangePayload, SchemaFormModel } from '@luma/core/components'
import {
  LumaPage,
  LumaPageLayout,
  LumaPagination,
  LumaSchemaForm,
  LumaSchemaTable,
} from '@luma/core/components'
import { ElButton, ElMessage, ElTag } from 'element-plus'
import { computed, shallowRef } from 'vue'
import {
  createExampleQueryModel,
  exampleQuerySchemas,
  exampleTableColumns,
  exampleTableRows,
} from './example-data'

/***********************页面状态*********************/
const queryModel = shallowRef<SchemaFormModel>(createExampleQueryModel())
const page = shallowRef(1)
const pageSize = shallowRef(10)
const message = shallowRef('展示查询区、工具栏、内容区和分页区。')
const allRows = Array.from({ length: 36 }, (_, index) => ({ ...exampleTableRows[index % exampleTableRows.length], id: `layout-${index + 1}`, name: `布局数据 ${index + 1}` }))
const visibleRows = computed(() => allRows.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

/***********************事件处理*********************/
function handleSearch(): void {
  message.value = `已查询：${String(queryModel.value.keyword || '全部')} / ${String(queryModel.value.status)}`
}

function handleReset(): void {
  queryModel.value = createExampleQueryModel()
  message.value = '查询表单已恢复初始值。'
}

function handlePageChange(payload: PaginationChangePayload): void {
  message.value = `分页更新：第 ${payload.page} 页，每页 ${payload.pageSize} 条。`
}
function handleAction(action: string): void {
  message.value = `${action}操作已触发，内容区状态已同步。`
  ElMessage.success(message.value)
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Page Layout" :description="message">
      <LumaPageLayout @search="handleSearch" @reset="handleReset">
        <template #query>
          <section class="layout-region">
            <header>
              <ElTag size="small">
                Query / Form
              </ElTag><span>查询模型由 Schema Form 双向绑定</span>
            </header><LumaSchemaForm v-model="queryModel" :columns="3" :schemas="exampleQuerySchemas" />
          </section>
        </template>

        <template #toolbar>
          <section class="layout-region">
            <header>
              <ElTag size="small" type="success">
                Actions / Toolbar
              </ElTag><span>页面级操作与批量工具</span>
            </header><div class="luma-admin-example__toolbar">
              <ElButton type="primary" @click="handleAction('新增')">
                新增
              </ElButton><ElButton @click="handleAction('导出')">
                导出
              </ElButton><ElButton type="danger" plain @click="handleAction('批量删除')">
                批量删除
              </ElButton>
            </div>
          </section>
        </template>

        <section class="layout-region">
          <header>
            <ElTag size="small" type="warning">
              Content
            </ElTag><span>当前第 {{ page }} 页，共 36 条标准数据</span>
          </header><LumaSchemaTable
            :columns="exampleTableColumns"
            :rows="visibleRows"
            row-key="id"
            show-column-settings
          />
        </section>

        <template #pagination>
          <section class="layout-region layout-region--pagination">
            <header>
              <ElTag size="small" type="info">
                Pagination
              </ElTag><span>页码与每页条数均受控</span>
            </header><LumaPagination
              v-model:page="page"
              v-model:page-size="pageSize"
              :total="36"
              :page-sizes="[10, 20]"
              @change="handlePageChange"
            />
          </section>
        </template>
      </LumaPageLayout>
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.layout-region{padding:14px;border:1px dashed var(--el-border-color);border-radius:8px}.layout-region header{display:flex;align-items:center;gap:10px;margin-bottom:12px;color:var(--el-text-color-secondary);font-size:13px}.layout-region--pagination{width:100%}
</style>
