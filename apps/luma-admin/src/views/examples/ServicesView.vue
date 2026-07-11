<script setup lang="ts">
import type { DictionaryResponse } from '@luma/core/dictionary'
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import { RequestError } from '@luma/core/request'
import { ElButton } from 'element-plus'
import { computed, shallowRef } from 'vue'
import { parseAdminPageResponse } from '../../api/adapters'
import { createAdminRequestClient } from '../../services/request'
import { adminSession } from '../../services/session'
import { mockDictionaryFetcher } from './dictionary'

interface ServiceResult {
  name: string
  page: {
    records: Array<{ enabled: string, id: string }>
    totalNum: string
  }
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

    if (authorization === `Bearer ${expiredToken}`) {
      return createJsonResponse({
        result: null,
        resultMsg: '访问凭据已过期',
        statusCode: 'AUTH_EXPIRED',
      })
    }

    return createJsonResponse({
      result: {
        name: 'Luma Request',
        page: {
          records: [{ enabled: '1', id: '1' }],
          totalNum: '1',
        },
        status: 'ok',
      },
      resultMsg: 'ok',
      statusCode: '0000',
    })
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
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage
      title="Services / Request"
      description="验证异常响应字段适配、业务会话码、Token 单飞刷新、一次重放与统一错误分类。"
      :loading="loading"
    >
      <ElButton type="primary" :loading="loading" @click="handleLoad">
        发送请求
      </ElButton>

      <LumaInfoTable :items="resultItems" :columns="4" label-width="86px" empty-text="-" />
    </LumaPage>
  </main>
</template>
