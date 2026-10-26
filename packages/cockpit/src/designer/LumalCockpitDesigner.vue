<script setup lang="ts">
import type { CockpitRegistry, CockpitWidgetDefinition } from '../registry/types'
import type { CockpitConfig, CockpitConfigIssue, CockpitDesignerSavePayload, CockpitThemeMode } from '../types'
import type { DesignerPlacementSelection } from './types'
import { LumalIcon } from '@lumal/icons-vue'
import { ElAlert, ElButton, ElInput, ElMessageBox, ElOption, ElSelect, ElTooltip } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { createCockpitMessageBus } from '../messaging/createCockpitMessageBus'
import CockpitComponentLibrary from './CockpitComponentLibrary.vue'
import CockpitLayoutEditor from './CockpitLayoutEditor.vue'
import { useCockpitDraft } from './useCockpitDraft'

/***********************驾驶舱装配 Designer*********************/

const props = defineProps<{
  config: CockpitConfig
  registry: CockpitRegistry
  saving?: boolean
  saveError?: string
}>()

const emit = defineEmits<{
  save: [payload: CockpitDesignerSavePayload]
  cancel: []
}>()

const themeMode = defineModel<CockpitThemeMode>('themeMode', { default: 'dark' })

const draft = useCockpitDraft(props.config)
const issues = ref<CockpitConfigIssue[]>([])
const placementSelection = ref<DesignerPlacementSelection>()
const activeLayout = computed(() => draft.activeLayout.value)
const layoutTitle = ref('')
// 受控输入必须接收即时值；只监听 change 会被 Element Plus 还原为旧 modelValue。
watch(() => activeLayout.value?.title, title => layoutTitle.value = title ?? '', { immediate: true })
const errors = computed(() => issues.value.filter(issue => issue.level === 'error'))
const previewMessages = createCockpitMessageBus()
const placementStatus = computed(() => {
  const selection = placementSelection.value
  if (!selection)
    return 'PS：将需要的业务板块拖入上方白框内，已占用槽位会在确认后替换。'
  return selection.kind === 'library'
    ? `已选择模块“${selection.title}”，可连续放入多个槽位，按 Esc 取消。`
    : `正在移动“${selection.title}”，请选择目标槽位或 Tab 行，按 Esc 取消。`
})

watch(() => activeLayout.value?.id, () => {
  placementSelection.value = undefined
})

function selectLibraryWidget(widget: CockpitWidgetDefinition): void {
  placementSelection.value = { kind: 'library', type: widget.type, title: widget.label }
}

function selectPlacedWidget(selection: Extract<DesignerPlacementSelection, { kind: 'placed' }>): void {
  placementSelection.value = selection
}

function clearPlacementSelection(): void {
  placementSelection.value = undefined
}

function handleDesignerKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !placementSelection.value)
    return
  event.preventDefault()
  clearPlacementSelection()
}

function save(): void {
  if (activeLayout.value)
    draft.renameLayout(activeLayout.value.id, layoutTitle.value)
  const result = draft.buildSaveConfig()
  issues.value = result.validation.issues
  if (!result.validation.valid)
    return
  const layoutId = activeLayout.value?.id ?? result.config.activeLayoutId
  const layout = result.config.layouts.find(item => item.id === layoutId)
  if (layout)
    emit('save', { config: result.config, layout })
}

async function removeLayout(): Promise<void> {
  const layout = activeLayout.value
  if (!layout)
    return
  if (draft.layouts.value.length <= 1) {
    await ElMessageBox.alert('至少保留一个布局。', '无法删除', { confirmButtonText: '知道了', type: 'warning' })
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除布局“${layout.title}”吗？`, '删除布局', {
      cancelButtonText: '取消',
      confirmButtonText: '删除',
      type: 'warning',
    })
    draft.removeLayout(layout.id)
  }
  catch {
    // 用户取消时保留草稿，不需要额外提示。
  }
}

async function reset(): Promise<void> {
  try {
    await ElMessageBox.confirm('将放弃本次尚未保存的所有布局调整，是否继续？', '重置草稿', {
      cancelButtonText: '取消',
      confirmButtonText: '重置',
      type: 'warning',
    })
    draft.reset()
    issues.value = []
  }
  catch {
    // 用户取消时保留当前草稿。
  }
}

function toggleTheme(): void {
  themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'
}

defineExpose({ toggleTheme })
</script>

<template>
  <div class="lumal-cockpit-designer" :data-cockpit-theme="themeMode" @keydown="handleDesignerKeydown">
    <header class="lumal-cockpit-designer__titlebar">
      <h2 class="lumal-cockpit-designer__heading">
        <LumalIcon name="lumal:settings" :size="18" />
        模块设置
      </h2>
      <div class="lumal-cockpit-designer__title-actions">
        <slot name="title-actions" :theme-mode="themeMode" :toggle-theme="toggleTheme" />
      </div>
    </header>

    <section class="lumal-cockpit-designer__controlbar">
      <div class="lumal-cockpit-designer__layout-controls">
        <label class="lumal-cockpit-designer__field">
          <span>模板名称</span>
          <ElSelect :model-value="activeLayout?.id" aria-label="选择布局" @update:model-value="draft.selectLayout">
            <ElOption v-for="layout in draft.layouts.value" :key="layout.id" :label="layout.title" :value="layout.id" />
          </ElSelect>
        </label>
        <ElInput
          v-if="activeLayout"
          v-model="layoutTitle"
          aria-label="当前布局名称"
          @change="draft.renameLayout(activeLayout.id, $event)"
        />
        <div class="lumal-cockpit-designer__layout-tools">
          <ElTooltip content="添加布局" placement="top">
            <ElButton circle aria-label="添加布局" @click="draft.addLayout()">
              <LumalIcon name="lumal:plus" :size="15" />
            </ElButton>
          </ElTooltip>
          <ElButton v-if="activeLayout" @click="draft.duplicateLayout(activeLayout.id)">
            复制
          </ElButton>
          <ElButton v-if="activeLayout" type="danger" plain @click="removeLayout">
            删除
          </ElButton>
        </div>
      </div>
    </section>

    <div
      class="lumal-cockpit-designer__issues"
      :class="{ 'is-empty': !errors.length && !saveError }"
      role="alert"
    >
      <ElAlert v-if="saveError" type="error" :closable="false" :title="`保存失败：${saveError}`" show-icon />
      <ElAlert v-for="(issue, index) in errors" :key="index" type="error" :closable="false" :title="issue.message" show-icon />
    </div>

    <main class="lumal-cockpit-designer__workspace">
      <section class="lumal-cockpit-designer__assembly" aria-label="驾驶舱布局装配区">
        <div class="lumal-cockpit-designer__assembly-stage">
          <CockpitLayoutEditor
            :cockpit-id="config.id"
            :draft="draft"
            :registry="registry"
            :placement-selection="placementSelection"
            :preview-message-bus="previewMessages"
            side="left"
            @select-placed="selectPlacedWidget"
            @clear-placement="clearPlacementSelection"
          />
          <CockpitLayoutEditor
            :cockpit-id="config.id"
            :draft="draft"
            :registry="registry"
            :placement-selection="placementSelection"
            :preview-message-bus="previewMessages"
            side="right"
            @select-placed="selectPlacedWidget"
            @clear-placement="clearPlacementSelection"
          />
        </div>
      </section>
      <CockpitComponentLibrary
        :cockpit-id="config.id"
        :layout-id="activeLayout?.id ?? ''"
        :registry="registry"
        :selected-type="placementSelection?.kind === 'library' ? placementSelection.type : undefined"
        @select-widget="selectLibraryWidget"
      />
    </main>

    <footer class="lumal-cockpit-designer__footer">
      <p class="lumal-cockpit-designer__placement-status" role="status" aria-live="polite">
        {{ placementStatus }}
      </p>
      <div class="lumal-cockpit-designer__footer-actions">
        <ElButton @click="reset">
          <LumalIcon name="lumal:reset" :size="16" />
          重置
        </ElButton>
        <ElButton @click="emit('cancel')">
          <LumalIcon name="lumal:close" :size="15" />
          取消
        </ElButton>
        <ElButton type="primary" class="lumal-cockpit-designer__save" :loading="saving" :aria-busy="saving" @click="save">
          {{ saving ? '保存中…' : '保存' }}
        </ElButton>
      </div>
    </footer>
  </div>
</template>
