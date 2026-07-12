<script setup lang="ts">
import type { CockpitConfig, CockpitDesignerSavePayload } from '@luma/cockpit'
import { LumaCockpitDesigner } from '@luma/cockpit/designer'
import { LumaCockpit } from '@luma/cockpit/runtime'
import { computed, ref, shallowRef, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { permissionStore } from '../services/permission'
import { adminCockpitRepository } from './api/cockpit'
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

const activeCategoryId = ref<string | undefined>()
const activePageId = ref<string | undefined>()

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
      <button type="button" @click="load">
        重试
      </button>
    </div>

    <template v-else-if="config">
      <LumaCockpit
        ref="cockpitRef"
        v-model:active-category-id="activeCategoryId"
        v-model:active-page-id="activePageId"
        :config="config"
        :registry="adminCockpitRegistry"
        @configure="openDesigner"
      >
        <!-- 应用提供的顶部操作：返回、全屏、配置入口 -->
        <template #header-actions>
          <div class="admin-cockpit-view__actions">
            <button
              type="button"
              title="返回 Admin"
              aria-label="返回 Admin"
              data-action="cockpit-back"
              @click="backToAdmin"
            >
              返回
            </button>
            <button
              type="button"
              title="进入全屏"
              aria-label="进入全屏"
              data-action="cockpit-fullscreen"
              @click="toggleFullscreen"
            >
              全屏
            </button>
            <button
              v-if="canEdit"
              type="button"
              title="进入配置模式"
              aria-label="进入配置模式"
              data-action="cockpit-configure"
              @click="openDesigner"
            >
              配置
            </button>
          </div>
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

.admin-cockpit-view__actions button {
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
