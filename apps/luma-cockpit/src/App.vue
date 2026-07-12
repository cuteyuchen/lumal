<script setup lang="ts">
import type { CockpitConfig, CockpitDesignerSavePayload } from '@luma/cockpit'
import { LumaCockpitDesigner } from '@luma/cockpit/designer'
import { LumaCockpit } from '@luma/cockpit/runtime'
import { ref, shallowRef } from 'vue'
import { standaloneCockpitRegistry } from './registry'
import { loadStandaloneConfig, saveStandaloneConfig } from './services/config'

/***********************独立驾驶舱根组件*********************/

const config = shallowRef<CockpitConfig>(loadStandaloneConfig())
const designerVisible = ref(false)
const saving = ref(false)
const saveError = ref<string>('')

const activeCategoryId = ref<string | undefined>()
const activePageId = ref<string | undefined>()

function openDesigner(): void {
  designerVisible.value = true
}

function closeDesigner(): void {
  designerVisible.value = false
  saveError.value = ''
}

function handleSave(payload: CockpitDesignerSavePayload): void {
  saving.value = true
  saveError.value = ''
  try {
    config.value = saveStandaloneConfig(payload.config)
    designerVisible.value = false
  }
  catch (error) {
    saveError.value = error instanceof Error ? error.message : '保存失败'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="standalone-app">
    <LumaCockpit
      v-model:active-category-id="activeCategoryId"
      v-model:active-page-id="activePageId"
      :config="config"
      :registry="standaloneCockpitRegistry"
      @configure="openDesigner"
    >
      <template #header-actions>
        <button
          type="button"
          data-action="cockpit-configure"
          @click="openDesigner"
        >
          配置
        </button>
      </template>
    </LumaCockpit>

    <div
      v-if="designerVisible"
      class="standalone-app__designer"
      role="dialog"
      aria-label="驾驶舱配置"
    >
      <LumaCockpitDesigner
        :config="config"
        :registry="standaloneCockpitRegistry"
        :saving="saving"
        :save-error="saveError"
        @save="handleSave"
        @cancel="closeDesigner"
      />
    </div>
  </div>
</template>

<style scoped>
.standalone-app {
  position: fixed;
  inset: 0;
}

.standalone-app__designer {
  position: fixed;
  inset: 0;
  z-index: 2050;
}

.standalone-app :deep(button[data-action='cockpit-configure']) {
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
}
</style>
