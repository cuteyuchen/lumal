<script setup lang="ts">
import type { SchemaFormMode, SchemaFormModel } from '@lumal/core/components'
import { LumalInfoTable, LumalPage, LumalSchemaForm } from '@lumal/core/components'
import { LumalIcon, LumalIconPickerDialog } from '@lumal/icons-vue'
import { computed, shallowRef } from 'vue'
import AppIconGroupSelect from '../../components/app/AppIconGroupSelect.vue'
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
  icon: 'lumal:settings',
  name: 'Lumal Admin',
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
  <main class="lumal-admin-example">
    <LumalPage title="Schema Form" description="验证模型回写、字典下拉、栅格布局、字段状态和常见后台控件。">
      <div class="lumal-admin-example__toolbar lumal-schema-form-demo__toolbar">
        <button
          class="lumal-admin-example__button"
          :class="{ 'lumal-admin-example__button--primary': formMode === 'create' }"
          type="button"
          @click="setMode('create')"
        >
          新增
        </button>
        <button
          class="lumal-admin-example__button"
          :class="{ 'lumal-admin-example__button--primary': formMode === 'edit' }"
          type="button"
          @click="setMode('edit')"
        >
          编辑
        </button>
        <button
          class="lumal-admin-example__button"
          :class="{ 'lumal-admin-example__button--primary': formMode === 'view' }"
          type="button"
          @click="setMode('view')"
        >
          查看
        </button>
        <button class="lumal-admin-example__button" type="button" @click="patchScore">
          设置评分
        </button>
        <button class="lumal-admin-example__button" type="button" @click="formLoading = !formLoading">
          切换 Loading
        </button>
      </div>

      <div class="lumal-admin-example__two-columns lumal-schema-form-demo">
        <LumalSchemaForm
          v-model="formModel"
          :columns="2"
          :label-width="92"
          :mode="formMode"
          :loading="formLoading"
          :schemas="exampleFormSchemas"
          show-actions
          show-reset
          submit-text="提交"
          @submit="handleSubmit"
        >
          <template #field-icon="{ value }">
            <div v-if="formMode === 'view'" class="lumal-schema-form-demo__icon-value">
              <LumalIcon v-if="value" :name="String(value)" />
              <span>{{ value || '-' }}</span>
            </div>
            <button
              v-else
              class="lumal-schema-form-demo__icon-trigger"
              type="button"
              aria-label="选择菜单图标"
              @click="iconPickerVisible = true"
            >
              <LumalIcon v-if="value" :name="String(value)" />
              <span>{{ value || '选择图标' }}</span>
            </button>
          </template>
        </LumalSchemaForm>

        <div class="lumal-admin-example__side-panel">
          <LumalInfoTable :items="formMetaItems" :label-width="72" />
          <LumalInfoTable :items="modelItems" :label-width="92" empty-text="-" />
        </div>
      </div>
      <LumalIconPickerDialog v-model="selectedIcon" v-model:visible="iconPickerVisible" title="选择菜单图标">
        <template #group-select="slotProps">
          <AppIconGroupSelect v-bind="slotProps" />
        </template>
      </LumalIconPickerDialog>
    </LumalPage>
  </main>
</template>

<style scoped lang="scss">
.lumal-schema-form-demo {
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.7fr);
  align-items: start;
}

.lumal-schema-form-demo__toolbar {
  margin-bottom: 20px;
}

.lumal-schema-form-demo__icon-trigger,
.lumal-schema-form-demo__icon-value {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.lumal-schema-form-demo__icon-trigger {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: border-color var(--lumal-motion-fast, 160ms), box-shadow var(--lumal-motion-fast, 160ms);
}

.lumal-schema-form-demo__icon-trigger:hover {
  border-color: var(--el-border-color-hover);
}

.lumal-schema-form-demo__icon-trigger:focus-visible {
  border-color: var(--el-color-primary);
  outline: 2px solid color-mix(in srgb, var(--el-color-primary) 24%, transparent);
  outline-offset: 1px;
}

.lumal-schema-form-demo__icon-trigger :deep(.lumal-icon),
.lumal-schema-form-demo__icon-value :deep(.lumal-icon) {
  width: 18px;
  height: 18px;
  flex: none;
}

.lumal-schema-form-demo__icon-trigger span,
.lumal-schema-form-demo__icon-value span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .lumal-schema-form-demo {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lumal-schema-form-demo__icon-trigger {
    transition: none;
  }
}
</style>
