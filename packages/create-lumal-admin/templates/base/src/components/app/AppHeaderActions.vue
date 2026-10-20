<script setup lang="ts">
import type { ResolvedThemeMode } from '@lumal/core/theme'
import { LumalIcon } from '@lumal/icons-vue'
import { ElButton } from 'element-plus'

/***********************头部操作契约*********************/
withDefaults(defineProps<{
  resolvedThemeMode: ResolvedThemeMode
  userName?: string
}>(), {
  userName: '管理员',
})

defineEmits<{
  logout: []
  openSettings: []
  toggleTheme: []
}>()
</script>

<template>
  <div class="lumal-admin-header-actions">
    <ElButton text :title="resolvedThemeMode === 'dark' ? '切换浅色模式' : '切换深色模式'" :aria-label="resolvedThemeMode === 'dark' ? '切换浅色模式' : '切换深色模式'" @click="$emit('toggleTheme')">
      <LumalIcon :name="resolvedThemeMode === 'dark' ? 'lumal:sun' : 'lumal:moon'" />
    </ElButton>
    <ElButton text title="偏好设置" aria-label="偏好设置" @click="$emit('openSettings')">
      <LumalIcon name="lumal:settings" />
    </ElButton>
    <span class="lumal-admin-header-actions__user">{{ userName }}</span>
    <ElButton text aria-label="退出登录" @click="$emit('logout')">
      退出
    </ElButton>
  </div>
</template>
