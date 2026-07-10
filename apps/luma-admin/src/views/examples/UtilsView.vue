<script setup lang="ts">
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import {
  cloneDeep,
  joinPath,
  omitUndefined,
  serializeQuery,
} from '@luma/core/utils'

/***********************工具函数演示*********************/
const source = { filters: { status: 1 }, name: 'Luma', tags: ['admin', 'mini'] }
const cloned = cloneDeep(source)

const utilityItems = [
  { label: 'cloneDeep', value: `${JSON.stringify(cloned)}（独立引用：${cloned !== source}）` },
  { label: 'joinPath', value: joinPath('/system/', '/user/', 'list') },
  { label: 'omitUndefined', value: JSON.stringify(omitUndefined({ a: 1, b: undefined, c: 'x' })) },
  { label: 'serializeQuery', value: serializeQuery({ ids: [1, 2], keyword: 'Luma' }) },
]
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Utils" description="消费 @luma/core/utils 子入口，演示 cloneDeep、joinPath、omitUndefined、serializeQuery。">
      <LumaInfoTable :items="utilityItems" :columns="2" label-width="120px" />
    </LumaPage>
  </main>
</template>
