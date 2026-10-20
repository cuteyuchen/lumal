<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus'
import { reactive, shallowRef, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { routeError } from '../../router'
import { demoAccount } from '../../services/data-source'
import { application, login } from '../../services/session'

/***********************登录状态*********************/
const route = useRoute()
const router = useRouter()
const formRef = useTemplateRef<FormInstance>('formRef')
const loading = shallowRef(false)
const errorMessage = shallowRef('')
const form = reactive({ username: demoAccount?.username ?? '', password: demoAccount?.password ?? '' })

/***********************登录提交*********************/
function resolveRedirect(): string {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  return redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.startsWith('/login') ? redirect : '/dashboard'
}

async function handleSubmit(): Promise<void> {
  if (loading.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const valid = await formRef.value?.validate()
    if (valid === false) {
      return
    }

    await login(form)
    await router.replace(resolveRedirect())
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="lumal-admin-login">
    <section class="lumal-admin-login__panel">
      <div class="lumal-admin-login__brand" aria-hidden="true">
        L
      </div>
      <h1>Lumal Admin</h1>
      <p>轻量后台基座</p>

      <ElForm ref="formRef" :model="form" label-position="top" @submit.prevent="handleSubmit">
        <ElFormItem label="用户名" prop="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <ElInput v-model="form.username" autocomplete="username" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password" :rules="[{ required: true, message: '请输入密码' }]">
          <ElInput v-model="form.password" type="password" show-password autocomplete="current-password" />
        </ElFormItem>
        <p v-if="errorMessage" class="lumal-admin-login__error" role="alert">
          {{ errorMessage }}
        </p>
        <ElButton native-type="submit" type="primary" :loading="loading">
          登录
        </ElButton>
      </ElForm>

      <p v-if="routeError || application.error.value" role="alert">
        {{ routeError || application.error.value }}
      </p>
      <small v-if="demoAccount">本地演示账号：{{ demoAccount.username }} / {{ demoAccount.password }}</small>
    </section>
  </main>
</template>
