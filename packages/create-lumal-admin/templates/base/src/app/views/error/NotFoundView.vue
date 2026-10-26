<script setup lang="ts">
import { LumalPage } from '@lumal/core/components';
import { ElButton } from 'element-plus';
import { useRouter } from 'vue-router';

/***********************异常页导航*********************/
const router = useRouter();
</script>

<template>
  <main class="lumal-admin-page">
    <LumalPage title="页面不存在" description="请检查地址，或返回工作台继续操作。">
      <ElButton type="primary" @click="router.push('/dashboard')"> 返回工作台 </ElButton>
    </LumalPage>
  </main>
</template>
