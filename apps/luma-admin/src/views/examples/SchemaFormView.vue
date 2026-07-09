<script setup lang="ts">
import type { SchemaFormModel } from '@luma/core/components'
import { LumaInfoTable, LumaPage, LumaSchemaForm } from '@luma/core/components'
import { computed, shallowRef } from 'vue'
import { exampleFormSchemas } from './example-data'

/***********************表单状态*********************/
const formModel = shallowRef<SchemaFormModel>({
  name: 'Luma Admin',
  remark: 'Schema Form 使用 dictionary 字段生成下拉选项',
  status: 'enabled',
})

const modelItems = computed(() => Object.entries(formModel.value).map(([label, value]) => ({
  label,
  value,
})))

/***********************事件处理*********************/
function handleSubmit(model: SchemaFormModel): void {
  formModel.value = { ...model }
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Schema Form" description="验证模型回写、字典下拉和文本域。">
      <div class="luma-admin-example__two-columns">
        <LumaSchemaForm
          v-model="formModel"
          :schemas="exampleFormSchemas"
          show-actions
          submit-text="提交"
          @submit="handleSubmit"
        />

        <LumaInfoTable :items="modelItems" label-width="72px" />
      </div>
    </LumaPage>
  </main>
</template>
