<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@luma/core/components'
import { LumaPage, LumaSchemaForm } from '@luma/core/components'
import { ElMessage } from 'element-plus'
import { shallowRef } from 'vue'
import {
  getAdminSystemConfig,
  updateAdminSystemConfig,
} from '../../services/preferences'

/***********************配置状态*********************/
const configModel = shallowRef<SchemaFormModel>({ ...getAdminSystemConfig() })

const configSchemas: SchemaFormItem[] = [
  {
    component: 'input',
    field: 'appName',
    label: '应用名称',
    required: true,
    span: 12,
  },
  {
    component: 'select',
    field: 'layout',
    label: '默认布局',
    options: [
      { label: '混合导航', value: 'mixed-nav' },
      { label: '侧边导航', value: 'sidebar-nav' },
      { label: '顶部导航', value: 'top-nav' },
    ],
    required: true,
    span: 12,
  },
  {
    component: 'input',
    field: 'colorPrimary',
    label: '默认主题色',
    placeholder: '例如 #1677ff',
    required: true,
    span: 12,
  },
  {
    component: 'switch',
    field: 'tabbarEnable',
    label: '启用标签页',
    span: 12,
  },
  {
    component: 'switch',
    field: 'transitionEnable',
    label: '启用页面动画',
    span: 12,
  },
]

function saveConfig(model: SchemaFormModel): void {
  const config = updateAdminSystemConfig({
    appName: String(model.appName ?? ''),
    colorPrimary: String(model.colorPrimary ?? ''),
    layout: model.layout === 'sidebar-nav' || model.layout === 'top-nav' ? model.layout : 'mixed-nav',
    tabbarEnable: model.tabbarEnable === true,
    transitionEnable: model.transitionEnable === true,
  })

  configModel.value = { ...config }
  ElMessage.success('系统配置已保存并在当前会话生效')
}
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage
      title="系统配置"
      description="维护后台基座的应用名称、默认布局、主题色、标签页和页面动画。"
    >
      <LumaSchemaForm
        v-model="configModel"
        :schemas="configSchemas"
        show-actions
        submit-text="保存配置"
        @submit="saveConfig"
      />
    </LumaPage>
  </main>
</template>
