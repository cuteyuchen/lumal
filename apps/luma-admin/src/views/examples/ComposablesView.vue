<script setup lang="ts">
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import { usePagination, useSelection } from '@luma/core/composables'
import { computed } from 'vue'

/***********************分页演示*********************/
// mock 远程数据：按页返回标准 { items, total }
async function fetchUsers(params: Record<string, unknown>): Promise<{ items: { id: number, name: string }[], total: number }> {
  const page = Number(params.page ?? 1)
  const pageSize = Number(params.pageSize ?? 5)
  const start = (page - 1) * pageSize
  const items = Array.from({ length: pageSize }, (_, index) => ({
    id: start + index + 1,
    name: `用户 ${start + index + 1}`,
  }))

  return { items, total: 23 }
}

const pagination = usePagination<{ id: number, name: string }>(fetchUsers, undefined, { initialPageSize: 5 })
void pagination.fetchData()

/***********************行选择演示*********************/
const selection = useSelection<{ id: number, name: string }>()

function toggleFirst(): void {
  const first = pagination.items.value[0]
  if (first) {
    selection.toggle(first)
  }
}

/***********************展示项*********************/
const items = computed(() => [
  { label: '当前页', value: pagination.page.value },
  { label: '每页条数', value: pagination.pageSize.value },
  { label: '总数', value: pagination.total.value },
  { label: '本页首条', value: pagination.items.value[0]?.name ?? '-' },
  { label: '已选数量', value: selection.selectedKeys.value.length },
  { label: '已选主键', value: selection.selectedKeys.value.join(', ') || '-' },
])
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Composables" description="消费 @luma/core/composables 子入口，演示 usePagination 与 useSelection。">
      <div class="luma-admin-example__toolbar">
        <button class="luma-admin-example__button" type="button" :disabled="pagination.page.value <= 1" @click="pagination.setPage(pagination.page.value - 1)">
          上一页
        </button>
        <button class="luma-admin-example__button" type="button" @click="pagination.setPage(pagination.page.value + 1)">
          下一页
        </button>
        <button class="luma-admin-example__button luma-admin-example__button--primary" type="button" @click="toggleFirst">
          选中/取消本页首条
        </button>
      </div>

      <LumaInfoTable :items="items" :columns="3" label-width="80px" />
    </LumaPage>
  </main>
</template>
