<script setup lang="ts">
import type { CockpitRegistry, CockpitWidgetDefinition } from '../registry/types'
import type { CockpitConfig, CockpitConfigIssue, CockpitDesignerSavePayload, CockpitThemeMode } from '../types'
import { LumaIcon } from '@luma/icons'
import { ElAlert, ElButton, ElInput, ElMessageBox, ElOption, ElSelect, ElTooltip } from 'element-plus'
import { computed, ref } from 'vue'
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
const selectedWidget = ref<CockpitWidgetDefinition>()
const activeLayout = computed(() => draft.activeLayout.value)
const errors = computed(() => issues.value.filter(issue => issue.level === 'error'))

function save(): void {
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
  <div class="luma-cockpit-designer" :data-cockpit-theme="themeMode">
    <header class="luma-cockpit-designer__titlebar">
      <h2 class="luma-cockpit-designer__heading">
        <LumaIcon name="luma:settings" :size="18" />
        模块设置
      </h2>
      <div class="luma-cockpit-designer__title-actions">
        <slot name="title-actions" :theme-mode="themeMode" :toggle-theme="toggleTheme" />
      </div>
    </header>

    <section class="luma-cockpit-designer__controlbar">
      <div class="luma-cockpit-designer__layout-controls">
        <label class="luma-cockpit-designer__field">
          <span>模板名称</span>
          <ElSelect :model-value="activeLayout?.id" aria-label="选择布局" @update:model-value="draft.selectLayout">
            <ElOption v-for="layout in draft.layouts.value" :key="layout.id" :label="layout.title" :value="layout.id" />
          </ElSelect>
        </label>
        <ElInput
          v-if="activeLayout"
          :model-value="activeLayout.title"
          aria-label="当前布局名称"
          @change="draft.renameLayout(activeLayout.id, $event)"
        />
        <div class="luma-cockpit-designer__layout-tools">
          <ElTooltip content="添加布局" placement="top">
            <ElButton circle aria-label="添加布局" @click="draft.addLayout()">
              <LumaIcon name="luma:plus" :size="15" />
            </ElButton>
          </ElTooltip>
          <ElButton v-if="activeLayout" @click="draft.duplicateLayout(activeLayout.id)">复制</ElButton>
          <ElButton v-if="activeLayout" type="danger" plain @click="removeLayout">删除</ElButton>
        </div>
      </div>
    </section>

    <div
      class="luma-cockpit-designer__issues"
      :class="{ 'is-empty': !errors.length && !saveError }"
      role="alert"
    >
      <ElAlert v-if="saveError" type="error" :closable="false" :title="`保存失败：${saveError}`" show-icon />
      <ElAlert v-for="(issue, index) in errors" :key="index" type="error" :closable="false" :title="issue.message" show-icon />
    </div>

    <main class="luma-cockpit-designer__workspace">
      <section class="luma-cockpit-designer__assembly" aria-label="驾驶舱布局装配区">
        <div class="luma-cockpit-designer__assembly-stage">
          <CockpitLayoutEditor :cockpit-id="config.id" :draft="draft" :registry="registry" :selected-widget="selectedWidget" side="left" />
          <div class="luma-cockpit-designer__center-guide" aria-hidden="true" />
          <CockpitLayoutEditor :cockpit-id="config.id" :draft="draft" :registry="registry" :selected-widget="selectedWidget" side="right" />
        </div>
      </section>
      <CockpitComponentLibrary
        :cockpit-id="config.id"
        :layout-id="activeLayout?.id ?? ''"
        :registry="registry"
        :selected-type="selectedWidget?.type"
        @select-widget="selectedWidget = $event"
      />
    </main>

    <footer class="luma-cockpit-designer__footer">
      <p>提示：将需要的业务模块拖入空槽，已占用槽位会在确认后替换。</p>
      <div class="luma-cockpit-designer__footer-actions">
        <ElButton @click="reset">
          <LumaIcon name="luma:reset" :size="16" />
          重置
        </ElButton>
        <ElButton @click="emit('cancel')">
          <LumaIcon name="luma:close" :size="15" />
          取消
        </ElButton>
        <ElButton type="primary" class="luma-cockpit-designer__save" :loading="saving" :aria-busy="saving" @click="save">
          {{ saving ? '保存中…' : '保存' }}
        </ElButton>
      </div>
    </footer>
  </div>
</template>
