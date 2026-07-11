<script setup lang="ts">
import { ElDialog, ElDrawer } from 'element-plus'

withDefaults(defineProps<{
  beforeClose?: (done: () => void) => void
  closeOnClickModal?: boolean
  destroyOnClose?: boolean
  title: string
  type?: 'dialog' | 'drawer'
  width?: number | string
}>(), {
  closeOnClickModal: false,
  destroyOnClose: true,
  type: 'dialog',
  width: 'min(920px, calc(100vw - 32px))',
})

const visible = defineModel<boolean>({ default: false })
</script>

<template>
  <ElDrawer
    v-if="type === 'drawer'"
    v-model="visible"
    :title="title"
    :size="width"
    :close-on-click-modal="closeOnClickModal"
    :destroy-on-close="destroyOnClose"
    :before-close="beforeClose"
    class="luma-crud-table__drawer"
  >
    <slot />
    <template #footer><slot name="footer" /></template>
  </ElDrawer>
  <ElDialog
    v-else
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :destroy-on-close="destroyOnClose"
    :before-close="beforeClose"
    class="luma-crud-table__dialog"
  >
    <slot />
    <template #footer><slot name="footer" /></template>
  </ElDialog>
</template>
