<script setup lang="ts">
import { nextTick, onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue'
import LumalIconPicker from './LumalIconPicker.vue'

/***********************属性与事件*********************/
withDefaults(defineProps<{
  cancelText?: string
  confirmText?: string
  title?: string
}>(), {
  cancelText: '取消',
  confirmText: '确认选择',
  title: '选择图标',
})

const emit = defineEmits<{
  cancel: []
  confirm: [icon: string]
}>()

const visible = defineModel<boolean>('visible', { default: false })
const iconValue = defineModel<string>()
const draftValue = shallowRef('')
const dialogRef = useTemplateRef<HTMLElement>('dialogRef')
let previousFocus: HTMLElement | undefined

/***********************弹窗焦点与键盘约束*********************/
function containFocus(event: FocusEvent): void {
  if (visible.value && dialogRef.value && !dialogRef.value.contains(event.target as Node))
    dialogRef.value.focus()
}

function handleDialogKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    cancel()
  }
  if (event.key !== 'Tab')
    return
  const elements = [...dialogRef.value?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]') ?? []]
    .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[hidden], [inert]'))
  const first = elements[0]
  const last = elements.at(-1)
  if (!first || (event.shiftKey ? document.activeElement === first || document.activeElement === dialogRef.value : document.activeElement === last || document.activeElement === dialogRef.value)) {
    event.preventDefault()
    ;(event.shiftKey ? last : first)?.focus()
  }
}

watch(visible, async (nextVisible) => {
  if (typeof document === 'undefined')
    return
  if (!nextVisible) {
    document.removeEventListener('focusin', containFocus)
    const target = previousFocus
    await nextTick()
    if (!visible.value && target?.isConnected)
      target.focus()
    return
  }

  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
  draftValue.value = iconValue.value ?? ''
  await nextTick()
  if (visible.value) {
    dialogRef.value?.focus()
    document.addEventListener('focusin', containFocus)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.removeEventListener('focusin', containFocus)
  if (previousFocus?.isConnected)
    previousFocus.focus()
})

/***********************选择确认*********************/
function cancel(): void {
  visible.value = false
  emit('cancel')
}

function confirm(): void {
  if (!draftValue.value) {
    return
  }

  iconValue.value = draftValue.value
  visible.value = false
  emit('confirm', draftValue.value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="lumal-icon-picker-dialog" role="presentation" @mousedown.self="cancel">
      <section
        ref="dialogRef"
        class="lumal-icon-picker-dialog__body"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        @keydown="handleDialogKeydown"
      >
        <header class="lumal-icon-picker-dialog__header">
          <h3>{{ title }}</h3>
          <button type="button" aria-label="关闭图标选择器" @click="cancel">
            ×
          </button>
        </header>

        <div class="lumal-icon-picker-dialog__content">
          <LumalIconPicker v-model="draftValue" />
        </div>

        <footer class="lumal-icon-picker-dialog__footer">
          <button type="button" @click="cancel">
            {{ cancelText }}
          </button>
          <button type="button" class="is-primary" :disabled="!draftValue" @click="confirm">
            {{ confirmText }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.lumal-icon-picker-dialog {
  position: fixed;
  z-index: var(--lumal-z-dialog, 500);
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, CanvasText 48%, transparent);
}

.lumal-icon-picker-dialog__body {
  display: grid;
  width: min(680px, 100%);
  max-height: min(680px, 88dvh);
  overflow: hidden;
  border-radius: var(--lumal-radius-large, 12px);
  color: var(--el-text-color-primary, CanvasText);
  background: var(--el-bg-color, Canvas);
  box-shadow: var(--lumal-shadow-dialog, 0 18px 48px color-mix(in srgb, CanvasText 18%, transparent));
}

.lumal-icon-picker-dialog__header,
.lumal-icon-picker-dialog__footer {
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
}

.lumal-icon-picker-dialog__header {
  border-bottom: 1px solid var(--el-border-color-lighter, currentColor);
}

.lumal-icon-picker-dialog__header h3 {
  margin: 0;
  font-size: 17px;
}

.lumal-icon-picker-dialog__content {
  min-height: 0;
  overflow: auto;
  padding: 20px;
}

.lumal-icon-picker-dialog__footer {
  justify-content: flex-end;
  border-top: 1px solid var(--el-border-color-lighter, currentColor);
}

.lumal-icon-picker-dialog button {
  min-width: 44px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--el-border-color, currentColor);
  border-radius: var(--lumal-radius-base, 8px);
  color: inherit;
  background: var(--el-bg-color, Canvas);
  cursor: pointer;
}

.lumal-icon-picker-dialog button.is-primary {
  border-color: var(--el-color-primary, Highlight);
  color: var(--el-color-white, HighlightText);
  background: var(--el-color-primary, Highlight);
}

.lumal-icon-picker-dialog button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 640px) {
  .lumal-icon-picker-dialog {
    align-items: flex-end;
    padding: 0;
  }

  .lumal-icon-picker-dialog__body {
    max-height: 92dvh;
    border-radius: var(--lumal-radius-large, 12px) var(--lumal-radius-large, 12px) 0 0;
  }
}
</style>
