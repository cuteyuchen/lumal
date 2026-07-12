<script setup lang="ts">
import type { CockpitRegistry } from '../registry/types'
import type {
  CockpitConfig,
  CockpitConfigIssue,
  CockpitDesignerSavePayload,
  CockpitNodeSelectPayload,
  CockpitThemeMode,
} from '../types'
import { computed, ref } from 'vue'
import { LumaCockpit } from '../runtime'
import CockpitComponentLibrary from './CockpitComponentLibrary.vue'
import CockpitLayoutEditor from './CockpitLayoutEditor.vue'
import CockpitPropertiesPanel from './CockpitPropertiesPanel.vue'
import { useCockpitDraft } from './useCockpitDraft'

/***********************驾驶舱配置设计器*********************/
// 不绑定承载方式：宿主可放入全屏覆盖层、独立路由或大尺寸抽屉。
// 显式保存、立即生效；保存前标准化 + 校验；保存失败保持打开。

const props = defineProps<{
  config: CockpitConfig
  registry: CockpitRegistry
  /** 宿主保存进行中，用于禁用重复提交 */
  saving?: boolean
  /** 宿主保存失败信息 */
  saveError?: string
  /** 已解析主题；system 由宿主应用解析为 light/dark */
  themeMode?: CockpitThemeMode
}>()

const emit = defineEmits<{
  save: [payload: CockpitDesignerSavePayload]
  cancel: []
}>()

const draft = useCockpitDraft(props.config)
const selectedNode = ref<CockpitNodeSelectPayload | null>(null)

const issues = ref<CockpitConfigIssue[]>([])
const errorIssues = computed(() => issues.value.filter(i => i.level === 'error'))

const previewCategoryId = computed(() => draft.activeCategory.value?.id)
const previewPageId = computed(() => draft.activePage.value?.id)

function handleSave(): void {
  const { config, validation } = draft.buildSaveConfig()
  issues.value = validation.issues
  if (!validation.valid)
    return
  emit('save', { config })
}

function handleCancel(): void {
  emit('cancel')
}

function handleReset(): void {
  draft.reset()
  issues.value = []
  selectedNode.value = null
}

function handleNodeSelect(payload: CockpitNodeSelectPayload): void {
  selectedNode.value = payload
}
</script>

<template>
  <div
    class="luma-cockpit-designer"
    :data-cockpit-theme="themeMode ?? 'dark'"
    :data-selected-node="selectedNode?.id"
  >
    <header class="luma-cockpit-designer__toolbar">
      <h2 class="luma-cockpit-designer__heading">
        驾驶舱配置
      </h2>
      <div class="luma-cockpit-designer__toolbar-actions">
        <button type="button" @click="handleReset">
          重置
        </button>
        <button type="button" @click="handleCancel">
          取消
        </button>
        <button
          type="button"
          class="luma-cockpit-designer__save"
          :disabled="saving"
          :aria-busy="saving"
          @click="handleSave"
        >
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </header>

    <!-- 校验错误与保存失败提示 -->
    <div v-if="errorIssues.length || saveError" class="luma-cockpit-designer__issues" role="alert">
      <p v-if="saveError" class="luma-cockpit-designer__issue">
        保存失败：{{ saveError }}
      </p>
      <p
        v-for="(issue, index) in errorIssues"
        :key="index"
        class="luma-cockpit-designer__issue"
      >
        <template v-if="issue.path">
          [{{ issue.path.join(' / ') }}]
        </template>{{ issue.message }}
      </p>
    </div>

    <div class="luma-cockpit-designer__body">
      <!-- 左：分类与页面管理 -->
      <aside class="luma-cockpit-designer__pane luma-cockpit-designer__pane--props">
        <CockpitPropertiesPanel :draft="draft" />
      </aside>

      <!-- 中：布局编辑 + 实时预览 -->
      <div class="luma-cockpit-designer__pane luma-cockpit-designer__pane--editor">
        <div class="luma-cockpit-designer__editors">
          <CockpitLayoutEditor :draft="draft" :registry="registry" side="left" />
          <CockpitLayoutEditor :draft="draft" :registry="registry" side="right" />
        </div>
        <div class="luma-cockpit-designer__preview">
          <span class="luma-cockpit-designer__preview-label">实时预览</span>
          <div class="luma-cockpit-designer__preview-stage">
            <LumaCockpit
              v-if="draft.draft.value"
              :config="draft.draft.value"
              :registry="registry"
              render-mode="design"
              :active-category-id="previewCategoryId"
              :active-page-id="previewPageId"
              :theme-mode="themeMode ?? 'dark'"
              @node-select="handleNodeSelect"
            />
          </div>
        </div>
      </div>

      <!-- 右：组件库 -->
      <aside class="luma-cockpit-designer__pane luma-cockpit-designer__pane--library">
        <CockpitComponentLibrary
          :registry="registry"
          :current-center-type="draft.activePage.value?.center?.type"
          @select-center="draft.setPageCenter($event)"
        />
      </aside>
    </div>
  </div>
</template>
