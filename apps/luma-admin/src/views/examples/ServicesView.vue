<script setup lang="ts">
import type { DictionaryResponse } from '@luma/core/dictionary'
import { createTokenStorage } from '@luma/core/auth'
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import { getDictionaryValueLabel, useDictionaryMap } from '@luma/core/dictionary'
import { RequestError } from '@luma/core/request'
import { ElButton, ElInput, ElOption, ElSelect, ElTag } from 'element-plus'
import { computed, shallowRef } from 'vue'
import {
  createAdminPageTransport,
  createAdminResponseTransport,
  parseAdminPageResponse,
} from '../../api/adapters'
import { permissionStore } from '../../services/permission'
import { createAdminRequestClient } from '../../services/request'
import { adminSession } from '../../services/session'
import { mockDictionaryFetcher } from './dictionary'

interface ServiceResult {
  name: string
  page: unknown
  status: string
}

/***********************请求状态*********************/
const loading = shallowRef(false)
const result = shallowRef<ServiceResult>()
const dictionaryResult = shallowRef<DictionaryResponse>()
const message = shallowRef('等待请求')
const requestCount = shallowRef(0)
const tokenRotated = shallowRef(false)
const errorKind = shallowRef('-')
const forceError = shallowRef(false)
const permissionCode = shallowRef('system:user:list')
const roleCode = shallowRef('admin')
const dictionaryValue = shallowRef('enabled')
const demoTokenStorage = createTokenStorage(localStorage, 'luma-example:token')
const demoToken = shallowRef(demoTokenStorage.getToken())
const tokenInput = shallowRef('demo-token-2026')
const { dictionaryMap } = useDictionaryMap(() => ['status', 'priority'])

const resultItems = computed(() => {
  const page = result.value
    ? parseAdminPageResponse(result.value.page, item => ({
        enabled: (item as { enabled: string }).enabled === '1',
        id: Number((item as { id: string }).id),
      }))
    : undefined

  return [
    { label: '请求状态', value: message.value },
    { label: '请求次数', value: requestCount.value },
    { label: 'Token 刷新', value: tokenRotated.value ? '已单飞刷新并重放' : '未触发' },
    { label: '错误类型', value: errorKind.value },
    { label: '名称', value: result.value?.name },
    { label: '结果', value: result.value?.status },
    { label: '分页适配', value: page ? `items: ${page.items.length}, total: ${page.total}` : undefined },
    { label: '字典响应', value: dictionaryResult.value ? `items: ${dictionaryResult.value.items.length}` : undefined },
  ]
})

/***********************Mock 请求*********************/
function createJsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  })
}

function createLifecycleFetcher(expiredToken: string): typeof fetch {
  return async (_input, init) => {
    requestCount.value += 1
    const authorization = new Headers(init?.headers).get('Authorization')

    if (forceError.value) {
      return new Response(JSON.stringify({ message: '模拟网络服务异常' }), { status: 503, headers: { 'content-type': 'application/json' } })
    }
    if (authorization === `Bearer ${expiredToken}`) {
      return createJsonResponse(createAdminResponseTransport(null, {
        code: 'AUTH_EXPIRED',
        message: '访问凭据已过期',
      }))
    }

    return createJsonResponse(createAdminResponseTransport({
      name: 'Luma Request',
      page: createAdminPageTransport([{ enabled: '1', id: '1' }], '1'),
      status: 'ok',
    }))
  }
}

/***********************事件处理*********************/
async function handleLoad(): Promise<void> {
  loading.value = true
  message.value = '请求中'
  requestCount.value = 0
  tokenRotated.value = false
  errorKind.value = '-'
  const tokenBefore = adminSession.getToken()
  const client = createAdminRequestClient(createLifecycleFetcher(tokenBefore))

  try {
    result.value = await client.get<ServiceResult>('/mock/profile', {
      query: { source: 'luma-admin' },
    })
    dictionaryResult.value = await mockDictionaryFetcher('status') as DictionaryResponse
    tokenRotated.value = adminSession.getToken() !== tokenBefore
    message.value = '请求成功'
  }
  catch (error) {
    errorKind.value = error instanceof RequestError ? error.kind : 'unknown'
    message.value = error instanceof Error ? error.message : '请求失败'
  }
  finally {
    loading.value = false
  }
}

function setDemoToken(): void {
  demoTokenStorage.setToken(tokenInput.value)
  demoToken.value = demoTokenStorage.getToken()
}

function clearDemoToken(): void {
  demoTokenStorage.clearToken()
  demoToken.value = ''
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage
      title="Services / Request"
      description="验证异常响应字段适配、业务会话码、Token 单飞刷新、一次重放与统一错误分类。"
      :loading="loading"
    >
      <div class="service-actions">
        <ElButton type="primary" :loading="loading" @click="handleLoad">
          发送成功请求
        </ElButton><ElButton type="danger" :loading="loading" @click="forceError = true; handleLoad().finally(() => forceError = false)">
          模拟服务异常
        </ElButton>
      </div>

      <LumaInfoTable :items="resultItems" :columns="4" label-width="86px" empty-text="-" />
    </LumaPage>
    <div class="service-grid">
      <LumaPage title="Permission" description="使用当前登录账号的标准 permissions / roles 做实时判断。">
        <div class="service-field">
          <ElSelect v-model="permissionCode">
            <ElOption label="查看用户" value="system:user:list" /><ElOption label="新增用户" value="system:user:create" /><ElOption label="未授权能力" value="unknown:permission" />
          </ElSelect><strong>{{ permissionStore.hasPermission(permissionCode) ? '有权限' : '无权限' }}</strong>
        </div><div class="service-field">
          <ElSelect v-model="roleCode">
            <ElOption label="管理员" value="admin" /><ElOption label="操作员" value="operator" /><ElOption label="访客" value="guest" />
          </ElSelect><strong>{{ permissionStore.hasRole(roleCode) ? '有角色' : '无角色' }}</strong>
        </div><div class="tag-list">
          <ElTag v-for="code in permissionStore.permissions" :key="code" size="small">
            {{ code }}
          </ElTag><span v-if="!permissionStore.permissions.length">当前账号没有权限码</span>
        </div>
      </LumaPage>
      <LumaPage title="Dictionary" description="批量字典加载、选项展示与值翻译。">
        <div class="tag-list">
          <template v-for="(options, name) in dictionaryMap" :key="name">
            <ElTag v-for="option in options" :key="`${name}-${option.value}`" :type="name === 'priority' ? 'warning' : 'success'">
              {{ name }} · {{ option.label }} ({{ option.value }})
            </ElTag>
          </template>
        </div><div class="service-field">
          <ElSelect v-model="dictionaryValue">
            <ElOption label="enabled" value="enabled" /><ElOption label="disabled" value="disabled" /><ElOption label="unknown" value="unknown" />
          </ElSelect><strong>翻译：{{ getDictionaryValueLabel('status', dictionaryValue) || '未匹配' }}</strong>
        </div>
      </LumaPage>
      <LumaPage title="Auth" description="使用独立演示 key 验证 Token 存储，不影响当前登录会话。">
        <code class="token-box">{{ demoToken || '(空)' }}</code><div class="service-field">
          <ElInput v-model="tokenInput" placeholder="输入演示 Token" /><ElButton type="primary" @click="setDemoToken">
            设置
          </ElButton><ElButton @click="clearDemoToken">
            清除
          </ElButton>
        </div><LumaInfoTable :items="[{ label: '当前应用会话', value: adminSession.isAuthenticated() ? '已认证' : '未认证' }, { label: '隔离策略', value: 'luma-example:token' }]" label-width="100px" />
      </LumaPage>
      <LumaPage title="Request 能力矩阵" description="请求客户端保持 Fetch 语义，覆盖缓存、重复提交、刷新重放与错误分类。">
        <LumaInfoTable :items="[{ label: '响应适配', value: '标准数据 / 分页 adapter' }, { label: '凭据注入', value: 'Authorization Bearer' }, { label: '会话刷新', value: '单飞刷新 + 一次安全重放' }, { label: '异常分类', value: 'HTTP / network / timeout / business' }, { label: '演示请求数', value: requestCount }, { label: '最近错误', value: errorKind }]" :columns="2" label-width="100px" />
      </LumaPage>
    </div>
  </main>
</template>

<style scoped lang="scss">
.service-actions,.service-field,.tag-list{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.service-actions{margin-bottom:16px}.service-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.service-field{margin:14px 0}.service-field .el-select,.service-field .el-input{width:210px}.tag-list{max-height:150px;overflow:auto}.token-box{display:block;padding:12px;border-radius:6px;background:var(--el-fill-color-light);word-break:break-all}@media(max-width:900px){.service-grid{grid-template-columns:1fr}}
</style>
