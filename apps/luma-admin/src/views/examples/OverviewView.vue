<script setup lang="ts">
import { LumaPage } from '@luma/core/components'
import { ElButton, ElInput, ElTag } from 'element-plus'
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

interface Capability { description: string, entry: string, group: string, route: string, status: 'stable' | 'enhancing', title: string }
const router = useRouter()
const keyword = shallowRef('')
const activeGroup = shallowRef('全部')
const capabilities: Capability[] = [
  { title: '页面布局', description: '查询、工具栏、内容与分页的标准编排。', entry: '@luma/core/components', group: '基础', route: '/examples/page-layout', status: 'stable' },
  { title: '主题设置', description: '主题、布局与页面动画的实时偏好预览。', entry: '@luma/core/theme', group: '基础', route: '/examples/theme-settings', status: 'enhancing' },
  { title: 'Schema Form', description: '字典、校验、模式和常用后台控件。', entry: '@luma/core/components', group: '数据录入', route: '/examples/schema-form', status: 'stable' },
  { title: 'Schema Table', description: '选择、列设置、分页和字典回显。', entry: '@luma/core/components', group: '数据展示', route: '/examples/schema-table', status: 'stable' },
  { title: 'CRUD Table', description: '查询、新增、编辑、删除和异常反馈闭环。', entry: '@luma/core/components', group: '数据展示', route: '/examples/crud-table', status: 'stable' },
  { title: '图表面板', description: '加载、异常、空数据、视图切换和导出。', entry: '@luma/charts', group: '可视化', route: '/examples/chart-panel', status: 'enhancing' },
  { title: '核心服务', description: '请求、会话刷新、字典与错误分类。', entry: '@luma/core/request', group: '服务', route: '/examples/services', status: 'stable' },
  { title: 'Composables', description: '分页与选择状态的可交互实验区。', entry: '@luma/core/composables', group: '开发工具', route: '/examples/composables', status: 'stable' },
  { title: 'Utils', description: '使用真实输入验证公开工具函数。', entry: '@luma/core/utils', group: '开发工具', route: '/examples/utils', status: 'stable' },
]
const groups = ['全部', ...new Set(capabilities.map(item => item.group))]
const visibleCapabilities = computed(() => capabilities.filter((item) => {
  const matchesGroup = activeGroup.value === '全部' || item.group === activeGroup.value
  const query = keyword.value.trim().toLowerCase()
  return matchesGroup && (!query || `${item.title}${item.description}${item.entry}`.toLowerCase().includes(query))
}))
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="功能示例" description="从完整场景进入 Luma 的公开能力；每个示例都包含操作、状态与反馈。">
      <div class="overview-controls">
        <ElInput v-model="keyword" clearable placeholder="搜索能力或公开入口" class="overview-search" />
        <div class="overview-groups" aria-label="能力分类">
          <ElButton v-for="group in groups" :key="group" :type="activeGroup === group ? 'primary' : 'default'" @click="activeGroup = group">
            {{ group }}
          </ElButton>
        </div>
      </div>
      <div v-if="visibleCapabilities.length" class="overview-grid">
        <article v-for="item in visibleCapabilities" :key="item.route" class="overview-card" tabindex="0" @keyup.enter="router.push(item.route)">
          <div class="overview-card__head">
            <span>{{ item.group }}</span><ElTag :type="item.status === 'stable' ? 'success' : 'warning'">
              {{ item.status === 'stable' ? '稳定' : '持续增强' }}
            </ElTag>
          </div>
          <h3>{{ item.title }}</h3><p>{{ item.description }}</p><code>{{ item.entry }}</code>
          <ElButton link type="primary" @click="router.push(item.route)">
            打开完整示例 →
          </ElButton>
        </article>
      </div>
      <div v-else class="overview-empty">
        没有匹配的能力，请调整关键词或分类。
      </div>
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.overview-controls,.overview-groups,.overview-card__head{display:flex;gap:12px;align-items:center}.overview-controls{justify-content:space-between;flex-wrap:wrap;margin-bottom:20px}.overview-search{max-width:320px}.overview-groups{flex-wrap:wrap}.overview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.overview-card{display:flex;min-height:210px;flex-direction:column;padding:20px;border:1px solid var(--el-border-color-light);border-radius:12px;background:var(--el-bg-color);transition:transform .2s,border-color .2s,box-shadow .2s}.overview-card:hover,.overview-card:focus-visible{border-color:var(--el-color-primary);box-shadow:var(--el-box-shadow-light);transform:translateY(-2px);outline:none}.overview-card__head{justify-content:space-between;color:var(--el-text-color-secondary);font-size:13px}.overview-card h3{margin:18px 0 8px}.overview-card p{min-height:44px;margin:0 0 16px;color:var(--el-text-color-regular);line-height:1.6}.overview-card code{margin-bottom:14px;color:var(--el-color-primary);font-size:12px}.overview-card .el-button{align-self:flex-start;margin-top:auto}.overview-empty{padding:56px;text-align:center;color:var(--el-text-color-secondary);border:1px dashed var(--el-border-color)}
</style>
