<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { AdminProfile } from '../../api/profile'
import { LumaPage } from '@luma/core/components'
import {
  ElAlert,
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus'
import { computed, onMounted, reactive, shallowRef, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  changeAdminPassword,
  fetchAdminProfile,
  updateAdminProfile,
} from '../../api/profile'
import { currentUser, logout, updateCurrentUserName } from '../../services/session'

const router = useRouter()
const profileFormRef = useTemplateRef<FormInstance>('profileFormRef')
const passwordFormRef = useTemplateRef<FormInstance>('passwordFormRef')
const profile = shallowRef<AdminProfile>()
const loading = shallowRef(false)
const savingProfile = shallowRef(false)
const savingPassword = shallowRef(false)
const loadError = shallowRef('')
const activeTab = shallowRef('profile')

const profileForm = reactive({
  nickname: '',
  phone: '',
})
const passwordForm = reactive({
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
})

const userInitial = computed(() => profile.value?.nickname.trim().slice(0, 1).toUpperCase() || '用')
const statusLabel = computed(() => profile.value?.status === 'enabled' ? '启用' : '停用')
const roleLabel = computed(() => profile.value?.roles.join('、') || '-')

const profileRules = {
  nickname: [
    { message: '请输入昵称', required: true, trigger: 'blur' },
    { max: 32, message: '昵称不能超过 32 个字符', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1\d{10}$/, message: '请输入正确的 11 位手机号', trigger: 'blur' },
  ],
}
const passwordRules = {
  confirmPassword: [
    { message: '请再次输入新密码', required: true, trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        callback(value === passwordForm.newPassword ? undefined : new Error('两次输入的新密码不一致'))
      },
      trigger: 'blur',
    },
  ],
  currentPassword: [
    { message: '请输入当前密码', required: true, trigger: 'blur' },
  ],
  newPassword: [
    { message: '请输入新密码', required: true, trigger: 'blur' },
    { max: 32, message: '新密码长度需为 8 到 32 位', min: 8, trigger: 'blur' },
  ],
}

async function validateForm(form: FormInstance | null | undefined): Promise<boolean> {
  if (!form) {
    return false
  }

  try {
    return await form.validate()
  }
  catch {
    return false
  }
}

async function loadProfile(): Promise<void> {
  const user = currentUser.value
  if (!user) {
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const result = await fetchAdminProfile(user.username)
    profile.value = result
    profileForm.nickname = result.nickname
    profileForm.phone = result.phone
  }
  catch (error) {
    loadError.value = error instanceof Error ? error.message : '个人资料加载失败'
  }
  finally {
    loading.value = false
  }
}

async function saveProfile(): Promise<void> {
  const user = currentUser.value
  if (!user || savingProfile.value) {
    return
  }

  if (!await validateForm(profileFormRef.value)) {
    return
  }

  savingProfile.value = true
  try {
    const result = await updateAdminProfile(user.username, profileForm)
    profile.value = result
    updateCurrentUserName(result.nickname)
    ElMessage.success('个人资料已更新')
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '个人资料保存失败')
  }
  finally {
    savingProfile.value = false
  }
}

async function savePassword(): Promise<void> {
  const user = currentUser.value
  if (!user || savingPassword.value) {
    return
  }

  if (!await validateForm(passwordFormRef.value)) {
    return
  }

  savingPassword.value = true
  try {
    await changeAdminPassword(user.username, {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    ElMessage.success('密码修改成功，请重新登录')
    await logout()
    await router.replace({ path: '/login', query: { redirect: '/profile' } })
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '密码修改失败')
  }
  finally {
    savingPassword.value = false
  }
}

onMounted(() => void loadProfile())
</script>

<template>
  <main class="luma-admin-page luma-admin-profile">
    <LumaPage title="个人中心" description="维护当前账号的基本资料与登录密码。" :loading="loading">
      <ElAlert
        v-if="loadError"
        :title="loadError"
        type="error"
        show-icon
        :closable="false"
      >
        <template #default>
          <ElButton link type="primary" @click="loadProfile">
            重新加载
          </ElButton>
        </template>
      </ElAlert>

      <div v-if="profile" class="luma-admin-profile__grid">
        <ElCard class="luma-admin-profile__summary" shadow="never">
          <div class="luma-admin-profile__avatar" aria-hidden="true">
            {{ userInitial }}
          </div>
          <h2>{{ profile.nickname }}</h2>
          <p>@{{ profile.username }}</p>
          <dl>
            <div>
              <dt>账号状态</dt>
              <dd>
                <ElTag :type="profile.status === 'enabled' ? 'success' : 'info'">
                  {{ statusLabel }}
                </ElTag>
              </dd>
            </div>
            <div>
              <dt>角色</dt>
              <dd>{{ roleLabel }}</dd>
            </div>
          </dl>
        </ElCard>

        <ElCard class="luma-admin-profile__content" shadow="never">
          <ElTabs v-model="activeTab">
            <ElTabPane label="基本资料" name="profile">
              <ElForm
                ref="profileFormRef"
                class="luma-admin-profile__form"
                :model="profileForm"
                :rules="profileRules"
                label-position="top"
                @submit.prevent="saveProfile"
              >
                <ElFormItem label="用户名">
                  <ElInput :model-value="profile.username" disabled />
                </ElFormItem>
                <ElFormItem label="昵称" prop="nickname">
                  <ElInput v-model="profileForm.nickname" maxlength="32" />
                </ElFormItem>
                <ElFormItem label="手机号" prop="phone">
                  <ElInput v-model="profileForm.phone" maxlength="11" placeholder="可选，填写 11 位手机号" />
                </ElFormItem>
                <ElButton type="primary" native-type="submit" :loading="savingProfile">
                  保存资料
                </ElButton>
              </ElForm>
            </ElTabPane>

            <ElTabPane label="修改密码" name="password">
              <ElForm
                ref="passwordFormRef"
                class="luma-admin-profile__form"
                :model="passwordForm"
                :rules="passwordRules"
                label-position="top"
                @submit.prevent="savePassword"
              >
                <ElFormItem label="当前密码" prop="currentPassword">
                  <ElInput v-model="passwordForm.currentPassword" autocomplete="current-password" show-password type="password" />
                </ElFormItem>
                <ElFormItem label="新密码" prop="newPassword">
                  <ElInput v-model="passwordForm.newPassword" autocomplete="new-password" show-password type="password" />
                </ElFormItem>
                <ElFormItem label="确认新密码" prop="confirmPassword">
                  <ElInput v-model="passwordForm.confirmPassword" autocomplete="new-password" show-password type="password" />
                </ElFormItem>
                <p class="luma-admin-profile__hint">
                  密码长度为 8–32 位，修改成功后当前会话将退出。
                </p>
                <ElButton type="primary" native-type="submit" :loading="savingPassword">
                  修改密码
                </ElButton>
              </ElForm>
            </ElTabPane>
          </ElTabs>
        </ElCard>
      </div>
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.luma-admin-profile__grid {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
}

.luma-admin-profile__summary {
  align-self: start;
  text-align: center;
}

.luma-admin-profile__avatar {
  display: grid;
  width: 72px;
  height: 72px;
  margin: 8px auto 14px;
  place-items: center;
  border-radius: 50%;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  font-size: calc(var(--luma-font-size-base, 14px) + 12px);
  font-weight: 700;
}

.luma-admin-profile__summary h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: calc(var(--luma-font-size-base, 14px) + 4px);
}

.luma-admin-profile__summary p {
  margin: 6px 0 20px;
  color: var(--el-text-color-secondary);
  font-size: calc(var(--luma-font-size-base, 14px) - 1px);
}

.luma-admin-profile__summary dl {
  display: grid;
  gap: 12px;
  margin: 0;
  text-align: left;
}

.luma-admin-profile__summary dl > div {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.luma-admin-profile__summary dt {
  color: var(--el-text-color-secondary);
  font-size: calc(var(--luma-font-size-base, 14px) - 1px);
}

.luma-admin-profile__summary dd {
  min-width: 0;
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: calc(var(--luma-font-size-base, 14px) - 1px);
  overflow-wrap: anywhere;
}

.luma-admin-profile__content {
  min-width: 0;
}

.luma-admin-profile__form {
  width: min(520px, 100%);
  padding-top: 4px;
}

.luma-admin-profile__form :deep(.el-button) {
  min-width: 112px;
}

.luma-admin-profile__hint {
  margin: -2px 0 16px;
  color: var(--el-text-color-secondary);
  font-size: calc(var(--luma-font-size-base, 14px) - 2px);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .luma-admin-profile__grid {
    grid-template-columns: 1fr;
  }
}
</style>
