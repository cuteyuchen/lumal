<script setup lang="ts">
import type { SchemaFormMode, SchemaFormModel } from '@luma/core/components'
import { LumaInfoTable, LumaPage, LumaSchemaForm } from '@luma/core/components'
import { LumaIcon, LumaIconPickerDialog } from '@luma/icons-vue'
import { computed, shallowRef } from 'vue'
import { exampleFormSchemas } from './example-data'

/***********************表单状态*********************/
const formMode = shallowRef<SchemaFormMode>('edit')
const iconPickerVisible = shallowRef(false)
const formLoading = shallowRef(false)
const formModel = shallowRef<SchemaFormModel>({
  activeDate: '2026-07-10',
  availableRange: ['2026-07-10', '2026-07-31'],
  enabled: true,
  id: '1001',
  icon: 'luma:settings',
  name: 'Luma Admin',
  parentId: 'examples',
  priority: 'high',
  remark: 'Schema Form 使用 dictionary 字段生成下拉选项，也支持常见后台控件。',
  score: 85,
  status: 'enabled',
  tags: ['form', 'access'],
})
const selectedIcon = computed({
  get: () => String(formModel.value.icon ?? ''),
  set: (icon: string) => {
    formModel.value = {
      ...formModel.value,
      icon,
    }
  },
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
      <div class="luma-admin-example__toolbar luma-schema-form-demo__toolbar">
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
        <button class="luma-admin-example__button" type="button" @click="formLoading = !formLoading">
          切换 Loading
        </button>
      </div>

      <div class="luma-admin-example__two-columns luma-schema-form-demo">
        <LumaSchemaForm
          v-model="formModel"
          :columns="2"
          label-width="92px"
          :mode="formMode"
          :loading="formLoading"
          :schemas="exampleFormSchemas"
          show-actions
          show-reset
          submit-text="提交"
          @submit="handleSubmit"
        >
          <template #field-icon="{ value }">
            <div v-if="formMode === 'view'" class="luma-schema-form-demo__icon-value">
              <LumaIcon v-if="value" :name="String(value)" />
              <span>{{ value || '-' }}</span>
            </div>
            <button
              v-else
              class="luma-schema-form-demo__icon-trigger"
              type="button"
              aria-label="选择菜单图标"
              @click="iconPickerVisible = true"
            >
              <LumaIcon v-if="value" :name="String(value)" />
              <span>{{ value || '选择图标' }}</span>
            </button>
          </template>
        </LumaSchemaForm>

        <div class="luma-admin-example__side-panel">
          <LumaInfoTable :items="formMetaItems" label-width="72px" />
          <LumaInfoTable :items="modelItems" label-width="92px" empty-text="-" />
        </div>
      </div>
      <LumaIconPickerDialog v-model="selectedIcon" v-model:visible="iconPickerVisible" title="选择菜单图标" />
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.luma-schema-form-demo {
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.7fr);
  align-items: start;
}

.luma-schema-form-demo__toolbar {
  margin-bottom: 20px;
}

.luma-schema-form-demo__icon-trigger,
.luma-schema-form-demo__icon-value {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.luma-schema-form-demo__icon-trigger {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: border-color var(--luma-motion-fast, 160ms), box-shadow var(--luma-motion-fast, 160ms);
}

.luma-schema-form-demo__icon-trigger:hover {
  border-color: var(--el-border-color-hover);
}

.luma-schema-form-demo__icon-trigger:focus-visible {
  border-color: var(--el-color-primary);
  outline: 2px solid color-mix(in srgb, var(--el-color-primary) 24%, transparent);
  outline-offset: 1px;
}

.luma-schema-form-demo__icon-trigger :deep(.luma-icon),
.luma-schema-form-demo__icon-value :deep(.luma-icon) {
  width: 18px;
  height: 18px;
  flex: none;
}

.luma-schema-form-demo__icon-trigger span,
.luma-schema-form-demo__icon-value span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .luma-schema-form-demo {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .luma-schema-form-demo__icon-trigger {
    transition: none;
  }
}
</style>
