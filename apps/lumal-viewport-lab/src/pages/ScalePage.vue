<script setup lang="ts">
import type { ViewportPolicy } from '@lumal/viewport'
import { LumalViewport } from '@lumal/viewport'
import { ElButton, ElDialog, ElOption, ElSelect, ElTooltip } from 'element-plus'
import { computed, shallowRef } from 'vue'
import { useRoute } from 'vue-router'

/***********************只缩放独立设计画布*********************/
const route = useRoute()
const policy = computed<ViewportPolicy>(() => ({
  mode: route.params.mode === 'width' ? 'width' : 'contain',
  designWidth: 1280,
  designHeight: 720,
  minFontSize: 14,
}))
const clicks = shallowRef(0)
const dialog = shallowRef(false)
const selected = shallowRef('all')
</script>

<template>
  <section class="scale-page" data-testid="scale-page">
    <LumalViewport :policy="policy" data-testid="scale-host">
      <div class="scale-canvas" data-testid="scale-canvas">
        <h1>{{ policy.mode === 'width' ? '按宽度缩放' : '等比完整缩放' }}</h1>
        <div class="scale-controls">
          <ElButton data-testid="scale-hotspot" @click="clicks++">
            计数 {{ clicks }}
          </ElButton>
          <ElSelect v-model="selected" aria-label="画布分组" data-testid="scale-select">
            <ElOption label="全部画布" value="all" />
            <ElOption label="画布分组 A" value="a" />
          </ElSelect>
          <ElTooltip content="局部画布详情" placement="bottom">
            <ElButton data-testid="scale-dialog-trigger" @click="dialog = true">
              画布详情
            </ElButton>
          </ElTooltip>
        </div>
        <output data-testid="scale-selection" class="scale-selection">{{ selected }}</output>
        <span class="scale-corner" data-testid="scale-corner">1280 x 720</span>
        <ElDialog v-model="dialog" title="局部画布详情" width="min(520px, 94vw)" append-to-body destroy-on-close>
          <ElButton data-testid="scale-dialog-action" @click="clicks++">
            画布计数 {{ clicks }}
          </ElButton>
        </ElDialog>
      </div>
    </LumalViewport>
  </section>
</template>

<style scoped>
.scale-page { width: 100%; height: 100%; min-width: 0; min-height: 0; padding: 16px; }
.scale-canvas { position: relative; width: 1280px; height: 720px; background: #d8ebe5; border: 4px solid #33755f; color: #173c30; }
.scale-canvas h1 { margin: 36px 48px; font-size: max(24px, var(--lumal-viewport-min-font-size)); }
.scale-controls { position: absolute; top: 144px; left: 48px; display: flex; align-items: center; gap: 24px; --el-font-size-base: max(16px, var(--lumal-viewport-min-font-size)); --el-component-size: max(40px, calc(36px / var(--lumal-viewport-scale))); }
.scale-controls :deep(.el-button) { min-height: max(40px, calc(36px / var(--lumal-viewport-scale))); font-size: var(--el-font-size-base); }
.scale-controls :deep(.el-select) { width: max(220px, calc(180px / var(--lumal-viewport-scale))); font-size: var(--el-font-size-base); }
.scale-controls :deep(.el-select__wrapper) { min-height: max(40px, calc(36px / var(--lumal-viewport-scale))); font-size: var(--el-font-size-base); line-height: 1.5; }
.scale-selection { position: absolute; top: 260px; left: 48px; font-size: max(16px, var(--lumal-viewport-min-font-size)); }
.scale-corner { position: absolute; right: 20px; bottom: 20px; font-size: max(16px, var(--lumal-viewport-min-font-size)); }
</style>
