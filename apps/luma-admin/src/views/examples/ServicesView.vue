<script setup lang="ts">
import type { DictionaryResponse } from '@luma/core/dictionary'
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import { createRequestClient } from '@luma/core/request'
import { computed, shallowRef } from 'vue'
import { mockDictionaryFetcher } from './dictionary'

interface MockResponse {
  code: number
  data: {
    name: string
    status: string
  }
}

/***********************请求状态*********************/
const loading = shallowRef(false)
const result = shallowRef<MockResponse['data'] | undefined>()
const dictionaryResult = shallowRef<DictionaryResponse | undefined>()
const message = shallowRef('等待请求')

function parseMockResponse<TResult>(context: { data: unknown }): TResult {
  return (context.data as MockResponse).data as TResult
}

const client = createRequestClient({
  fetch: () => Promise.resolve(new Response(JSON.stringify({
    code: 0,
    data: {
      name: 'Luma Request',
      status: 'ok',
    },
  }), {
    headers: {
      'content-type': 'application/json',
    },
    status: 200,
  })),
  getToken: () => 'luma-admin-token',
  onResponse: parseMockResponse,
})

const resultItems = computed(() => [
  { label: '请求状态', value: message.value },
  { label: '名称', value: result.value?.name },
  { label: '结果', value: result.value?.status },
  { label: '字典响应', value: dictionaryResult.value ? `items: ${dictionaryResult.value.items.length}` : undefined },
])

/***********************事件处理*********************/
function handleLoad(): void {
  loading.value = true
  message.value = '请求中'

  client.get<MockResponse['data']>('/mock/profile', {
    query: {
      source: 'luma-admin',
    },
  }).then((data) => {
    result.value = data
    return mockDictionaryFetcher('status')
  }).then((response) => {
    dictionaryResult.value = response as DictionaryResponse
    message.value = '请求成功'
  }).catch((error: unknown) => {
    message.value = error instanceof Error ? error.message : '请求失败'
  }).finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Services / Request" description="验证 createRequestClient 和标准字典响应。" :loading="loading">
      <button class="luma-admin-example__button luma-admin-example__button--primary" type="button" @click="handleLoad">
        发送请求
      </button>

      <LumaInfoTable :items="resultItems" :columns="4" label-width="76px" empty-text="-" />
    </LumaPage>
  </main>
</template>
