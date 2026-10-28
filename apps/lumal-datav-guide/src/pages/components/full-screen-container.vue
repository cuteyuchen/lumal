<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumalFullScreenContainer } from '@lumal/datav'
import { reactive } from 'vue'
import CodeBlock from '@/components/CodeBlock.vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

/***********************真实嵌入示例*********************/
const playModel = reactive<Record<string, unknown>>({ width: 640, height: 360, overflow: 'auto' })
const controls: PlaygroundControl[] = [
  { key: 'width', label: '内容宽度', type: 'number', min: 192, max: 1920, step: 48 },
  { key: 'height', label: '内容高度', type: 'number', min: 96, max: 1080, step: 24 },
  { key: 'overflow', label: '溢出', type: 'select', options: [{ label: '滚动', value: 'auto' }, { label: '裁切', value: 'hidden' }] },
]
const usage = `<script setup lang="ts">
import { LumalFullScreenContainer } from '@lumal/datav'
<\/script>

<template>
  <LumalFullScreenContainer :height="1080">
    <div style="width: 382px; height: 210px; padding: 24px">面板</div>
  </LumalFullScreenContainer>
<\/template>`
const rows: PropRow[] = [
  { name: 'width', type: 'number', default: '项目设计宽度', description: '内容设计 px，不改变项目设计基准。' },
  { name: 'height', type: 'number', default: '自然高度', description: '内容设计 px，也只按项目宽度转换。' },
  { name: 'embedded', type: 'boolean', default: 'false', description: '嵌入普通容器，不改变 vw 基准。' },
  { name: 'overflow', type: '\'auto\' | \'hidden\'', default: '\'auto\'', description: '高度不足默认滚动，可显式裁切。' },
  { name: 'zIndex', type: 'number', default: '999', description: '容器层级。' },
]
</script>

<template>
  <ComponentDoc
    title="FullScreenContainer 全屏容器"
    component-name="LumalFullScreenContainer"
    datav-name="fullScreenContainer"
    intro="承载正常文档流内容，不施加整画布缩放。项目在 Vite 中配置一次设计宽度，业务继续写 px。"
  >
    <Playground v-model="playModel" title="真实组件" component-name="LumalFullScreenContainer" :controls="controls" :min-height="280">
      <div class="fsc-host">
        <LumalFullScreenContainer
          embedded
          :width="Number(playModel.width)"
          :height="Number(playModel.height)"
          :overflow="playModel.overflow === 'hidden' ? 'hidden' : 'auto'"
          :z-index="0"
        >
          <div class="fsc-panel">
            <strong>{{ playModel.width }} × {{ playModel.height }}</strong>
            <button type="button">
              业务面板
            </button>
          </div>
        </LumalFullScreenContainer>
      </div>
    </Playground>
    <h2>项目配置</h2>
    <p>在 createViewportTransformPlugin 中启用转换并设置 viewportWidth。容器无需模式属性，也不读取 screen 或设备像素比；同宽不同高只改变可用滚动区域，不改变设计尺寸。</p>
    <CodeBlock :code="usage" language="vue" />
    <p>嵌入时添加 embedded。与 Cockpit 组合不会重复缩放；不要在外层再使用 transform 或 CSS zoom。未启用项目转换时保持普通 px。</p>
    <PropsTable :rows="rows" />
  </ComponentDoc>
</template>

<style scoped>
.fsc-host { width: 100%; height: 260px; border: 1px solid #547c87; }
.fsc-panel { display: grid; align-content: start; gap: 20px; width: 100%; min-height: 100%; padding: 24px; color: #e6f7ff; background: #193d42; }
.fsc-panel strong { font-size: 24px; line-height: 32px; }
.fsc-panel button { width: 192px; height: 48px; color: #173d34; background: #8ce2bc; border: 1px solid #8ce2bc; }
</style>
