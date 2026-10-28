<script setup lang="ts">
import type { SchemaTableColumn, SchemaTableRow } from '@lumal/core/components'
import type { DictionaryOption } from '@lumal/core/dictionary'
import type { SystemMenuRecord } from '../../api/system'
import { LumalPage, LumalSchemaTable } from '@lumal/core/components'
import { useViewportScale } from '@lumal/viewport'
import { ElAlert, ElButton } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { viewportDesign } from '../../../viewport.config'
import {
  fetchDictionaryTypes,
  fetchSystemMenus,
  fetchSystemRoleOptions,
  fetchSystemRoles,
  fetchSystemUsers,
} from '../../api/system'
import { currentUser } from '../../services/session'
import { adminViewportMode } from '../../services/workspace-viewport'

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

/***********************表格数值尺寸*********************/
// Element Plus 列宽是数值协议，显式使用窗口比例，不让构建插件扫描或改写脚本。
const { scale } = useViewportScale({ ...viewportDesign, mode: 'width', enabled: () => adminViewportMode.value === 'vw' })
const tablePixels = (pixels: number) => adminViewportMode.value === 'vw' ? pixels * scale.value : pixels
const userColumns = computed<SchemaTableColumn[]>(() => [
  { field: 'username', label: '用户名', minWidth: tablePixels(140) },
  { field: 'nickname', label: '昵称', minWidth: tablePixels(140) },
  { field: 'role', label: '角色', minWidth: tablePixels(120), options: roleOptions.value },
  { dictionary: 'status', field: 'status', label: '状态', width: tablePixels(100) },
  { field: 'createdAt', label: '创建时间', width: tablePixels(130) },
])

/***********************数据加载与导航*********************/
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
  <main class="lumal-admin-workspace">
    <LumalPage :title="title" :description="`${todayText} · 这里汇总当前后台运行与管理状态。`" :loading="loading">
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

      <section class="lumal-admin-workspace__metrics" aria-label="后台指标">
        <article v-for="metric in metrics" :key="metric.label" class="lumal-admin-workspace__metric">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.description }}</small>
        </article>
      </section>
    </LumalPage>

    <section class="lumal-admin-workspace__columns">
      <LumalPage title="最近用户" description="最近创建的后台账号，完整操作请进入用户管理。">
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
        <LumalSchemaTable :columns="userColumns" :rows="recentUsers" row-key="id" :show-column-settings="false" />
      </LumalPage>

      <LumalPage title="快捷入口" description="根据当前账号权限展示常用管理动作。">
        <div v-if="quickActions.length" class="lumal-admin-workspace__actions">
          <ElButton
            v-for="action in quickActions"
            :key="action.path"
            native-type="button"
            @click="navigate(action.path)"
          >
            {{ action.label }}
          </ElButton>
        </div>
        <p v-else class="lumal-admin-workspace__empty">
          当前账号暂无系统管理入口。
        </p>
      </LumalPage>
    </section>
  </main>
</template>

<style scoped lang="scss">
.lumal-admin-workspace {
  display: grid;
  gap: var(--lumal-page-gutter);
}

.lumal-admin-workspace__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.lumal-admin-workspace__metric {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--lumal-radius-large);
  background: var(--el-fill-color-blank);
}

.lumal-admin-workspace__metric span,
.lumal-admin-workspace__metric small,
.lumal-admin-workspace__empty {
  color: var(--el-text-color-secondary);
}

.lumal-admin-workspace__metric strong {
  color: var(--el-text-color-primary);
  font-size: calc(var(--lumal-font-size-base, 14px) + 14px);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.lumal-admin-workspace__columns {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: var(--lumal-page-gutter);
  min-width: 0;
}

.lumal-admin-workspace__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.lumal-admin-workspace__actions :deep(.el-button) {
  min-height: 44px;
  margin: 0;
}

@media (max-width: 1024px) {
  .lumal-admin-workspace__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lumal-admin-workspace__columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .lumal-admin-workspace__metrics,
  .lumal-admin-workspace__actions {
    grid-template-columns: minmax(0, 1fr);
  }

  .lumal-admin-workspace__metric {
    padding: 16px;
  }
}
</style>
