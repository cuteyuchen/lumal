<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@lumal/core/components'
import { LumalPage, LumalSchemaForm } from '@lumal/core/components'
import { ElAlert, ElButton, ElMessage, ElTabPane, ElTabs } from 'element-plus'
import { shallowRef, watch } from 'vue'
import { application, service } from '../../app/services/session'
import { useAsyncData } from '../../shared/composables/use-async-data'
import { createProfileService, profileInput } from './api'
import ProfilePasswordForm from './components/ProfilePasswordForm.vue'

/***********************个人资料读取与保存*********************/
const api = createProfileService(service)
const state = useAsyncData(api.get, null)
const model = shallowRef<SchemaFormModel>({})
const saving = shallowRef(false)
const needsSessionRefresh = shallowRef(false)
const failure = shallowRef('')
const success = shallowRef('')
watch(state.data, (value) => {
  if (value)
    model.value = { ...value }
})
const schemas: SchemaFormItem[] = [
  { field: 'username', label: '用户名', readonly: true },
  { field: 'roles', label: '角色', readonly: true, formatter: value => Array.isArray(value) ? value.join('、') : '' },
  { field: 'nickname', label: '昵称', required: true, rules: [{ max: 32, message: '昵称最多 32 个字符' }] },
  { field: 'phone', label: '手机号', rules: [{ pattern: /^1\d{10}$/, message: '手机号格式错误' }] },
]
async function save(values: SchemaFormModel): Promise<void> {
  if (saving.value || needsSessionRefresh.value)
    return
  saving.value = true
  failure.value = ''
  success.value = ''
  let persisted = false
  try {
    model.value = { ...await api.save(profileInput(values)) }
    persisted = true
    needsSessionRefresh.value = true
    await application.refreshAccess()
    needsSessionRefresh.value = false
    success.value = '个人资料已更新'
    ElMessage.success('个人资料已更新')
  }
  catch (reason) {
    failure.value = `${persisted ? '资料已保存，但会话刷新失败，请重新读取：' : ''}${reason instanceof Error ? reason.message : '保存失败'}`
  }
  finally { saving.value = false }
}

/***********************部分成功后的只读重试*********************/
async function reload(): Promise<void> {
  if (saving.value || state.loading.value)
    return
  saving.value = true
  failure.value = ''
  try {
    // 已保存的资料不重复提交；恢复会话授权后再读取服务端资料。
    if (needsSessionRefresh.value) {
      await application.refreshAccess()
      needsSessionRefresh.value = false
    }
    await state.load()
  }
  catch (reason) {
    failure.value = `${needsSessionRefresh.value ? '资料已保存，但会话刷新失败，请重试：' : ''}${reason instanceof Error ? reason.message : '读取失败'}`
  }
  finally { saving.value = false }
}
</script>

<template>
  <LumalPage class="lumal-admin-page" title="个人中心">
    <ElAlert v-if="state.error.value || failure" :title="state.error.value || failure" type="error" :closable="false">
      <ElButton link :loading="saving" @click="reload">
        {{ needsSessionRefresh ? '重试会话刷新' : '重新读取' }}
      </ElButton>
    </ElAlert>
    <ElAlert v-if="success" :title="success" type="success" :closable="false" />
    <ElTabs class="profile-tabs">
      <ElTabPane label="个人资料">
        <LumalSchemaForm v-if="state.data.value" v-model="model" :schemas="schemas" :columns="1" mode="edit" show-actions :disabled="needsSessionRefresh" :submit-disabled="needsSessionRefresh" :submit-loading="saving" submit-text="保存资料" @submit="save" />
      </ElTabPane>
      <ElTabPane label="修改密码" lazy>
        <ProfilePasswordForm :api="api" />
      </ElTabPane>
    </ElTabs>
  </LumalPage>
</template>

<style scoped>
.profile-tabs { max-width: 720px; }
</style>
