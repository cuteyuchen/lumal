<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { AdminAccountKey } from '../../api/auth'
import { ElButton, ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus'
import { computed, reactive, shallowRef, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminAccountOptions } from '../../api/auth'
import { resolveFirstAccessibleAdminPath } from '../../router'
import { login } from '../../services/session'

/***********************路由状态*********************/
const route = useRoute()
const router = useRouter()

/***********************表单状态*********************/
const loginFormRef = useTemplateRef<FormInstance>('loginFormRef')
const loading = shallowRef(false)
const errorMessage = shallowRef('')
const form = reactive({
  account: 'admin' as AdminAccountKey,
  password: 'luma123',
  username: 'admin',
})

const selectedAccount = computed(() =>
  adminAccountOptions.find(account => account.key === form.account) ?? adminAccountOptions[0]!,
)

watch(
  selectedAccount,
  (account) => {
    form.account = account.key
    form.username = account.username
    form.password = account.password
  },
  { immediate: true },
)

/***********************跳转解析*********************/
function resolveRedirectPath(): string {
  const redirect = route.query.redirect
  const target = Array.isArray(redirect) ? redirect[0] : redirect

  if (target && target.startsWith('/') && !target.startsWith('/login')) {
    return target
  }

  return resolveFirstAccessibleAdminPath()
}

/***********************登录提交*********************/
async function handleSubmit(): Promise<void> {
  if (loading.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const valid = await loginFormRef.value?.validate()

    if (valid === false) {
      return
    }

    await login({
      account: form.account,
      password: form.password,
      username: form.username,
    })
    await router.push(resolveRedirectPath())
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
  <main class="luma-admin-login">
    <section class="luma-admin-login__panel">
      <div class="luma-admin-login__brand">
        <span class="luma-admin-login__mark">L</span>
        <div class="luma-admin-login__heading">
          <h1 class="luma-admin-login__title">
            Luma Admin
          </h1>
          <p class="luma-admin-login__subtitle">
            后台基座登录
          </p>
        </div>
      </div>

      <ElForm
        ref="loginFormRef"
        class="luma-admin-login__form"
        data-testid="login-form"
        :model="form"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <ElFormItem label="账号预设" prop="account">
          <ElSelect
            v-model="form.account"
            data-testid="login-account"
            name="account"
          >
            <ElOption
              v-for="account in adminAccountOptions"
              :key="account.key"
              :label="account.label"
              :value="account.key"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="用户名" prop="username">
          <div data-testid="login-username">
            <ElInput
              v-model="form.username"
              autocomplete="username"
              name="username"
            />
          </div>
        </ElFormItem>

        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model="form.password"
            autocomplete="current-password"
            name="password"
            type="password"
          />
        </ElFormItem>

        <p v-if="errorMessage" class="luma-admin-login__error">
          {{ errorMessage }}
        </p>

        <ElButton
          class="luma-admin-login__submit"
          data-testid="login-submit"
          native-type="submit"
          :loading="loading"
          type="primary"
          @click="handleSubmit"
        >
          登录
        </ElButton>
      </ElForm>

      <p class="luma-admin-login__hint">
        当前预设：{{ selectedAccount.description }}
      </p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.luma-admin-login {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background:
    linear-gradient(135deg, rgba(21, 94, 117, 0.12), rgba(22, 163, 74, 0.08)),
    var(--el-bg-color-page);
}

.luma-admin-login__panel {
  width: min(420px, 100%);
  padding: 32px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.luma-admin-login__brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.luma-admin-login__mark {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #155e75;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.luma-admin-login__heading {
  min-width: 0;
}

.luma-admin-login__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 24px;
  line-height: 1.2;
}

.luma-admin-login__subtitle {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.luma-admin-login__form {
  display: grid;
  gap: 4px;
}

.luma-admin-login__error {
  margin: 0 0 8px;
  color: var(--el-color-danger);
  font-size: 13px;
}

.luma-admin-login__submit {
  width: 100%;
  margin-top: 8px;
}

.luma-admin-login__hint {
  margin: 18px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}
</style>
