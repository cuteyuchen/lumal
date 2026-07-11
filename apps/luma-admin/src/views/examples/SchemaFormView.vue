<script setup lang="ts">
import type { SchemaFormMode, SchemaFormModel } from '@luma/core/components'
import { LumaInfoTable, LumaPage, LumaSchemaForm } from '@luma/core/components'
import { computed, shallowRef } from 'vue'
import { exampleFormSchemas } from './example-data'

/***********************表单状态*********************/
const formMode = shallowRef<SchemaFormMode>('edit')
const formModel = shallowRef<SchemaFormModel>({
  activeDate: '2026-07-10',
  availableRange: ['2026-07-10', '2026-07-31'],
  enabled: true,
  id: '1001',
  name: 'Luma Admin',
  parentId: 'examples',
  priority: 'high',
  remark: 'Schema Form 使用 dictionary 字段生成下拉选项，也支持常见后台控件。',
  score: 85,
  status: 'enabled',
  tags: ['form', 'access'],
})

const modelItems = computed(() => Object.entries(formModel.value).map(([label, value]) => ({
  label,
  value: Array.isArray(value) ? value.join(', ') : String(value ?? ''),
})))

const formMetaItems = computed(() => [
  { label: '模式', value: formMode.value },
  { label: '布局列数', value: '2' },
  { label: '字段状态', value: formMode.value === 'view' ? '只读' : '可编辑' },
  { label: '字典字段', value: 'dictionary' },
])

/***********************事件处理*********************/
function handleSubmit(model: SchemaFormModel): void {
  formModel.value = { ...model }
}

function setMode(mode: SchemaFormMode): void {
  formMode.value = mode
}

function patchScore(): void {
  formModel.value = {
    ...formModel.value,
    score: 95,
  }
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Schema Form" description="验证模型回写、字典下拉、栅格布局、字段状态和常见后台控件。">
      <div class="luma-admin-example__toolbar">
        <button
          class="luma-admin-example__button"
          :class="{ 'luma-admin-example__button--primary': formMode === 'create' }"
          type="button"
          @click="setMode('create')"
        >
          新增
        </button>
        <button
          class="luma-admin-example__button"
          :class="{ 'luma-admin-example__button--primary': formMode === 'edit' }"
          type="button"
          @click="setMode('edit')"
        >
          编辑
        </button>
        <button
          class="luma-admin-example__button"
          :class="{ 'luma-admin-example__button--primary': formMode === 'view' }"
          type="button"
          @click="setMode('view')"
        >
          查看
        </button>
        <button class="luma-admin-example__button" type="button" @click="patchScore">
          设置评分
        </button>
      </div>

      <div class="luma-admin-example__two-columns luma-schema-form-demo">
        <LumaSchemaForm
          v-model="formModel"
          :columns="2"
          label-width="92px"
          :mode="formMode"
          :schemas="exampleFormSchemas"
          show-actions
          submit-text="提交"
          @submit="handleSubmit"
        />

        <div class="luma-admin-example__side-panel">
          <LumaInfoTable :items="formMetaItems" label-width="72px" />
          <LumaInfoTable :items="modelItems" label-width="92px" empty-text="-" />
        </div>
      </div>
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.luma-schema-form-demo {
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.7fr);
  align-items: start;
}

@media (max-width: 1100px) {
  .luma-schema-form-demo {
    grid-template-columns: 1fr;
  }
}
</style>
