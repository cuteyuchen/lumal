<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { AdminAccountKey } from '../../api/auth'
import { LumaIcon } from '@luma/icons'
import { ElButton, ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus'
import { computed, reactive, shallowRef, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminAccountOptions } from '../../api/auth'
import LumaBrand from '../../components/app/LumaBrand.vue'
import { ensureAdminRoutes, resolveFirstAccessibleAdminPath } from '../../router'
import { adminResolvedThemeMode, patchAdminPreferences } from '../../services/preferences'
import { login } from '../../services/session'
import { runAdminThemeTransition } from '../../services/theme-transition'

type LoginLayout = 'center' | 'left' | 'right'

const LOGIN_LAYOUT_STORAGE_KEY = 'luma-admin:login-layout'
const loginLayouts: { label: string, value: LoginLayout }[] = [
  { label: '表单居左', value: 'left' },
  { label: '表单居中', value: 'center' },
  { label: '表单居右', value: 'right' },
]

function readLoginLayout(): LoginLayout {
  if (typeof localStorage === 'undefined') {
    return 'right'
  }

  const value = localStorage.getItem(LOGIN_LAYOUT_STORAGE_KEY)
  return value === 'left' || value === 'center' || value === 'right' ? value : 'right'
}

/***********************路由状态*********************/
const route = useRoute()
const router = useRouter()

/***********************页面状态*********************/
const loginLayout = shallowRef<LoginLayout>(readLoginLayout())
const resolvedThemeMode = adminResolvedThemeMode
const themeToggleTitle = computed(() => resolvedThemeMode.value === 'dark' ? '切换浅色模式' : '切换深色模式')

/***********************表单状态*********************/
const loginFormRef = useTemplateRef<FormInstance>('loginFormRef')
const loading = shallowRef(false)
const errorMessage = shallowRef('')
const form = reactive({
  account: 'admin' as AdminAccountKey,
  password: 'luma123',
  username: 'admin',
})
const rules: FormRules<typeof form> = {
  account: [{ message: '请选择演示账号', required: true, trigger: 'change' }],
  password: [{ message: '请输入密码', required: true, trigger: 'blur' }],
  username: [{ message: '请输入用户名', required: true, trigger: 'blur' }],
}

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

/***********************外观设置*********************/
function setLoginLayout(layout: LoginLayout): void {
  loginLayout.value = layout
  localStorage.setItem(LOGIN_LAYOUT_STORAGE_KEY, layout)
}

function handleToggleTheme(event: MouseEvent): void {
  void runAdminThemeTransition(() => {
    patchAdminPreferences({
      theme: { mode: resolvedThemeMode.value === 'dark' ? 'light' : 'dark' },
    })
  }, event)
}

/***********************跳转解析*********************/
function resolveRedirectPath(): string {
  const redirect = route.query.redirect
  const target = Array.isArray(redirect) ? redirect[0] : redirect

  if (target && target.startsWith('/') && !target.startsWith('/login')) {
    return target
  }

  return resolveFirstAccessibleAdminPath(router)
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
    await ensureAdminRoutes(router)
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
  <main class="luma-admin-login" :class="`is-form-${loginLayout}`">
    <header class="luma-admin-login__topbar">
      <LumaBrand compact :inverse="loginLayout === 'right'" />

      <div class="luma-admin-login__controls" aria-label="登录页外观设置">
        <div class="luma-admin-login__layout-switch" role="group" aria-label="表单位置">
          <button
            v-for="layout in loginLayouts"
            :key="layout.value"
            class="luma-admin-login__layout-button"
            :class="{ 'is-active': loginLayout === layout.value }"
            type="button"
            :title="layout.label"
            :aria-label="layout.label"
            :aria-pressed="loginLayout === layout.value"
            @click="setLoginLayout(layout.value)"
          >
            <span class="luma-admin-login__layout-glyph" :class="`is-${layout.value}`" aria-hidden="true">
              <i />
            </span>
          </button>
        </div>

        <ElButton
          class="luma-admin-login__theme-button"
          circle
          text
          :title="themeToggleTitle"
          :aria-label="themeToggleTitle"
          data-action="toggle-theme"
          @click="handleToggleTheme"
        >
          <LumaIcon :name="resolvedThemeMode === 'dark' ? 'luma:sun' : 'luma:moon'" :size="18" />
        </ElButton>
      </div>
    </header>

    <section class="luma-admin-login__hero" aria-labelledby="login-hero-title">
      <div class="luma-admin-login__hero-content">
        <p class="luma-admin-login__eyebrow">
          LUMA ADMIN CONSOLE
        </p>
        <h2 id="login-hero-title">
          让管理系统保持清晰，<br>让每次操作都有回响。
        </h2>
        <p class="luma-admin-login__hero-copy">
          面向现代业务的 Vue 管理基座，覆盖权限、配置与系统管理，让团队把时间留给真正重要的产品能力。
        </p>

        <div class="luma-admin-login__visual" aria-hidden="true">
          <span class="luma-admin-login__orbit is-orbit-one" />
          <span class="luma-admin-login__orbit is-orbit-two" />
          <span class="luma-admin-login__glow" />
          <img src="../../assets/luma-logo.svg" alt="">
          <span class="luma-admin-login__metric is-metric-access">
            <i />
            <b>访问控制</b>
            <small>权限策略已同步</small>
          </span>
          <span class="luma-admin-login__metric is-metric-runtime">
            <i />
            <b>运行状态</b>
            <small>所有服务正常</small>
          </span>
          <span class="luma-admin-login__metric is-metric-theme">
            <i /><i /><i />
            <small>灵活主题</small>
          </span>
        </div>

        <ul class="luma-admin-login__features" aria-label="平台能力">
          <li><span />动态权限</li>
          <li><span />会话沙箱</li>
          <li><span />响应式布局</li>
        </ul>
      </div>
    </section>

    <section class="luma-admin-login__auth" aria-labelledby="login-title">
      <div class="luma-admin-login__panel">
        <div class="luma-admin-login__heading">
          <p class="luma-admin-login__welcome">
            WELCOME BACK
          </p>
          <h1 id="login-title">
            欢迎回来
          </h1>
          <p>选择演示身份，进入你的 Luma 工作台。</p>
        </div>

        <ElForm
          ref="loginFormRef"
          class="luma-admin-login__form"
          data-testid="login-form"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <ElFormItem label="演示账号" prop="account">
            <ElSelect
              v-model="form.account"
              data-testid="login-account"
              name="account"
              placeholder="请选择演示账号"
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
            <div class="luma-admin-login__input" data-testid="login-username">
              <ElInput
                v-model="form.username"
                autocomplete="username"
                name="username"
                placeholder="请输入用户名"
              />
            </div>
          </ElFormItem>

          <ElFormItem label="密码" prop="password">
            <ElInput
              v-model="form.password"
              autocomplete="current-password"
              name="password"
              placeholder="请输入密码"
              show-password
              type="password"
            />
          </ElFormItem>

          <p v-if="errorMessage" class="luma-admin-login__error" role="alert">
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
            进入管理后台
          </ElButton>
        </ElForm>

        <div class="luma-admin-login__hint">
          <span class="luma-admin-login__hint-dot" />
          <p>
            <strong>{{ selectedAccount.label }}</strong>
            <small>{{ selectedAccount.description }}</small>
          </p>
        </div>
      </div>

      <p class="luma-admin-login__copyright">
        Luma Admin · Demo 数据仅用于功能体验
      </p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.luma-admin-login {
  position: relative;
  display: grid;
  min-width: 320px;
  min-height: 100vh;
  min-height: 100dvh;
  grid-template-columns: minmax(0, 1.16fr) minmax(440px, 0.84fr);
  overflow: hidden;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-page);
}

.luma-admin-login__topbar {
  position: absolute;
  z-index: 5;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  height: 76px;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  pointer-events: none;
}

.luma-admin-login__topbar > * {
  pointer-events: auto;
}

.luma-admin-login__controls,
.luma-admin-login__layout-switch {
  display: flex;
  align-items: center;
}

.luma-admin-login__controls {
  gap: 10px;
}

.luma-admin-login__layout-switch {
  gap: 2px;
  padding: 3px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-bg-color) 78%, transparent);
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
  backdrop-filter: blur(14px);
}

.luma-admin-login__layout-button {
  display: grid;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  place-items: center;
  transition: color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
}

.luma-admin-login__layout-button:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.luma-admin-login__layout-button.is-active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 2px 8px rgb(15 23 42 / 10%);
}

.luma-admin-login__layout-button:focus-visible,
.luma-admin-login__theme-button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.luma-admin-login__layout-glyph {
  position: relative;
  display: block;
  width: 17px;
  height: 13px;
  box-sizing: border-box;
  border: 1.5px solid currentcolor;
  border-radius: 3px;
  opacity: .92;
}

.luma-admin-login__layout-glyph i {
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 5px;
  border-radius: 1px;
  background: currentcolor;
}

.luma-admin-login__layout-glyph.is-left i { left: 2px; }
.luma-admin-login__layout-glyph.is-center i { left: 50%; transform: translateX(-50%); }
.luma-admin-login__layout-glyph.is-right i { right: 2px; }

.luma-admin-login__theme-button {
  width: 44px;
  height: 44px;
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 78%, transparent);
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
  backdrop-filter: blur(14px);
}

.luma-admin-login__hero {
  position: relative;
  display: grid;
  min-width: 0;
  padding: 112px 8vw 64px;
  overflow: hidden;
  background:
    radial-gradient(circle at 64% 42%, rgb(53 133 255 / 25%), transparent 31%),
    radial-gradient(circle at 18% 78%, rgb(91 71 255 / 18%), transparent 28%),
    linear-gradient(145deg, #07101f 0%, #091a32 52%, #07111f 100%);
  place-items: center;
}

.luma-admin-login__hero::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(148 163 184 / 7%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(148 163 184 / 7%) 1px, transparent 1px);
  background-size: 42px 42px;
  content: '';
  mask-image: linear-gradient(to bottom, transparent, #000 18%, #000 78%, transparent);
}

.luma-admin-login__hero::after {
  position: absolute;
  width: 420px;
  height: 420px;
  border: 1px solid rgb(96 165 250 / 10%);
  border-radius: 50%;
  box-shadow: 0 0 0 80px rgb(59 130 246 / 3%), 0 0 0 160px rgb(59 130 246 / 2%);
  content: '';
}

.luma-admin-login__hero-content {
  position: relative;
  z-index: 1;
  width: min(620px, 100%);
  color: #f8fafc;
}

.luma-admin-login__eyebrow,
.luma-admin-login__welcome {
  margin: 0 0 14px;
  color: #60a5fa;
  font-size: calc(var(--luma-font-size-base, 14px) - 3px);
  font-weight: 750;
  letter-spacing: .18em;
}

.luma-admin-login__hero h2 {
  margin: 0;
  font-size: clamp(calc(var(--luma-font-size-base, 14px) + 20px), 3.2vw, calc(var(--luma-font-size-base, 14px) + 38px));
  font-weight: 720;
  letter-spacing: -.045em;
  line-height: 1.18;
}

.luma-admin-login__hero-copy {
  max-width: 550px;
  margin: 22px 0 0;
  color: #9fb0c7;
  font-size: calc(var(--luma-font-size-base, 14px) + 1px);
  line-height: 1.85;
}

.luma-admin-login__visual {
  position: relative;
  display: grid;
  height: 260px;
  margin: 18px 0 4px;
  place-items: center;
}

.luma-admin-login__visual > img {
  position: relative;
  z-index: 2;
  width: 116px;
  height: 116px;
  filter: drop-shadow(0 22px 46px rgb(37 99 235 / 45%));
}

.luma-admin-login__glow {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgb(37 99 235 / 28%);
  filter: blur(32px);
}

.luma-admin-login__orbit {
  position: absolute;
  border: 1px solid rgb(125 211 252 / 20%);
  border-radius: 50%;
}

.luma-admin-login__orbit::after {
  position: absolute;
  top: 50%;
  left: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #67e8f9;
  box-shadow: 0 0 12px #38bdf8;
  content: '';
}

.luma-admin-login__orbit.is-orbit-one { width: 206px; height: 206px; transform: rotate(22deg); }
.luma-admin-login__orbit.is-orbit-two { width: 276px; height: 150px; transform: rotate(-12deg); }

.luma-admin-login__metric {
  position: absolute;
  z-index: 3;
  display: grid;
  min-width: 126px;
  gap: 3px;
  padding: 12px 14px;
  border: 1px solid rgb(148 163 184 / 16%);
  border-radius: 12px;
  color: #e2e8f0;
  background: rgb(10 25 47 / 76%);
  box-shadow: 0 18px 36px rgb(0 0 0 / 22%);
  backdrop-filter: blur(14px);
}

.luma-admin-login__metric b { font-size: calc(var(--luma-font-size-base, 14px) - 2px); font-weight: 650; }
.luma-admin-login__metric small { color: #8094af; font-size: calc(var(--luma-font-size-base, 14px) - 4px); }
.luma-admin-login__metric > i:first-child {
  width: 7px;
  height: 7px;
  margin-bottom: 4px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 10px rgb(52 211 153 / 65%);
}
.luma-admin-login__metric.is-metric-access { top: 38px; left: 5%; }
.luma-admin-login__metric.is-metric-runtime { right: 2%; bottom: 28px; }
.luma-admin-login__metric.is-metric-theme {
  right: 8%;
  top: 22px;
  display: flex;
  min-width: auto;
  align-items: center;
  gap: 6px;
}
.luma-admin-login__metric.is-metric-theme i { width: 10px; height: 10px; margin: 0; background: #60a5fa; }
.luma-admin-login__metric.is-metric-theme i:nth-child(2) { background: #8b5cf6; }
.luma-admin-login__metric.is-metric-theme i:nth-child(3) { background: #22d3ee; }
.luma-admin-login__metric.is-metric-theme small { margin-left: 3px; }

.luma-admin-login__features {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  margin: 0;
  padding: 0;
  color: #aebed2;
  font-size: calc(var(--luma-font-size-base, 14px) - 2px);
  list-style: none;
}

.luma-admin-login__features li { display: inline-flex; align-items: center; gap: 8px; }
.luma-admin-login__features span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #60a5fa;
  box-shadow: 0 0 8px rgb(96 165 250 / 75%);
}

.luma-admin-login__auth {
  position: relative;
  display: grid;
  min-width: 0;
  box-sizing: border-box;
  align-content: center;
  padding: 112px clamp(44px, 6vw, 100px) 72px;
  background:
    radial-gradient(circle at 90% 8%, color-mix(in srgb, var(--el-color-primary) 8%, transparent), transparent 28%),
    var(--el-bg-color-page);
}

.luma-admin-login__panel {
  width: min(420px, 100%);
  margin: auto;
}

.luma-admin-login__heading { margin-bottom: 32px; }
.luma-admin-login__welcome { color: var(--el-color-primary); }
.luma-admin-login__heading h1 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: calc(var(--luma-font-size-base, 14px) + 18px);
  font-weight: 730;
  letter-spacing: -.04em;
  line-height: 1.2;
}
.luma-admin-login__heading > p:last-child {
  margin: 10px 0 0;
  color: var(--el-text-color-secondary);
  font-size: var(--luma-font-size-base, 14px);
  line-height: 1.6;
}

.luma-admin-login__form { display: grid; gap: 4px; }
.luma-admin-login__form :deep(.el-form-item) { margin-bottom: 18px; }
.luma-admin-login__form :deep(.el-form-item__label) {
  height: auto;
  padding-bottom: 8px;
  color: var(--el-text-color-regular);
  font-size: calc(var(--luma-font-size-base, 14px) - 1px);
  font-weight: 600;
  line-height: 1.3;
}
.luma-admin-login__form :deep(.el-select),
.luma-admin-login__input { width: 100%; }
.luma-admin-login__form :deep(.el-input__wrapper),
.luma-admin-login__form :deep(.el-select__wrapper) {
  min-height: 46px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
  transition: box-shadow 180ms ease, background-color 180ms ease;
}
.luma-admin-login__form :deep(.el-input__wrapper:hover),
.luma-admin-login__form :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color-darker) inset;
}
.luma-admin-login__error {
  margin: -4px 0 12px;
  color: var(--el-color-danger);
  font-size: calc(var(--luma-font-size-base, 14px) - 1px);
  line-height: 1.5;
}
.luma-admin-login__submit {
  width: 100%;
  min-height: 46px;
  margin-top: 2px;
  border-radius: 10px;
  font-weight: 650;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.luma-admin-login__hint {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  margin-top: 22px;
  padding: 13px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-fill-color-light) 64%, transparent);
}
.luma-admin-login__hint-dot {
  width: 7px;
  height: 7px;
  flex: none;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.luma-admin-login__hint p { display: grid; gap: 3px; margin: 0; }
.luma-admin-login__hint strong { color: var(--el-text-color-regular); font-size: calc(var(--luma-font-size-base, 14px) - 2px); }
.luma-admin-login__hint small { color: var(--el-text-color-secondary); font-size: calc(var(--luma-font-size-base, 14px) - 3px); line-height: 1.5; }

.luma-admin-login__copyright {
  position: absolute;
  right: 0;
  bottom: 24px;
  left: 0;
  margin: 0;
  color: var(--el-text-color-placeholder);
  font-size: calc(var(--luma-font-size-base, 14px) - 3px);
  text-align: center;
}

.luma-admin-login.is-form-left {
  grid-template-columns: minmax(440px, .84fr) minmax(0, 1.16fr);
}
.luma-admin-login.is-form-left .luma-admin-login__auth { order: -1; }

.luma-admin-login.is-form-center { display: block; }
.luma-admin-login.is-form-center .luma-admin-login__hero { display: none; }
.luma-admin-login.is-form-center .luma-admin-login__auth {
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(circle at 18% 24%, color-mix(in srgb, var(--el-color-primary) 13%, transparent), transparent 26%),
    radial-gradient(circle at 82% 78%, color-mix(in srgb, #7c3aed 10%, transparent), transparent 24%),
    var(--el-bg-color-page);
}
.luma-admin-login.is-form-center .luma-admin-login__panel {
  box-sizing: border-box;
  padding: 34px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
  box-shadow: 0 24px 70px rgb(15 23 42 / 12%);
  backdrop-filter: blur(18px);
}

@media (max-width: 1100px) {
  .luma-admin-login,
  .luma-admin-login.is-form-left {
    grid-template-columns: minmax(0, 1fr) minmax(400px, .9fr);
  }
  .luma-admin-login.is-form-left { grid-template-columns: minmax(400px, .9fr) minmax(0, 1fr); }
  .luma-admin-login__hero { padding-right: 5vw; padding-left: 5vw; }
  .luma-admin-login__metric.is-metric-access { left: 0; }
  .luma-admin-login__metric.is-metric-runtime { right: 0; }
}

@media (max-width: 820px) {
  .luma-admin-login,
  .luma-admin-login.is-form-left,
  .luma-admin-login.is-form-center {
    display: block;
  }
  .luma-admin-login__hero { display: none; }
  .luma-admin-login__auth {
    min-height: 100vh;
    min-height: 100dvh;
    padding: 108px 32px 64px;
  }
  .luma-admin-login__layout-switch { display: none; }
}

@media (max-width: 480px) {
  .luma-admin-login__topbar { height: 68px; padding: 0 16px; }
  .luma-admin-login__auth { padding: 92px 20px 58px; }
  .luma-admin-login__heading { margin-bottom: 26px; }
  .luma-admin-login__heading h1 { font-size: calc(var(--luma-font-size-base, 14px) + 14px); }
  .luma-admin-login.is-form-center .luma-admin-login__panel {
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }
  .luma-admin-login__copyright { bottom: 18px; }
}

@media (prefers-reduced-motion: no-preference) {
  .luma-admin-login__visual > img { animation: luma-login-float 5s ease-in-out infinite; }
  .luma-admin-login__orbit.is-orbit-one { animation: luma-login-orbit 18s linear infinite; }
  .luma-admin-login__orbit.is-orbit-two { animation: luma-login-orbit-reverse 22s linear infinite; }
}

@keyframes luma-login-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes luma-login-orbit {
  from { transform: rotate(22deg); }
  to { transform: rotate(382deg); }
}

@keyframes luma-login-orbit-reverse {
  from { transform: rotate(-12deg); }
  to { transform: rotate(-372deg); }
}
</style>
