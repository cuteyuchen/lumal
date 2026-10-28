<script setup lang="ts">
import { LumalInfoTable, LumalPage, LumalSchemaForm, LumalSchemaTable } from '@lumal/core/components'
import { getDictionaryLabel, useDictionary } from '@lumal/core/dictionary'
import { computed, shallowRef } from 'vue'
import {
  createExampleQueryModel,
  exampleQuerySchemas,
  exampleTableColumns,
  exampleTableRows,
} from './example-data'

/***********************字典状态*********************/
const queryModel = shallowRef(createExampleQueryModel())
const { status: statusOptions } = useDictionary('status')

const statusItems = computed(() => [
  { label: '标准字段', value: 'dictionary' },
  { label: '标准响应', value: '{ items: DictionaryOption[] }' },
  { label: '选项数量', value: statusOptions.value.length },
  { label: '启用回显', value: getDictionaryLabel(statusOptions.value, 'enabled') },
])
</script>

<template>
  <main class="lumal-admin-example">
    <LumalPage title="Dictionary" description="表单 options 与表格回显都通过字典上下文完成。">
      <div class="lumal-admin-example__two-columns">
        <LumalSchemaForm v-model="queryModel" :schemas="exampleQuerySchemas" />
        <LumalInfoTable :items="statusItems" :label-width="88" empty-text="-" />
      </div>
    </LumalPage>

    <LumalPage title="字典表格回显" description="状态与优先级列只配置 dictionary 名称。">
      <LumalSchemaTable :columns="exampleTableColumns" :rows="exampleTableRows" row-key="id" />
    </LumalPage>
  </main>
</template>
