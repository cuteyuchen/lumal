<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@luma/core/components'
import type { AdminSystemConfig } from '../../services/preferences'
import { LumaPage, LumaSchemaForm } from '@luma/core/components'
import { ElAlert, ElButton, ElMessage } from 'element-plus'
import { onMounted, shallowRef } from 'vue'
import { openAdminSettings } from '../../services/settings'
import {
  fetchAdminSystemConfig,
  restoreAdminSystemConfig,
  saveAdminSystemConfig,
} from '../../services/system-config'

const formModel = shallowRef<SchemaFormModel>({})
const loading = shallowRef(false)
const saving = shallowRef(false)
const operationError = shallowRef('')

const formSchemas: SchemaFormItem[] = [
  { component: 'input', field: 'appName', label: '应用名称', required: true, span: 12 },
  {
    component: 'input',
    componentProps: { type: 'color' },
    field: 'colorPrimary',
    label: '主题色',
    required: true,
    span: 12,
  },
  {
    component: 'select',
    field: 'layout',
    label: '导航布局',
    options: [
      { label: '侧边导航', value: 'sidebar-nav' },
      { label: '顶部导航', value: 'top-nav' },
      { label: '混合导航', value: 'mixed-nav' },
    ],
    required: true,
    span: 12,
  },
  { component: 'switch', field: 'tabbarEnable', label: '启用标签页', span: 12 },
  { component: 'switch', field: 'transitionEnable', label: '启用页面动画', span: 12 },
]

function applyConfig(config: AdminSystemConfig): void {
  formModel.value = { ...config }
}

async function loadConfig(): Promise<void> {
  loading.value = true
  operationError.value = ''

  try {
    applyConfig(await fetchAdminSystemConfig())
  }
  catch (error) {
    operationError.value = error instanceof Error ? error.message : '系统配置加载失败'
  }
  finally {
    loading.value = false
  }
}

function toSystemConfig(model: SchemaFormModel): AdminSystemConfig {
  return {
    appName: String(model.appName ?? ''),
    colorPrimary: String(model.colorPrimary ?? ''),
    layout: model.layout as AdminSystemConfig['layout'],
    tabbarEnable: model.tabbarEnable === true,
    transitionEnable: model.transitionEnable === true,
  }
}

async function saveConfig(model: SchemaFormModel): Promise<void> {
  saving.value = true
  operationError.value = ''

  try {
    applyConfig(await saveAdminSystemConfig(toSystemConfig(model)))
    ElMessage.success('系统配置已保存')
  }
  catch (error) {
    operationError.value = error instanceof Error ? error.message : '系统配置保存失败，已恢复保存前配置'
  }
  finally {
    saving.value = false
  }
}

async function resetConfig(): Promise<void> {
  saving.value = true
  operationError.value = ''

  try {
    applyConfig(await restoreAdminSystemConfig())
    ElMessage.success('系统配置已恢复默认')
  }
  catch (error) {
    operationError.value = error instanceof Error ? error.message : '系统配置恢复失败'
  }
  finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadConfig()
})
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage
      title="系统配置"
      description="应用级配置与全局设置抽屉共享同一偏好状态；加载或保存失败后可直接重试。"
      :loading="loading"
    >
      <template #actions>
        <ElButton native-type="button" data-action="reset-system-config" :loading="saving" @click="resetConfig">
          恢复默认
        </ElButton>
        <ElButton type="primary" native-type="button" data-action="open-global-settings" @click="openAdminSettings">
          打开全局设置
        </ElButton>
      </template>

      <ElAlert
        v-if="operationError"
        class="luma-admin-page__operation-error"
        :title="operationError"
        type="error"
        show-icon
        :closable="false"
      >
        <template #default>
          <ElButton native-type="button" data-action="retry-system-config" @click="loadConfig">
            重新加载
          </ElButton>
        </template>
      </ElAlert>

      <LumaSchemaForm
        v-model="formModel"
        mode="edit"
        :schemas="formSchemas"
        :submit-loading="saving"
        show-actions
        submit-text="保存配置"
        @submit="saveConfig"
      />
    </LumaPage>
  </main>
</template>
