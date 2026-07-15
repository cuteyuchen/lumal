<script setup lang="ts">
import type { SchemaTableColumn, SchemaTableRow } from '@luma/core/components'
import type { DictionaryOption } from '@luma/core/dictionary'
import type { SystemMenuRecord } from '../../api/system'
import { LumaPage, LumaSchemaTable } from '@luma/core/components'
import { ElAlert, ElButton } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchDictionaryTypes,
  fetchSystemMenus,
  fetchSystemRoleOptions,
  fetchSystemRoles,
  fetchSystemUsers,
} from '../../api/system'
import { currentUser } from '../../services/session'

interface DashboardMetric {
  label: string
  value: number
  description: string
}

const router = useRouter()
const loading = shallowRef(false)
const error = shallowRef('')
const metrics = shallowRef<DashboardMetric[]>([])
const recentUsers = shallowRef<SchemaTableRow[]>([])
const roleOptions = shallowRef<DictionaryOption[]>([])

const todayText = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'full',
}).format(new Date())

const title = computed(() => `欢迎回来，${currentUser.value?.name ?? '管理员'}`)
const quickActions = computed(() => [
  { authority: 'system:user:list', label: '用户管理', path: '/system/user' },
  { authority: 'system:role:list', label: '角色授权', path: '/system/role' },
  { authority: 'system:menu:list', label: '菜单配置', path: '/system/menu' },
  { authority: 'system:dict:list', label: '字典维护', path: '/system/dict' },
].filter(action => currentUser.value?.permissions.includes(action.authority)))

const userColumns = computed<SchemaTableColumn[]>(() => [
  { field: 'username', label: '用户名', minWidth: 140 },
  { field: 'nickname', label: '昵称', minWidth: 140 },
  { field: 'role', label: '角色', minWidth: 120, options: roleOptions.value },
  { dictionary: 'status', field: 'status', label: '状态', width: 100 },
  { field: 'createdAt', label: '创建时间', width: 130 },
])

function countMenus(items: SystemMenuRecord[]): number {
  return items.reduce((total, item) =>
    total + (item.type === 'button' ? 0 : 1) + countMenus(item.children ?? []), 0)
}

async function loadWorkspace(): Promise<void> {
  loading.value = true
  error.value = ''

  try {
    const [users, roles, menus, dictionaries, rolesForSelect] = await Promise.all([
      fetchSystemUsers({ page: 1, pageSize: 5, query: {} }),
      fetchSystemRoles({ page: 1, pageSize: 1, query: {} }),
      fetchSystemMenus(),
      fetchDictionaryTypes(),
      fetchSystemRoleOptions(),
    ])

    metrics.value = [
      { description: '后台账号总量', label: '用户', value: users.total },
      { description: '可分配角色数量', label: '角色', value: roles.total },
      { description: '目录与页面节点', label: '菜单', value: countMenus(menus) },
      { description: '可复用字典类型', label: '字典', value: dictionaries.length },
    ]
    recentUsers.value = users.items as unknown as SchemaTableRow[]
    roleOptions.value = rolesForSelect
  }
  catch (reason) {
    error.value = reason instanceof Error ? reason.message : '工作台数据加载失败'
  }
  finally {
    loading.value = false
  }
}

function navigate(path: string): void {
  void router.push(path)
}

onMounted(() => {
  void loadWorkspace()
})
</script>

<template>
  <main class="luma-admin-workspace">
    <LumaPage :title="title" :description="`${todayText} · 这里汇总当前后台运行与管理状态。`" :loading="loading">
      <template #actions>
        <ElButton native-type="button" :loading="loading" @click="loadWorkspace">
          刷新数据
        </ElButton>
      </template>

      <ElAlert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
      >
        <template #default>
          <ElButton link type="primary" native-type="button" @click="loadWorkspace">
            重新加载
          </ElButton>
        </template>
      </ElAlert>

      <section class="luma-admin-workspace__metrics" aria-label="后台指标">
        <article v-for="metric in metrics" :key="metric.label" class="luma-admin-workspace__metric">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.description }}</small>
        </article>
      </section>
    </LumaPage>

    <section class="luma-admin-workspace__columns">
      <LumaPage title="最近用户" description="最近创建的后台账号，完整操作请进入用户管理。">
        <template #actions>
          <ElButton
            v-if="currentUser?.permissions.includes('system:user:list')"
            link
            type="primary"
            native-type="button"
            @click="navigate('/system/user')"
          >
            查看全部
          </ElButton>
        </template>
        <LumaSchemaTable :columns="userColumns" :rows="recentUsers" row-key="id" :show-column-settings="false" />
      </LumaPage>

      <LumaPage title="快捷入口" description="根据当前账号权限展示常用管理动作。">
        <div v-if="quickActions.length" class="luma-admin-workspace__actions">
          <ElButton
            v-for="action in quickActions"
            :key="action.path"
            native-type="button"
            @click="navigate(action.path)"
          >
            {{ action.label }}
          </ElButton>
        </div>
        <p v-else class="luma-admin-workspace__empty">
          当前账号暂无系统管理入口。
        </p>
      </LumaPage>
    </section>
  </main>
</template>

<style scoped lang="scss">
.luma-admin-workspace {
  display: grid;
  gap: var(--luma-page-gutter);
}

.luma-admin-workspace__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.luma-admin-workspace__metric {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--luma-radius-large);
  background: var(--el-fill-color-blank);
}

.luma-admin-workspace__metric span,
.luma-admin-workspace__metric small,
.luma-admin-workspace__empty {
  color: var(--el-text-color-secondary);
}

.luma-admin-workspace__metric strong {
  color: var(--el-text-color-primary);
  font-size: calc(var(--luma-font-size-base, 14px) + 14px);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.luma-admin-workspace__columns {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: var(--luma-page-gutter);
  min-width: 0;
}

.luma-admin-workspace__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.luma-admin-workspace__actions :deep(.el-button) {
  min-height: 44px;
  margin: 0;
}

@media (max-width: 1024px) {
  .luma-admin-workspace__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .luma-admin-workspace__columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .luma-admin-workspace__metrics,
  .luma-admin-workspace__actions {
    grid-template-columns: minmax(0, 1fr);
  }

  .luma-admin-workspace__metric {
    padding: 16px;
  }
}
</style>
