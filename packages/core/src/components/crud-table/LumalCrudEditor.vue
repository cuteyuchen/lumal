<script setup lang="ts">
import { getViewportConfig, viewportLength } from '@lumal/viewport'
import { ElDialog, ElDrawer } from 'element-plus'
import { computed } from 'vue'

/***********************设计尺寸与浮层*********************/
const props = withDefaults(defineProps<{
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
  width: 920,
})

const visible = defineModel<boolean>({ default: false })
const editorWidth = computed(() => typeof props.width === 'number' ? viewportLength(props.width) : props.width)
</script>

<template>
  <ElDrawer
    v-if="type === 'drawer'"
    v-model="visible"
    :title="title"
    :size="editorWidth"
    :close-on-click-modal="closeOnClickModal"
    :destroy-on-close="destroyOnClose"
    :before-close="beforeClose"
    class="lumal-crud-table__drawer"
  >
    <slot />
    <template #footer>
      <slot name="footer" />
    </template>
  </ElDrawer>
  <ElDialog
    v-else
    v-model="visible"
    :title="title"
    :width="editorWidth"
    :close-on-click-modal="closeOnClickModal"
    :destroy-on-close="destroyOnClose"
    :before-close="beforeClose"
    class="lumal-crud-table__dialog"
    :class="{ 'is-responsive': !getViewportConfig().enabled }"
  >
    <slot />
    <template #footer>
      <slot name="footer" />
    </template>
  </ElDialog>
</template>
