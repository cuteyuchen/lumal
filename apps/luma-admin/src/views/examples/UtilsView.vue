<script setup lang="ts">
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import { cloneDeep, joinPath, omitUndefined, serializeQuery } from '@luma/core/utils'
import { ElButton, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus'
import { computed, shallowRef } from 'vue'

const tool = shallowRef<'query' | 'path' | 'clone'>('query')
const keyword = shallowRef('Luma Admin')
const pathParts = shallowRef('/system/, /user/, list')
const cloneSource = shallowRef('{"filters":{"status":1},"tags":["admin","mini"]}')
const result = shallowRef('等待运行')
const error = shallowRef('')
function run(): void {
  error.value = ''
  try {
    if (tool.value === 'query') {
      result.value = serializeQuery(omitUndefined({ keyword: keyword.value || undefined, ids: [1, 2] }))
    }
    else if (tool.value === 'path') {
      result.value = joinPath(...pathParts.value.split(',').map(item => item.trim()))
    }
    else {
      const source = JSON.parse(cloneSource.value) as object
      const cloned = cloneDeep(source)
      result.value = `${JSON.stringify(cloned)}；独立引用：${cloned !== source}`
    }
    ElMessage.success('工具函数执行成功')
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : '输入无法处理'
    result.value = '执行失败'
  }
}
const items = computed(() => [{ label: '当前工具', value: tool.value }, { label: '执行结果', value: result.value }, { label: '错误', value: error.value || '-' }])
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Utils 实验区" description="修改真实输入并执行公开工具函数，错误输入会得到明确反馈。">
      <div class="utils-lab">
        <div class="utils-inputs">
          <ElSelect v-model="tool" aria-label="工具函数">
            <ElOption label="serializeQuery + omitUndefined" value="query" /><ElOption label="joinPath" value="path" /><ElOption label="cloneDeep" value="clone" />
          </ElSelect>
          <ElInput v-if="tool === 'query'" v-model="keyword" clearable placeholder="查询关键词（留空将被移除）" />
          <ElInput v-else-if="tool === 'path'" v-model="pathParts" placeholder="用逗号分隔路径片段" />
          <ElInput v-else v-model="cloneSource" type="textarea" :rows="4" placeholder="输入 JSON" />
          <ElButton type="primary" @click="run">
            运行
          </ElButton>
        </div>
        <LumaInfoTable :items="items" label-width="88px" /><p v-if="error" class="utils-error" role="alert">
          {{ error }}
        </p>
      </div>
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.utils-lab{display:grid;grid-template-columns:minmax(280px,1fr) minmax(280px,1fr);gap:24px}.utils-inputs{display:flex;flex-direction:column;gap:14px}.utils-error{grid-column:1/-1;margin:0;color:var(--el-color-danger)}@media(max-width:760px){.utils-lab{grid-template-columns:1fr}}
</style>
