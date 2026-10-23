<script setup lang="ts">
import { shallowRef } from 'vue';
import { authDemo, authEnabled } from '../services/auth-adapter';
import { authenticated, signIn, signOut } from '../services/session';
import ScreenLoginForm from './components/ScreenLoginForm.vue';
import ScreenView from './ScreenView.vue';

/***********************认证门禁*********************/
const loading = shallowRef(false);
const error = shallowRef('');
async function login(username: string, password: string) {
  loading.value = true;
  error.value = '';
  try {
    await signIn(username, password);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <template v-if="authenticated">
    <div class="screen-session">
      <span v-if="authDemo">Local Demo</span>
      <button type="button" @click="signOut">退出登录</button>
    </div>
    <ScreenView />
  </template>
  <main v-else>
    <ScreenLoginForm :loading="loading" :error="error" :enabled="authEnabled" :demo="authDemo" @submit="login" />
  </main>
</template>

<style scoped>
.screen-session {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 12px 32px;
}
</style>
