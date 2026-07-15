<script setup lang="ts">
import type { CockpitConfig, CockpitDesignerSavePayload, CockpitViewportMode } from '@luma/cockpit'
import { LumaCockpitDesigner } from '@luma/cockpit/designer'
import { LumaCockpit } from '@luma/cockpit/runtime'
import { LumaIcon } from '@luma/icons'
import { ElButton, ElTooltip } from 'element-plus'
import { computed, ref, shallowRef, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { permissionStore } from '../services/permission'
import { adminCockpitRepository } from './api/cockpit'
import StubCenter from './centers/stub-center/Center.vue'
import { adminCockpitRegistry } from './registry'
import '@luma/cockpit/style.css'

/***********************驾驶舱路由承载组件*********************/

const route = useRoute()
const router = useRouter()

const cockpitId = computed(() => (route.params.cockpitId as string | undefined) ?? 'admin-demo-cockpit')
const canEdit = computed(() => permissionStore.hasPermission('cockpit:edit'))

const config = shallowRef<CockpitConfig | null>(null)
const loading = ref(true)
const loadError = ref<string>('')

const designerVisible = ref(false)
const saving = ref(false)
const saveError = ref<string>('')

const activeLayoutId = ref<string | undefined>()
const viewportMode = ref<CockpitViewportMode>('scale')

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    config.value = await adminCockpitRepository.load(cockpitId.value)
  }
  catch (error) {
    loadError.value = error instanceof Error ? error.message : '加载失败'
  }
  finally {
    loading.value = false
  }
}

watchEffect(() => {
  void load()
})

function backToAdmin(): void {
  void router.push('/dashboard')
}

function openDesigner(): void {
  if (canEdit.value)
    designerVisible.value = true
}

function closeDesigner(): void {
  designerVisible.value = false
  saveError.value = ''
}

async function handleSave(payload: CockpitDesignerSavePayload): Promise<void> {
  saving.value = true
  saveError.value = ''
  try {
    // 保存成功后用服务端返回配置替换当前运行配置
    config.value = await adminCockpitRepository.save(payload.config)
    designerVisible.value = false
  }
  catch (error) {
    // 保存失败：保持正式配置与 Designer 草稿，展示可重试错误
    saveError.value = error instanceof Error ? error.message : '保存失败'
  }
  finally {
    saving.value = false
  }
}

const cockpitRef = ref<InstanceType<typeof LumaCockpit> | null>(null)
async function toggleFullscreen(): Promise<void> {
  await cockpitRef.value?.enterFullscreen()
}
</script>

<template>
  <div class="admin-cockpit-view">
    <div v-if="loading" class="admin-cockpit-view__state" role="status">
      驾驶舱加载中…
    </div>

    <div v-else-if="loadError" class="admin-cockpit-view__state" role="alert">
      <p>{{ loadError }}</p>
      <ElButton @click="load">
        <LumaIcon name="luma:refresh" :size="15" />
        重试
      </ElButton>
    </div>

    <template v-else-if="config">
      <LumaCockpit
        ref="cockpitRef"
        v-model:active-layout-id="activeLayoutId"
        :config="config"
        :registry="adminCockpitRegistry"
        :viewport-mode="viewportMode"
        @configure="openDesigner"
      >
        <template #header-title="{ title }">
          <div class="admin-cockpit-view__heading">
            <h1>{{ title }}</h1>
            <nav class="admin-cockpit-view__layouts" aria-label="布局选择">
              <ElButton
                v-for="layout in config.layouts"
                :key="layout.id"
                :class="{ 'is-active': (activeLayoutId ?? config.activeLayoutId) === layout.id }"
                @click="activeLayoutId = layout.id"
              >
                {{ layout.title }}
              </ElButton>
            </nav>
          </div>
        </template>
        <!-- 应用提供的顶部操作：返回、全屏、配置入口 -->
        <template #header-actions>
          <div class="admin-cockpit-view__actions">
            <ElButton data-action="cockpit-back" aria-label="返回 Admin" @click="backToAdmin">
              返回
            </ElButton>
            <ElTooltip content="进入全屏">
              <ElButton circle data-action="cockpit-fullscreen" aria-label="进入全屏" @click="toggleFullscreen">
                <LumaIcon name="luma:fullscreen" :size="18" />
              </ElButton>
            </ElTooltip>
            <ElTooltip :content="viewportMode === 'scale' ? '当前：等比缩放' : '当前：VW/VH 适配'">
              <ElButton circle aria-label="切换大屏适配模式" @click="viewportMode = viewportMode === 'scale' ? 'vwvh' : 'scale'">
                <LumaIcon name="luma:screen" :size="18" />
              </ElButton>
            </ElTooltip>
            <ElTooltip v-if="canEdit" content="进入配置模式">
              <ElButton circle data-action="cockpit-configure" aria-label="进入配置模式" @click="openDesigner">
                <LumaIcon name="luma:settings" :size="18" />
              </ElButton>
            </ElTooltip>
          </div>
        </template>
        <template #center="{ context }">
          <StubCenter :context="context" />
        </template>
      </LumaCockpit>

      <!-- 全屏设计模式：应用决定承载方式 -->
      <div
        v-if="designerVisible"
        class="admin-cockpit-view__designer"
        role="dialog"
        aria-label="驾驶舱配置"
      >
        <LumaCockpitDesigner
          :config="config"
          :registry="adminCockpitRegistry"
          :saving="saving"
          :save-error="saveError"
          @save="handleSave"
          @cancel="closeDesigner"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-cockpit-view {
  position: fixed;
  inset: 0;
  background: var(--luma-cockpit-bg, #10131a);
}

.admin-cockpit-view__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  color: var(--el-text-color-primary, #e5eaf3);
}

.admin-cockpit-view__actions {
  display: flex;
  gap: 8px;
}

.admin-cockpit-view__heading,
.admin-cockpit-view__layouts {
  display: flex;
  align-items: center;
}

.admin-cockpit-view__heading {
  gap: 24px;
}

.admin-cockpit-view__heading h1 {
  margin: 0;
  font: inherit;
}

.admin-cockpit-view__layouts {
  gap: 8px;
}

.admin-cockpit-view__layouts :deep(.el-button) {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--luma-cockpit-border);
  border-radius: 6px;
  background: var(--luma-cockpit-floating-bg);
  color: inherit;
  cursor: pointer;
}

.admin-cockpit-view__layouts :deep(.el-button.is-active) {
  border-color: var(--luma-cockpit-accent);
  box-shadow: inset 0 -2px 0 var(--luma-cockpit-accent);
}

.admin-cockpit-view__actions :deep(.el-button) {
  min-height: 44px;
  min-width: 44px;
  padding: 4px 12px;
  cursor: pointer;
}

.admin-cockpit-view__designer {
  position: fixed;
  inset: 0;
  z-index: 2050;
}
</style>
