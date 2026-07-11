<script setup lang="ts">
import type { SchemaTableColumn } from '@luma/core/components'
import { LumaPage, LumaPagination, LumaSchemaTable } from '@luma/core/components'
import { useConfirmAction, useDictionaryMap, useFullscreen, usePagination, usePersistentState, useSelection } from '@luma/core/composables'
import { createStorage } from '@luma/core/utils'
import { ElButton, ElInput, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { computed, shallowRef, useTemplateRef } from 'vue'

interface UserRow { id: number, name: string, status: string }
const keyword = shallowRef('')
async function fetchUsers(params: Record<string, unknown>): Promise<{ items: UserRow[], total: number }> {
  await new Promise(resolve => window.setTimeout(resolve, 250))
  const all = Array.from({ length: 23 }, (_, index) => ({ id: index + 1, name: `演示用户 ${index + 1}`, status: index % 3 ? 'enabled' : 'disabled' }))
    .filter(row => row.name.includes(String(params.keyword ?? '')))
  const page = Number(params.page ?? 1)
  const pageSize = Number(params.pageSize ?? 5)
  const start = (page - 1) * pageSize
  return { items: all.slice(start, start + pageSize), total: all.length }
}
const pagination = usePagination<UserRow>(fetchUsers, () => ({ keyword: keyword.value }), { initialPageSize: 5 })
const selection = useSelection<UserRow>({ rowKey: row => row.id })
const { dictionaryMap } = useDictionaryMap(() => ['status', 'priority'])
const storage = createStorage(localStorage, 'luma-example')
const counter = usePersistentState(storage, 'composable-counter', 0)
const confirmResult = shallowRef('等待操作')
const { confirmAction } = useConfirmAction({ confirm: options => ElMessageBox.confirm(options.message, options.title, { confirmButtonText: options.confirmButtonText, cancelButtonText: options.cancelButtonText, type: 'warning' }) })
const fullscreenTarget = useTemplateRef<HTMLElement>('fullscreenTarget')
const fullscreen = useFullscreen(() => fullscreenTarget.value ?? undefined)
const columns: SchemaTableColumn<UserRow>[] = [{ field: 'name', label: '姓名', minWidth: 160 }, { field: 'status', label: '状态', dictionary: 'status', width: 120 }]
async function search(): Promise<void> {
  await pagination.setPage(1)
  await pagination.fetchData()
}
async function confirmDemo(): Promise<void> {
  const result = await confirmAction(async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return '确认回调已完成'
  }, { title: '操作确认', message: '执行一次异步演示操作？' })
  confirmResult.value = result ?? '用户取消了操作'
  if (result)
    ElMessage.success(result)
}
const dictionaryCount = computed(() => Object.values(dictionaryMap.value).reduce((sum, list) => sum + list.length, 0))
void pagination.fetchData()
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Composables 实验区" description="覆盖当前公开的确认、字典、全屏、分页、持久化与选择组合式函数。">
      <div class="composable-grid">
        <section class="demo-card">
          <h3>useConfirmAction</h3><p>注入 Element Plus 确认 UI，并等待异步回调。</p><ElButton type="danger" @click="confirmDemo">
            触发确认
          </ElButton><div class="result-box">
            {{ confirmResult }}
          </div>
        </section>
        <section class="demo-card">
          <h3>useDictionaryMap</h3><p>批量加载 status 与 priority 字典。</p><div class="tag-list">
            <template v-for="(options, name) in dictionaryMap" :key="name">
              <ElTag v-for="option in options" :key="`${name}-${option.value}`">
                {{ name }} · {{ option.label }}
              </ElTag>
            </template><span v-if="!dictionaryCount">字典加载中或暂无数据</span>
          </div>
        </section>
        <section ref="fullscreenTarget" class="demo-card fullscreen-card">
          <h3>useFullscreen</h3><p>将当前卡片作为全屏目标，并同步浏览器状态。</p><ElButton @click="fullscreen.toggle()">
            {{ fullscreen.isFullscreen.value ? '退出全屏' : '进入全屏' }}
          </ElButton><div class="result-box">
            状态：{{ fullscreen.isFullscreen.value ? '全屏中' : '普通模式' }}
          </div>
        </section>
        <section class="demo-card">
          <h3>usePersistentState</h3><p>计数器自动同步到 localStorage，刷新仍保留。</p><div class="counter">
            <ElButton @click="counter--">
              −
            </ElButton><strong>{{ counter }}</strong><ElButton type="primary" @click="counter++">
              ＋
            </ElButton><ElButton link @click="counter = 0">
              重置
            </ElButton>
          </div>
        </section>
      </div>
      <section class="demo-card pagination-card">
        <h3>usePagination + useSelection</h3><p>真实查询、加载、分页与跨操作选择反馈。</p><div class="query-row">
          <ElInput v-model="keyword" clearable placeholder="搜索用户" @keyup.enter="search" /><ElButton type="primary" :loading="pagination.loading.value" @click="search">
            查询
          </ElButton><ElButton @click="selection.clear()">
            清空选择
          </ElButton><span>已选 {{ selection.selectedKeys.value.length }} 项</span>
        </div>
        <LumaSchemaTable :columns="columns" :rows="pagination.items.value" row-key="id" selection :loading="pagination.loading.value" @selection-change="rows => selection.setSelected(rows)" />
        <LumaPagination v-model:page="pagination.page.value" v-model:page-size="pagination.pageSize.value" :total="pagination.total.value" :page-sizes="[5, 10]" @change="({ page, pageSize }) => { pagination.setPageSize(pageSize); pagination.setPage(page) }" />
      </section>
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.composable-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:16px}.demo-card{padding:20px;border:1px solid var(--el-border-color-light);border-radius:10px;background:var(--el-bg-color)}.demo-card h3{margin:0 0 8px}.demo-card p{margin:0 0 16px;color:var(--el-text-color-secondary);font-size:13px}.result-box{margin-top:14px;padding:10px;background:var(--el-fill-color-light);border-radius:6px}.tag-list,.counter,.query-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.fullscreen-card:fullscreen{padding:40px}.pagination-card{margin-top:8px}.query-row{margin-bottom:14px}.query-row .el-input{width:220px}.pagination-card .luma-pagination{margin-top:16px}@media(max-width:760px){.composable-grid{grid-template-columns:1fr}}
</style>
