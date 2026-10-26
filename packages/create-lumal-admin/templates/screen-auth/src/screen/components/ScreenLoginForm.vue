<script setup lang="ts">
import { shallowRef } from 'vue';

/***********************登录输入*********************/
defineProps<{ loading: boolean; error: string; enabled: boolean; demo: boolean }>();
const emit = defineEmits<{ submit: [username: string, password: string] }>();
const username = shallowRef('');
const password = shallowRef('');
</script>

<template>
  <form class="screen-login" @submit.prevent="emit('submit', username, password)">
    <h1>登录</h1>
    <p v-if="demo" role="status">Local Demo 认证，仅限开发：demo / demo</p>
    <p v-if="!enabled" role="alert">生产环境禁止 Local Demo 登录</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <label>用户名<input v-model="username" name="username" autocomplete="username" required /></label>
    <label
      >密码<input v-model="password" name="password" type="password" autocomplete="current-password" required
    /></label>
    <button type="submit" :disabled="loading || !enabled">{{ loading ? '登录中' : '登录' }}</button>
  </form>
</template>

<style scoped>
.screen-login {
  display: grid;
  gap: 20px;
  width: min(360px, calc(100% - 40px));
  margin: 12vh auto;
}
.screen-login label {
  display: grid;
  gap: 8px;
}
.screen-login input {
  box-sizing: border-box;
  width: 100%;
  min-height: 40px;
}
.screen-login button {
  min-height: 40px;
}
</style>
