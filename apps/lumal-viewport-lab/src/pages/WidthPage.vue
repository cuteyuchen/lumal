<script setup lang="ts">
import { useViewportWidth, viewportLength } from '@lumal/viewport'
import { ElButton, ElDialog, ElOption, ElSelect, ElTooltip } from 'element-plus'
import { shallowRef } from 'vue'

/***********************交互与数字设计尺寸*********************/
const viewport = useViewportWidth()
const clicks = shallowRef(0)
const dialog = shallowRef(false)
const selected = shallowRef('all')
</script>

<template>
  <section class="width-page" data-testid="width-page">
    <h1>统一宽度适配</h1>
    <div class="width-controls">
      <ElButton data-testid="width-hotspot" @click="clicks++">
        计数 {{ clicks }}
      </ElButton>
      <ElSelect v-model="selected" data-testid="width-select" aria-label="画布分组" style="width: 220px">
        <ElOption label="全部画布" value="all" />
        <ElOption label="画布分组 A" value="a" />
      </ElSelect>
      <ElTooltip content="业务面板详情">
        <ElButton data-testid="width-dialog-trigger" @click="dialog = true">
          画布详情
        </ElButton>
      </ElTooltip>
    </div>
    <div class="width-probe" data-testid="width-probe" style="width: 192px; height: 96px">
      <span>14px / 20px</span>
    </div>
    <output data-testid="numeric-width">{{ viewport.pixels(192) }}</output>
    <output data-testid="width-selection">{{ selected }}</output>
    <ElDialog v-model="dialog" title="业务面板详情" :width="viewportLength(520)" append-to-body destroy-on-close>
      <ElButton data-testid="width-dialog-action" @click="clicks++">
        画布计数 {{ clicks }}
      </ElButton>
    </ElDialog>
  </section>
</template>

<style scoped>
.width-page { width: 1280px; min-height: 900px; padding: 48px; background: #d8ebe5; border: 4px solid #33755f; color: #173c30; }
.width-page h1 { margin: 0 0 36px; font-size: 24px; line-height: 32px; }
.width-controls { display: flex; align-items: center; gap: 24px; }
.width-probe { display: grid; place-items: center; margin: 24px 0; background: #fff; font-size: 14px; line-height: 20px; }
</style>
